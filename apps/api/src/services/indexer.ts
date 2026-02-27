import { Connection, PublicKey } from '@solana/web3.js';
import { sha256 } from '@noble/hashes/sha256';
import { GHOST_REGISTRY_PROGRAM_ID, PAYMENT_ESCROW_PROGRAM_ID } from '@zkira/common';
import {
  deserializeAnnouncement,
  deserializePaymentEscrow,
  deserializeMetaAddress,
  DeserializedAnnouncement,
  DeserializedEscrow,
  DeserializedMetaAddress,
} from './deserializer.js';
import { db } from '../db/index.js';
import { escrowsCache, announcementsCache, metaAddressesCache } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { awardPoints } from './points.js';
import { activateReferral } from './referrals.js';

export class AccountIndexer {
  private announcements: Map<string, DeserializedAnnouncement> = new Map();
  private escrows: Map<string, DeserializedEscrow> = new Map();
  private metaAddresses: Map<string, DeserializedMetaAddress> = new Map();
  private failedAccounts: Set<string> = new Set();
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(
    private connection: Connection,
    private intervalMs: number
  ) {}

  start(): void {
    console.log(`Starting account indexer with ${this.intervalMs}ms interval`);
    this.refresh().catch(console.error);
    this.intervalId = setInterval(() => {
      this.refresh().catch(console.error);
    }, this.intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('Account indexer stopped');
    }
  }

