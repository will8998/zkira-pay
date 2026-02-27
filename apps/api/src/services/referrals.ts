import { db } from '../db/index.js';
import { referralCodes, referrals, pointLedger, pointBalances, pointsConfig, users } from '../db/schema.js';
import { eq, desc, sql, count, sum, and, ne } from 'drizzle-orm';

/**
 * Get configuration value from pointsConfig table with fallback to default
 */
async function getConfig(key: string, defaultValue: string): Promise<string> {
  const result = await db.select().from(pointsConfig).where(eq(pointsConfig.key, key)).limit(1);
  return result.length > 0 ? result[0].value : defaultValue;
}

/**
 * Generate a random 2-character suffix for collision resolution
 */
function generateRandomSuffix(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return chars.charAt(Math.floor(Math.random() * chars.length)) + 
         chars.charAt(Math.floor(Math.random() * chars.length));
}

/**
 * Generate a referral code for a wallet (PRIV-{first4})
 * If wallet already has a code, return existing
 */
export async function getOrCreateReferralCode(walletAddress: string): Promise<string> {
  // Check if wallet already has a code
  const existingCode = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.walletAddress, walletAddress))
    .limit(1);

  if (existingCode.length > 0) {
    return existingCode[0].code;
  }

  // Ensure user exists in users table (FK constraint on referral_codes)
  await db.insert(users).values({
    walletAddress,
  }).onConflictDoUpdate({
    target: users.walletAddress,
    set: {
      lastSeen: new Date(),
    },
  });

  // Generate new code: PRIV-{first4}
  const baseCode = `PRIV-${walletAddress.slice(0, 4)}`;
  let finalCode = baseCode;

  // Handle collisions by appending random suffix
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      // Try to insert the code
      const result = await db
        .insert(referralCodes)
        .values({
          code: finalCode,
          walletAddress,
          isCustom: false,
        })
        .returning();

      return result[0].code;
    } catch (error: any) {
      // If unique constraint violation (code already exists), try with suffix
      if (error.code === '23505' && error.constraint?.includes('referral_codes_pkey')) {
        finalCode = `${baseCode}${generateRandomSuffix()}`;
        attempts++;
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Failed to generate unique referral code after ${maxAttempts} attempts`);
}

/**
 * Apply a referral code — link referee to referrer
 * Returns null if: code doesn't exist, referee already has a referrer, self-referral
 */
export async function applyReferralCode(refereeWallet: string, code: string): Promise<{ referrerWallet: string } | null> {
  // Check if code exists
  const codeResult = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.code, code))
    .limit(1);

  if (codeResult.length === 0) {
    return null; // Code doesn't exist
  }

  const referrerWallet = codeResult[0].walletAddress;

  // Check for self-referral
  if (referrerWallet === refereeWallet) {
    return null; // Cannot self-refer
  }

  // Check if referee already has a referrer
  const existingReferral = await db
    .select()
    .from(referrals)
    .where(eq(referrals.refereeWallet, refereeWallet))
    .limit(1);

  if (existingReferral.length > 0) {
    return null; // Referee already has a referrer
  }

  try {
    // Ensure referee exists in users table (FK constraint on referrals)
    await db.insert(users).values({
      walletAddress: refereeWallet,
    }).onConflictDoUpdate({
      target: users.walletAddress,
      set: {
        lastSeen: new Date(),
      },
    });

    // Create the referral relationship
    await db.insert(referrals).values({
      referrerWallet,
      refereeWallet,
      referralCode: code,
      status: 'pending',
    });

    return { referrerWallet };
  } catch (error: any) {
    // Handle unique constraint violation (referee already referred)
    if (error.code === '23505' && error.constraint?.includes('referrals_referee_wallet_unique')) {
      return null;
    }
    throw error;
  }
}

/**
 * Activate a referral (called when referee makes first qualifying transaction)
 * Awards REFERRAL_SIGNUP bonus to referrer, REFERRAL_WELCOME bonus to referee
 */
export async function activateReferral(refereeWallet: string): Promise<boolean> {
  // Find the pending referral
  const referralResult = await db
    .select()
    .from(referrals)
    .where(and(
      eq(referrals.refereeWallet, refereeWallet),
      eq(referrals.status, 'pending')
    ))
    .limit(1);

  if (referralResult.length === 0) {
    return false; // No pending referral found
  }

  const referral = referralResult[0];

  // Get bonus amounts from config
  const [signupBonus, welcomeBonus] = await Promise.all([
    getConfig('referral_signup_bonus', '50'),
    getConfig('referral_welcome_bonus', '25'),
  ]);

  const signupPoints = parseFloat(signupBonus);
  const welcomePoints = parseFloat(welcomeBonus);

  try {
    // Start transaction
    await db.transaction(async (tx) => {
      // Update referral status
      await tx
        .update(referrals)
        .set({
          status: 'activated',
          activatedAt: new Date(),
        })
        .where(eq(referrals.id, referral.id));

      // Award REFERRAL_SIGNUP bonus to referrer
      await tx.insert(pointLedger).values({
        walletAddress: referral.referrerWallet,
        eventType: 'REFERRAL_SIGNUP',
        points: signupPoints.toString(),
        metadata: {
          refereeWallet: refereeWallet,
          referralCode: referral.referralCode,
        },
        referenceId: `referral_signup_${referral.id}`,
      });

      // Award REFERRAL_WELCOME bonus to referee
      await tx.insert(pointLedger).values({
        walletAddress: refereeWallet,
        eventType: 'REFERRAL_WELCOME',
        points: welcomePoints.toString(),
        metadata: {
          referrerWallet: referral.referrerWallet,
          referralCode: referral.referralCode,
        },
        referenceId: `referral_welcome_${referral.id}`,
      });
    });

    return true;
  } catch (error) {
    console.error('Failed to activate referral:', error);
    return false;
  }
}

/**
 * Process referral commission — called when any user earns points
 * If user has an active referrer, award commission to referrer
 */
export async function processReferralCommission(refereeWallet: string, earnedPoints: number, metadata: Record<string, any>): Promise<void> {
  // Find active referral for this user
  const referralResult = await db
    .select()
    .from(referrals)
    .where(and(
      eq(referrals.refereeWallet, refereeWallet),
      eq(referrals.status, 'activated')
    ))
    .limit(1);

  if (referralResult.length === 0) {
    return; // No active referral
  }

  const referral = referralResult[0];

  // Check if referrer is flagged
  const referrerBalance = await db
    .select()
    .from(pointBalances)
    .where(eq(pointBalances.walletAddress, referral.referrerWallet))
    .limit(1);

  if (referrerBalance.length > 0 && referrerBalance[0].flagged) {
    return; // Referrer is flagged, skip commission
  }

  // Get commission rate from config
  const commissionRateStr = await getConfig('referral_commission_rate', '0.10');
  const commissionRate = parseFloat(commissionRateStr);

  // Calculate commission
  const commissionAmount = earnedPoints * commissionRate;

  // Skip if commission is too small
  if (commissionAmount < 0.01) {
    return;
  }

  try {
    // Award commission to referrer
    await db.insert(pointLedger).values({
      walletAddress: referral.referrerWallet,
      eventType: 'REFERRAL_COMMISSION',
      points: commissionAmount.toString(),
      metadata: {
        refereeWallet: refereeWallet,
        referralCode: referral.referralCode,
        basePoints: earnedPoints,
        commissionRate: commissionRate,
        originalEventType: metadata.eventType || 'unknown',
        ...metadata,
      },
      referenceId: metadata.referenceId ? `commission_${metadata.referenceId}` : undefined,
    });
  } catch (error) {
    console.error('Failed to process referral commission:', error);
    // Don't throw - commission processing should not fail the main operation
  }
}

/**
 * Get referral stats for a wallet
 */
export async function getReferralStats(walletAddress: string): Promise<{
  code: string | null;
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalCommissionEarned: string;
  referees: Array<{
    wallet: string; // truncated: first4...last4
    status: string;
    activatedAt: string | null;
    createdAt: string;
  }>;
}> {
  // Get referral code for this wallet
  const codeResult = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.walletAddress, walletAddress))
    .limit(1);

  const code = codeResult.length > 0 ? codeResult[0].code : null;

  // Get referral counts
  const [totalReferralsResult, activeReferralsResult, pendingReferralsResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(referrals)
      .where(eq(referrals.referrerWallet, walletAddress)),
    db
      .select({ count: count() })
      .from(referrals)
      .where(and(
        eq(referrals.referrerWallet, walletAddress),
        eq(referrals.status, 'activated')
      )),
    db
      .select({ count: count() })
      .from(referrals)
      .where(and(
        eq(referrals.referrerWallet, walletAddress),
        eq(referrals.status, 'pending')
      )),
  ]);

  // Get total commission earned
  const commissionResult = await db
    .select({
      total: sum(pointLedger.points),
    })
    .from(pointLedger)
    .where(and(
      eq(pointLedger.walletAddress, walletAddress),
      eq(pointLedger.eventType, 'REFERRAL_COMMISSION')
    ));

  const totalCommissionEarned = commissionResult[0]?.total || '0';

  // Get referees list
  const refereesResult = await db
    .select({
      wallet: referrals.refereeWallet,
      status: referrals.status,
      activatedAt: referrals.activatedAt,
      createdAt: referrals.createdAt,
    })
    .from(referrals)
    .where(eq(referrals.referrerWallet, walletAddress))
    .orderBy(desc(referrals.createdAt));

  // Truncate wallet addresses for privacy
  const referees = refereesResult.map(referee => ({
    wallet: `${referee.wallet.slice(0, 4)}...${referee.wallet.slice(-4)}`,
    status: referee.status,
    activatedAt: referee.activatedAt?.toISOString() || null,
    createdAt: referee.createdAt.toISOString(),
  }));

  return {
    code,
    totalReferrals: totalReferralsResult[0]?.count || 0,
    activeReferrals: activeReferralsResult[0]?.count || 0,
    pendingReferrals: pendingReferralsResult[0]?.count || 0,
    totalCommissionEarned,
    referees,
  };
}

/**
 * Get referral by referee wallet (to check if user was referred)
 */
export async function getReferralByReferee(refereeWallet: string): Promise<{ referrerWallet: string; status: string } | null> {
  const result = await db
    .select({
      referrerWallet: referrals.referrerWallet,
      status: referrals.status,
    })
    .from(referrals)
    .where(eq(referrals.refereeWallet, refereeWallet))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Admin: get referral network overview
 */
export async function getReferralNetworkStats(): Promise<{
  totalReferralCodes: number;
  totalReferrals: number;
  activeReferrals: number;
  totalCommissionPaid: string;
  topReferrers: Array<{ wallet: string; referralCount: number; commissionEarned: string }>;
}> {
  // Get basic counts
  const [codesResult, totalReferralsResult, activeReferralsResult] = await Promise.all([
    db.select({ count: count() }).from(referralCodes),
    db.select({ count: count() }).from(referrals),
    db.select({ count: count() }).from(referrals).where(eq(referrals.status, 'activated')),
  ]);

  // Get total commission paid
  const commissionResult = await db
    .select({
      total: sum(pointLedger.points),
    })
    .from(pointLedger)
    .where(eq(pointLedger.eventType, 'REFERRAL_COMMISSION'));

  const totalCommissionPaid = commissionResult[0]?.total || '0';

  // Get top referrers
  const topReferrersResult = await db
    .select({
      wallet: referrals.referrerWallet,
      referralCount: count(referrals.id),
    })
    .from(referrals)
    .where(eq(referrals.status, 'activated'))
    .groupBy(referrals.referrerWallet)
    .orderBy(desc(count(referrals.id)))
    .limit(10);

  // Get commission earned for each top referrer
  const topReferrers = await Promise.all(
    topReferrersResult.map(async (referrer) => {
      const commissionResult = await db
        .select({
          total: sum(pointLedger.points),
        })
        .from(pointLedger)
        .where(and(
          eq(pointLedger.walletAddress, referrer.wallet),
          eq(pointLedger.eventType, 'REFERRAL_COMMISSION')
        ));

      return {
        wallet: referrer.wallet,
        referralCount: referrer.referralCount,
        commissionEarned: commissionResult[0]?.total || '0',
      };
    })
  );

  return {
    totalReferralCodes: codesResult[0]?.count || 0,
    totalReferrals: totalReferralsResult[0]?.count || 0,
    activeReferrals: activeReferralsResult[0]?.count || 0,
    totalCommissionPaid,
    topReferrers,
  };
}