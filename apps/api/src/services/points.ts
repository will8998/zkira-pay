import { db } from '../db/index.js';
import { pointLedger, pointBalances, pointsConfig, users, payments, transactions, invoices, referrals } from '../db/schema.js';
import { eq, desc, sql, count, sum, and, gte, lt, asc, ne } from 'drizzle-orm';

// Default config values
const DEFAULT_CONFIG = {
  global_multiplier: '1',
  send_rate: '10',
  receive_rate: '5',
  invoice_create_bonus: '2',
  invoice_paid_rate: '5',
  escrow_create_bonus: '3',
  referral_signup_bonus: '50',
  referral_welcome_bonus: '25',
  referral_commission_rate: '0.10',
  min_qualifying_amount: '1',
  velocity_limit: '20',
  streak_multiplier_2w: '1.2',
  streak_multiplier_4w: '1.5',
  streak_multiplier_8w: '2.0',
};

// Tier thresholds based on rank
const TIER_THRESHOLDS = {
  phantom: 10,
  shadow: 50,
  ghost: 100,
  agent: 500,
  operative: Infinity,
};

// Helper to get ISO week string (e.g., "2026-W09")
function getISOWeek(date: Date = new Date()): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

// Helper to get start and end of ISO week
function getISOWeekBounds(weekString: string): { start: Date; end: Date } {
  const [year, week] = weekString.split('-W').map(Number);
  const startOfYear = new Date(year, 0, 1);
  const startOfWeek = new Date(startOfYear.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  return { start: startOfWeek, end: endOfWeek };
}

// Get current config value with defaults
export async function getConfigValue(key: string): Promise<string> {
  try {
    const result = await db.select({ value: pointsConfig.value })
      .from(pointsConfig)
      .where(eq(pointsConfig.key, key))
      .limit(1);
    
    if (result.length > 0) {
      return result[0].value;
    }
    
    return DEFAULT_CONFIG[key as keyof typeof DEFAULT_CONFIG] || '0';
  } catch (error) {
    console.error(`Failed to get config value for ${key}:`, error);
    return DEFAULT_CONFIG[key as keyof typeof DEFAULT_CONFIG] || '0';
  }
}

// Calculate points for an event using config multipliers
export async function calculatePoints(eventType: string, baseAmount: number): Promise<number> {
  try {
    const globalMultiplier = parseFloat(await getConfigValue('global_multiplier'));
    const minQualifyingAmount = parseFloat(await getConfigValue('min_qualifying_amount'));
    
    // Check minimum qualifying amount
    if (baseAmount < minQualifyingAmount) {
      return 0;
    }
    
    let points = 0;
    
    switch (eventType) {
      case 'PAYMENT_SENT':
        const sendRate = parseFloat(await getConfigValue('send_rate'));
        points = baseAmount * sendRate;
        break;
      case 'PAYMENT_RECEIVED':
        const receiveRate = parseFloat(await getConfigValue('receive_rate'));
        points = baseAmount * receiveRate;
        break;
      case 'INVOICE_CREATED':
        points = parseFloat(await getConfigValue('invoice_create_bonus'));
        break;
      case 'INVOICE_PAID':
        const invoicePaidRate = parseFloat(await getConfigValue('invoice_paid_rate'));
        points = baseAmount * invoicePaidRate;
        break;
      case 'ESCROW_CREATED':
        points = parseFloat(await getConfigValue('escrow_create_bonus'));
        break;
      case 'REFERRAL_SIGNUP':
        points = parseFloat(await getConfigValue('referral_signup_bonus'));
        break;
      case 'REFERRAL_WELCOME':
        points = parseFloat(await getConfigValue('referral_welcome_bonus'));
        break;
      case 'REFERRAL_COMMISSION':
        const commissionRate = parseFloat(await getConfigValue('referral_commission_rate'));
        points = baseAmount * commissionRate;
        break;
      default:
        points = baseAmount;
    }
    
    return Math.round(points * globalMultiplier);
  } catch (error) {
    console.error(`Failed to calculate points for ${eventType}:`, error);
    return 0;
  }
}

// Anti-gaming: check velocity (max events per hour per wallet)
export async function checkVelocity(walletAddress: string): Promise<boolean> {
  try {
    const velocityLimit = parseInt(await getConfigValue('velocity_limit'));
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentEvents = await db.select({ count: count() })
      .from(pointLedger)
      .where(
        and(
          eq(pointLedger.walletAddress, walletAddress),
          gte(pointLedger.createdAt, oneHourAgo)
        )
      );
    
    const eventCount = recentEvents[0]?.count || 0;
    return eventCount < velocityLimit;
  } catch (error) {
    console.error(`Failed to check velocity for ${walletAddress}:`, error);
    return false;
  }
}

// Update streak for wallet
export async function updateStreak(walletAddress: string): Promise<number> {
  try {
    const currentWeek = getISOWeek();
    const lastWeek = getISOWeek(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    // Get current balance record
    const balanceRecord = await db.select()
      .from(pointBalances)
      .where(eq(pointBalances.walletAddress, walletAddress))
      .limit(1);
    
    let currentStreak = 0;
    
    if (balanceRecord.length > 0) {
      const record = balanceRecord[0];
      const lastActiveWeek = record.lastActiveWeek;
      
      if (lastActiveWeek === lastWeek) {
        // Consecutive week, increment streak
        currentStreak = record.streakWeeks + 1;
      } else if (lastActiveWeek === currentWeek) {
        // Same week, maintain streak
        currentStreak = record.streakWeeks;
      } else {
        // Gap in activity, reset streak
        currentStreak = 1;
      }
    } else {
      // First time, start streak
      currentStreak = 1;
    }
    
    // Update the balance record
    await db.insert(pointBalances)
      .values({
        walletAddress,
        streakWeeks: currentStreak,
        lastActiveWeek: currentWeek,
      })
      .onConflictDoUpdate({
        target: pointBalances.walletAddress,
        set: {
          streakWeeks: currentStreak,
          lastActiveWeek: currentWeek,
          updatedAt: new Date(),
        },
      });
    
    return currentStreak;
  } catch (error) {
    console.error(`Failed to update streak for ${walletAddress}:`, error);
    return 0;
  }
}

// Award points for an event
export async function awardPoints(params: {
  walletAddress: string;
  eventType: string;
  basePoints: number;
  metadata?: Record<string, any>;
  referenceId?: string;
}): Promise<{ points: number; newBalance: number } | null> {
  try {
    const { walletAddress, eventType, basePoints, metadata = {}, referenceId } = params;
    
    // Ensure user exists in users table (FK constraint on point_ledger, point_balances)
    await db.insert(users).values({
      walletAddress,
    }).onConflictDoUpdate({
      target: users.walletAddress,
      set: {
        lastSeen: new Date(),
      },
    });
    
    // Check if wallet is flagged
    const balanceRecord = await db.select({ flagged: pointBalances.flagged })
      .from(pointBalances)
      .where(eq(pointBalances.walletAddress, walletAddress))
      .limit(1);
    
    if (balanceRecord.length > 0 && balanceRecord[0].flagged) {
      return null; // Flagged wallet, no points
    }
    
    // Check for duplicate reference ID (idempotency)
    if (referenceId) {
      const existingEvent = await db.select({ id: pointLedger.id })
        .from(pointLedger)
        .where(eq(pointLedger.referenceId, referenceId))
        .limit(1);
      
      if (existingEvent.length > 0) {
        return null; // Already processed
      }
    }
    
    // Check velocity limits
    const velocityOk = await checkVelocity(walletAddress);
    if (!velocityOk) {
      return null; // Velocity limit exceeded
    }
    
    // Calculate final points with multipliers
    const globalMultiplier = parseFloat(await getConfigValue('global_multiplier'));
    
    // Update streak and get current streak
    const streakWeeks = await updateStreak(walletAddress);
    
    // Apply streak multiplier
    let streakMultiplier = 1;
    if (streakWeeks >= 8) {
      streakMultiplier = parseFloat(await getConfigValue('streak_multiplier_8w'));
    } else if (streakWeeks >= 4) {
      streakMultiplier = parseFloat(await getConfigValue('streak_multiplier_4w'));
    } else if (streakWeeks >= 2) {
      streakMultiplier = parseFloat(await getConfigValue('streak_multiplier_2w'));
    }
    
    const finalPoints = Math.round(basePoints * globalMultiplier * streakMultiplier);
    
    // Insert ledger event
    await db.insert(pointLedger).values({
      walletAddress,
      eventType,
      points: finalPoints.toString(),
      metadata: {
        ...metadata,
        globalMultiplier,
        streakMultiplier,
        streakWeeks,
      },
      referenceId,
    });
    
    // Refresh balance for this wallet
    await refreshBalance(walletAddress);
    
    // Get new balance
    const newBalanceRecord = await db.select({ totalPoints: pointBalances.totalPoints })
      .from(pointBalances)
      .where(eq(pointBalances.walletAddress, walletAddress))
      .limit(1);
    
    const newBalance = newBalanceRecord.length > 0 ? parseFloat(newBalanceRecord[0].totalPoints) : 0;
    
    return { points: finalPoints, newBalance };
  } catch (error) {
    console.error('Failed to award points:', error);
    return null;
  }
}

// Update cached balances for a wallet (sum from ledger)
export async function refreshBalance(walletAddress: string): Promise<void> {
  try {
    // Calculate total points from ledger
    const totalResult = await db.select({ total: sum(pointLedger.points) })
      .from(pointLedger)
      .where(eq(pointLedger.walletAddress, walletAddress));
    
    const totalPoints = totalResult[0]?.total || '0';
    
    // Calculate weekly points (current ISO week)
    const currentWeek = getISOWeek();
    const { start: weekStart } = getISOWeekBounds(currentWeek);
    
    const weeklyResult = await db.select({ total: sum(pointLedger.points) })
      .from(pointLedger)
      .where(
        and(
          eq(pointLedger.walletAddress, walletAddress),
          gte(pointLedger.createdAt, weekStart)
        )
      );
    
    const weeklyPoints = weeklyResult[0]?.total || '0';
    
    // Upsert balance record
    await db.insert(pointBalances)
      .values({
        walletAddress,
        totalPoints,
        weeklyPoints,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pointBalances.walletAddress,
        set: {
          totalPoints,
          weeklyPoints,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error(`Failed to refresh balance for ${walletAddress}:`, error);
  }
}

// Refresh ALL balances and ranks (for weekly drops / admin recalc)
export async function refreshAllBalances(): Promise<void> {
  try {
    // Get all unique wallet addresses from ledger
    const wallets = await db.selectDistinct({ walletAddress: pointLedger.walletAddress })
      .from(pointLedger);
    
    // Refresh each wallet's balance
    for (const wallet of wallets) {
      await refreshBalance(wallet.walletAddress);
    }
    
    // Update ranks based on total points
    const rankedWallets = await db.select({
      walletAddress: pointBalances.walletAddress,
      totalPoints: pointBalances.totalPoints,
    })
      .from(pointBalances)
      .orderBy(desc(pointBalances.totalPoints));
    
    // Update ranks and tiers
    for (let i = 0; i < rankedWallets.length; i++) {
      const rank = i + 1;
      const wallet = rankedWallets[i];
      
      // Determine tier based on rank
      let tier = 'operative';
      if (rank <= TIER_THRESHOLDS.phantom) tier = 'phantom';
      else if (rank <= TIER_THRESHOLDS.shadow) tier = 'shadow';
      else if (rank <= TIER_THRESHOLDS.ghost) tier = 'ghost';
      else if (rank <= TIER_THRESHOLDS.agent) tier = 'agent';
      
      await db.update(pointBalances)
        .set({ rank, tier, updatedAt: new Date() })
        .where(eq(pointBalances.walletAddress, wallet.walletAddress));
    }
  } catch (error) {
    console.error('Failed to refresh all balances:', error);
  }
}

// Get leaderboard (top N, by period)
export async function getLeaderboard(params: {
  limit?: number;
  offset?: number;
  period?: 'all_time' | 'weekly';
  sortBy?: 'points' | 'volume';
}): Promise<Array<{
  walletAddress: string;
  totalPoints: string;
  weeklyPoints: string;
  rank: number | null;
  tier: string;
  streakWeeks: number;
}>> {
  try {
    const { limit = 100, offset = 0, period = 'all_time', sortBy = 'points' } = params;
    
    let orderBy;
    if (period === 'weekly') {
      orderBy = desc(pointBalances.weeklyPoints);
    } else {
      orderBy = desc(pointBalances.totalPoints);
    }
    
    const leaderboard = await db.select({
      walletAddress: pointBalances.walletAddress,
      totalPoints: pointBalances.totalPoints,
      weeklyPoints: pointBalances.weeklyPoints,
      rank: pointBalances.rank,
      tier: pointBalances.tier,
      streakWeeks: pointBalances.streakWeeks,
    })
      .from(pointBalances)
      .where(ne(pointBalances.flagged, true))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);
    
    return leaderboard;
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    return [];
  }
}

// Get user's position and percentile
export async function getUserPosition(walletAddress: string): Promise<{
  rank: number;
  percentile: number;
  tier: string;
  totalPoints: string;
  weeklyPoints: string;
  streakWeeks: number;
} | null> {
  try {
    const userRecord = await db.select()
      .from(pointBalances)
      .where(eq(pointBalances.walletAddress, walletAddress))
      .limit(1);
    
    if (userRecord.length === 0) {
      return null;
    }
    
    const user = userRecord[0];
    
    // Get total number of users for percentile calculation
    const totalUsersResult = await db.select({ count: count() })
      .from(pointBalances)
      .where(ne(pointBalances.flagged, true));
    
    const totalUsers = totalUsersResult[0]?.count || 1;
    const rank = user.rank || totalUsers;
    const percentile = Math.round(((totalUsers - rank + 1) / totalUsers) * 100);
    
    return {
      rank,
      percentile,
      tier: user.tier,
      totalPoints: user.totalPoints,
      weeklyPoints: user.weeklyPoints,
      streakWeeks: user.streakWeeks,
    };
  } catch (error) {
    console.error(`Failed to get user position for ${walletAddress}:`, error);
    return null;
  }
}

// Preview weekly drop (calculate but don't insert)
export async function previewWeeklyDrop(config: {
  sendRate: number;
  receiveRate: number;
  txBonus: number;
  refBonus: number;
}): Promise<Array<{ wallet: string; points: number; breakdown: object }>> {
  try {
    const currentWeek = getISOWeek();
    const { start: weekStart, end: weekEnd } = getISOWeekBounds(currentWeek);
    
    // Get all transactions for current week
    const weeklyTransactions = await db.select({
      walletAddress: transactions.walletAddress,
      type: transactions.type,
      amount: transactions.amount,
    })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, weekStart),
          lt(transactions.createdAt, weekEnd)
        )
      );
    
    // Group by wallet and calculate points
    const walletStats: Record<string, {
      volumeSent: number;
      volumeReceived: number;
      paymentCount: number;
    }> = {};
    
    for (const tx of weeklyTransactions) {
      if (!walletStats[tx.walletAddress]) {
        walletStats[tx.walletAddress] = {
          volumeSent: 0,
          volumeReceived: 0,
          paymentCount: 0,
        };
      }
      
      const amount = parseFloat(tx.amount);
      if (tx.type === 'sent') {
        walletStats[tx.walletAddress].volumeSent += amount;
      } else if (tx.type === 'received') {
        walletStats[tx.walletAddress].volumeReceived += amount;
      }
      walletStats[tx.walletAddress].paymentCount++;
    }
    
    // Calculate points for each wallet
    const preview = Object.entries(walletStats).map(([wallet, stats]) => {
      const sendPoints = stats.volumeSent * config.sendRate;
      const receivePoints = stats.volumeReceived * config.receiveRate;
      const txPoints = stats.paymentCount * config.txBonus;
      const totalPoints = Math.round(sendPoints + receivePoints + txPoints);
      
      return {
        wallet,
        points: totalPoints,
        breakdown: {
          volumeSent: stats.volumeSent,
          volumeReceived: stats.volumeReceived,
          paymentCount: stats.paymentCount,
          sendPoints,
          receivePoints,
          txPoints,
        },
      };
    });
    
    return preview.filter(p => p.points > 0).sort((a, b) => b.points - a.points);
  } catch (error) {
    console.error('Failed to preview weekly drop:', error);
    return [];
  }
}

// Execute weekly drop (batch insert ledger events)
export async function executeWeeklyDrop(config: {
  sendRate: number;
  receiveRate: number;
  txBonus: number;
  refBonus: number;
}): Promise<{ usersAwarded: number; totalPoints: number }> {
  try {
    const preview = await previewWeeklyDrop(config);
    
    if (preview.length === 0) {
      return { usersAwarded: 0, totalPoints: 0 };
    }
    
    // Batch insert ledger events
    const ledgerEvents = preview.map(p => ({
      walletAddress: p.wallet,
      eventType: 'WEEKLY_DROP',
      points: p.points.toString(),
      metadata: p.breakdown,
      referenceId: `weekly_drop_${getISOWeek()}_${p.wallet}`,
    }));
    
    await db.insert(pointLedger).values(ledgerEvents);
    
    // Refresh all balances
    await refreshAllBalances();
    
    const totalPoints = preview.reduce((sum, p) => sum + p.points, 0);
    
    return {
      usersAwarded: preview.length,
      totalPoints,
    };
  } catch (error) {
    console.error('Failed to execute weekly drop:', error);
    return { usersAwarded: 0, totalPoints: 0 };
  }
}