  private async refresh(): Promise<void> {
    try {
      console.log('Refreshing account data...');
      
      // Fetch all program accounts in parallel
      const [ghostAccounts, escrowAccounts] = await Promise.all([
        this.connection.getProgramAccounts(GHOST_REGISTRY_PROGRAM_ID),
        this.connection.getProgramAccounts(PAYMENT_ESCROW_PROGRAM_ID),
      ]);

      // Process ghost registry accounts (announcements and meta addresses)
      for (const account of ghostAccounts) {
        try {
          const data = Buffer.from(account.account.data);
          if (data.length < 8) continue;

          // Check discriminator to determine account type
          const discriminator = data.subarray(0, 8);
          const discriminatorHex = discriminator.toString('hex');

          // Try to deserialize as announcement first
          if (this.isAnnouncementDiscriminator(discriminatorHex)) {
            const announcement = deserializeAnnouncement(data);
            this.announcements.set(announcement.stealthAddress, announcement);
            
            // Upsert to database cache
            await db.insert(announcementsCache).values({
              stealthAddress: announcement.stealthAddress,
              ephemeralPubkey: announcement.ephemeralPubkey,
              tokenMint: announcement.tokenMint,
              encryptedMetadata: announcement.encryptedMetadata,
              timestamp: announcement.timestamp,
              bump: announcement.bump,
            }).onConflictDoUpdate({
              target: announcementsCache.stealthAddress,
              set: {
                ephemeralPubkey: announcement.ephemeralPubkey,
                tokenMint: announcement.tokenMint,
                encryptedMetadata: announcement.encryptedMetadata,
                timestamp: announcement.timestamp,
                bump: announcement.bump,
                updatedAt: new Date(),
              },
            }).catch(console.warn);
            
          } else if (this.isMetaAddressDiscriminator(discriminatorHex)) {
            const metaAddress = deserializeMetaAddress(data);
            this.metaAddresses.set(metaAddress.owner, metaAddress);
            
            // Upsert to database cache
            await db.insert(metaAddressesCache).values({
              owner: metaAddress.owner,
              spendPubkey: metaAddress.spendPubkey,
              viewPubkey: metaAddress.viewPubkey,
              label: metaAddress.label,
              bump: metaAddress.bump,
              createdAt: metaAddress.createdAt,
            }).onConflictDoUpdate({
              target: metaAddressesCache.owner,
              set: {
                spendPubkey: metaAddress.spendPubkey,
                viewPubkey: metaAddress.viewPubkey,
                label: metaAddress.label,
                bump: metaAddress.bump,
                createdAt: metaAddress.createdAt,
                updatedAt: new Date(),
              },
            }).catch(console.warn);
          }
        } catch (error) {
          console.warn(`Failed to deserialize ghost registry account ${account.pubkey.toBase58()}:`, error);
        }
      }

      // Process escrow accounts
      for (const account of escrowAccounts) {
        const pubkey = account.pubkey.toBase58();
        try {
          const data = Buffer.from(account.account.data);
          // Minimum escrow account size: 8 (discriminator) + 32 (creator) + 32 (tokenMint) + 8 (amount) + 32 (claimHash) + 32 (recipientSpend) + 32 (recipientView) + 8 (expiry) + 1 + 1 + 8 + 2 + 1 + 8 = 205 bytes
          if (data.length < 205) {
            if (!this.failedAccounts.has(pubkey)) {
              console.warn(`Skipping escrow account ${pubkey}: data too short (${data.length} bytes, need ≥205)`);
              this.failedAccounts.add(pubkey);
            }
            continue;
          }

          const escrow = deserializePaymentEscrow(data);
          this.escrows.set(pubkey, escrow);
          
          // Upsert to database cache
          await db.insert(escrowsCache).values({
            address: pubkey,
            creator: escrow.creator,
            tokenMint: escrow.tokenMint,
            amount: escrow.amount,
            claimHash: escrow.claimHash,
            recipientSpendPubkey: escrow.recipientSpendPubkey,
            recipientViewPubkey: escrow.recipientViewPubkey,
            expiry: escrow.expiry,
            claimed: escrow.claimed,
            refunded: escrow.refunded,
            feeBps: escrow.feeBps,
            bump: escrow.bump,
            createdAt: escrow.createdAt,
          }).onConflictDoUpdate({
            target: escrowsCache.address,
            set: {
              creator: escrow.creator,
              tokenMint: escrow.tokenMint,
              amount: escrow.amount,
              claimHash: escrow.claimHash,
              recipientSpendPubkey: escrow.recipientSpendPubkey,
              recipientViewPubkey: escrow.recipientViewPubkey,
              expiry: escrow.expiry,
              claimed: escrow.claimed,
              refunded: escrow.refunded,
              feeBps: escrow.feeBps,
              bump: escrow.bump,
              createdAt: escrow.createdAt,
              updatedAt: new Date(),
            },
          }).catch(console.warn);

          // Award PAYMENT_RECEIVED points when escrow is claimed
          if (escrow.claimed) {
            const amountNum = parseFloat(escrow.amount) / 1_000_000; // Convert from raw to dollars
            if (amountNum >= 1) {
              awardPoints({
                walletAddress: escrow.creator,
                eventType: 'PAYMENT_RECEIVED',
                basePoints: amountNum * 5, // receive_rate default
                metadata: { escrowAddress: pubkey, amount: amountNum },
                referenceId: `payment_received_${pubkey}`,
              }).then(result => {
                if (result) {
                  activateReferral(escrow.creator).catch(err =>
                    console.warn('Failed to activate referral:', err)
                  );
                }
              }).catch(err => console.warn('Failed to award PAYMENT_RECEIVED points:', err));
            }
          }
          
        } catch (error) {
          if (!this.failedAccounts.has(pubkey)) {
            console.warn(`Failed to deserialize escrow account ${pubkey}:`, error instanceof Error ? error.message : error);
            this.failedAccounts.add(pubkey);
          }
        }
      }

      console.log(`Indexed ${this.announcements.size} announcements, ${this.escrows.size} escrows, ${this.metaAddresses.size} meta addresses`);
    } catch (error) {
      console.error('Failed to refresh account data:', error);
    }
  }

  private isAnnouncementDiscriminator(hex: string): boolean {
    // Anchor discriminator: SHA256("account:Announcement")[0..8]
    const expected = Buffer.from(sha256('account:Announcement').slice(0, 8)).toString('hex');
    return hex === expected;
  }

  private isMetaAddressDiscriminator(hex: string): boolean {
    // Anchor discriminator: SHA256("account:MetaAddress")[0..8]
    const expected = Buffer.from(sha256('account:MetaAddress').slice(0, 8)).toString('hex');
    return hex === expected;
  }

  getAnnouncements(): DeserializedAnnouncement[] {
    return Array.from(this.announcements.values());
  }

  getAnnouncementByStealthAddress(stealthAddress: string): DeserializedAnnouncement | undefined {
    return this.announcements.get(stealthAddress);
  }

  getEscrow(address: string): DeserializedEscrow | undefined {
    return this.escrows.get(address);
  }

  getEscrowsByCreator(creator: string): DeserializedEscrow[] {
    return Array.from(this.escrows.values()).filter(escrow => escrow.creator === creator);
  }

  getMetaAddress(owner: string): DeserializedMetaAddress | undefined {
    return this.metaAddresses.get(owner);
  }
}