import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import {
  decodeMetaAddress,
  generateClaimSecret,
  hashClaimSecret,
  scanAnnouncements,
  bytesToHex,
  type MatchedAnnouncement,
  type Announcement as CryptoAnnouncement,
} from '@zkira/crypto';
import {
  PAYMENT_ESCROW_PROGRAM_ID,
  GHOST_REGISTRY_PROGRAM_ID,
  MAX_EXPIRY_SECONDS,
  MIN_EXPIRY_SECONDS,
  type PaymentEscrow,
  type ProtocolConfig,
} from '@zkira/common';
import { findMetaAddress, findEscrow, findEscrowVault, findConfig } from './pda.js';
import {
  createRegisterMetaAddressIx,
  createCreatePaymentIx,
  createClaimPaymentIx,
  createRefundPaymentIx,
} from './instructions.js';
import type {
  WalletAdapter,
  CreatePaymentLinkParams,
  CreatePaymentLinkResult,
  ClaimPaymentParams,
  ClaimPaymentResult,
  RefundPaymentParams,
  RefundPaymentResult,
  RegisterMetaAddressParams,
  RegisterMetaAddressResult,
  ScanForPaymentsParams,
} from './types.js';

/**
 * Sends a transaction using the wallet adapter pattern.
 * Wallet signs via signTransaction, then we send raw.
 */
async function sendTransaction(
  connection: Connection,
  transaction: Transaction,
  wallet: WalletAdapter,
): Promise<string> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  const signed = await wallet.signTransaction(transaction);
  const rawTx = signed.serialize();
  const signature = await connection.sendRawTransaction(rawTx);

  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });

  return signature;
}

/**
 * High-level client for interacting with the ZKIRA protocol.
 */
export class ZkiraClient {
  constructor(
    private connection: Connection,
    private wallet: WalletAdapter
  ) {}

  /**
   * Creates a payment link that can be claimed by the recipient.
   */
  async createPaymentLink(params: CreatePaymentLinkParams): Promise<CreatePaymentLinkResult> {
    const { recipientMetaAddress, amount, tokenMint, expirySeconds = 7 * 24 * 60 * 60 } = params;

    // Validate expiry
    if (expirySeconds < MIN_EXPIRY_SECONDS || expirySeconds > MAX_EXPIRY_SECONDS) {
      throw new Error(`Expiry must be between ${MIN_EXPIRY_SECONDS} and ${MAX_EXPIRY_SECONDS} seconds`);
    }

    // Decode recipient meta-address
    const { spendPubkey: recipientSpendPubkey, viewPubkey: recipientViewPubkey } = decodeMetaAddress(recipientMetaAddress);

    // Generate claim secret and hash it
    const claimSecret = generateClaimSecret();
    const claimHash = hashClaimSecret(claimSecret);

    // Generate random nonce
    const nonce = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));

    // Derive escrow PDA
    const [escrowAddress] = findEscrow(this.wallet.publicKey, nonce);

    // Get creator's token account
    const creatorTokenAccount = await getAssociatedTokenAddress(tokenMint, this.wallet.publicKey);

    // Create instruction
    const createPaymentIx = createCreatePaymentIx({
      creator: this.wallet.publicKey,
      creatorTokenAccount,
      tokenMint,
      amount,
      claimHash,
      recipientSpendPubkey: recipientSpendPubkey,
      recipientViewPubkey: recipientViewPubkey,
      expiry: Math.floor(Date.now() / 1000) + expirySeconds,
      nonce,
    });

    // Build and send transaction
    const transaction = new Transaction().add(createPaymentIx);
    const signature = await sendTransaction(this.connection, transaction, this.wallet);

    // Generate payment URL
    const secretHex = bytesToHex(claimSecret);
    const paymentUrl = `/claim?escrow=${escrowAddress.toBase58()}#secret=${secretHex}`;

    return {
      paymentUrl,
      escrowAddress,
      claimSecret,
      claimSecretHex: secretHex,
      nonce,
    };
  }

  /**
   * Claims a payment from an escrow account.
   */
  async claimPayment(params: ClaimPaymentParams): Promise<ClaimPaymentResult> {
    const { escrowAddress, claimSecret, claimerTokenAccount } = params;

    // Fetch escrow account data
    const escrow = await this.getEscrow(escrowAddress);
    if (!escrow) {
      throw new Error('Payment escrow not found');
    }

    // Check if already claimed or refunded
    if (escrow.claimed) {
      throw new Error('Payment already claimed');
    }
    if (escrow.refunded) {
      throw new Error('Payment already refunded');
    }

    // Check if expired
    const now = Math.floor(Date.now() / 1000);
    if (now > escrow.expiry) {
      throw new Error('Payment has expired');
    }

    // Get or create claimer's token account
    let claimerAta = claimerTokenAccount;
    if (!claimerAta) {
      claimerAta = await getAssociatedTokenAddress(escrow.tokenMint, this.wallet.publicKey);
    }

    // Check if ATA exists, create if needed
    const claimerAtaInfo = await this.connection.getAccountInfo(claimerAta);
    const instructions = [];
    if (!claimerAtaInfo) {
      const createAtaIx = createAssociatedTokenAccountInstruction(
        this.wallet.publicKey, // payer
        claimerAta,
        this.wallet.publicKey, // owner
        escrow.tokenMint
      );
      instructions.push(createAtaIx);
    }

    // Get protocol config to find fee recipient
    const config = await this.getConfig();
    if (!config) {
      throw new Error('Protocol config not found');
    }

    // Get fee recipient's ATA
    const feeRecipientTokenAccount = await getAssociatedTokenAddress(escrow.tokenMint, config.feeRecipient);

    // Create claim instruction
    const claimPaymentIx = createClaimPaymentIx({
      claimer: this.wallet.publicKey,
      claimerTokenAccount: claimerAta,
      escrowAddress,
      claimSecret,
      feeRecipientTokenAccount,
      tokenMint: escrow.tokenMint,
      creator: escrow.creator,
    });

    instructions.push(claimPaymentIx);

    // Build and send transaction
    const transaction = new Transaction().add(...instructions);
    const signature = await sendTransaction(this.connection, transaction, this.wallet);

    return { txSignature: signature };
  }

  /**
   * Refunds an expired payment back to the creator.
   */
  async refundPayment(params: RefundPaymentParams): Promise<RefundPaymentResult> {
    const { escrowAddress } = params;

    // Fetch escrow account data
    const escrow = await this.getEscrow(escrowAddress);
    if (!escrow) {
      throw new Error('Payment escrow not found');
    }

    // Check if already claimed or refunded
    if (escrow.claimed) {
      throw new Error('Payment already claimed');
    }
    if (escrow.refunded) {
      throw new Error('Payment already refunded');
    }

    // Check if expired
    const now = Math.floor(Date.now() / 1000);
    if (now <= escrow.expiry) {
      throw new Error('Payment has not expired yet');
    }

    // Verify caller is the creator
    if (!escrow.creator.equals(this.wallet.publicKey)) {
      throw new Error('Only the payment creator can refund');
    }

    // Get creator's token account
    const creatorTokenAccount = await getAssociatedTokenAddress(escrow.tokenMint, escrow.creator);

    // Create refund instruction
    const refundPaymentIx = createRefundPaymentIx({
      creator: this.wallet.publicKey,
      creatorTokenAccount,
      escrowAddress,
      tokenMint: escrow.tokenMint,
    });

    // Build and send transaction
    const transaction = new Transaction().add(refundPaymentIx);
    const signature = await sendTransaction(this.connection, transaction, this.wallet);

    return { txSignature: signature };
  }

  /**
   * Registers a meta-address on-chain.
   */
  async registerMetaAddress(params: RegisterMetaAddressParams): Promise<RegisterMetaAddressResult> {
    const { spendPubkey, viewPubkey, label } = params;

    // Create instruction
    const registerIx = createRegisterMetaAddressIx({
      owner: this.wallet.publicKey,
      spendPubkey,
      viewPubkey,
      label,
    });

    // Build and send transaction
    const transaction = new Transaction().add(registerIx);
    const signature = await sendTransaction(this.connection, transaction, this.wallet);

    // Derive meta-address PDA
    const [metaAddress] = findMetaAddress(this.wallet.publicKey);

    return {
      txSignature: signature,
      metaAddress,
    };
  }

  /**
   * Scans for payments sent to the user's stealth addresses.
   */
  async scanForPayments(params: ScanForPaymentsParams): Promise<MatchedAnnouncement[]> {
    const { viewPrivkey, spendPubkey } = params;

    // Fetch all announcement accounts from ghost-registry
    const accounts = await this.connection.getProgramAccounts(GHOST_REGISTRY_PROGRAM_ID);

    // Deserialize announcements into the format @zkira/crypto expects
    const announcements: CryptoAnnouncement[] = [];
    for (const { account } of accounts) {
      try {
        const data = account.data;
        if (data.length < 8 + 32 + 32) continue; // Too small to be an announcement

        let offset = 8; // Skip discriminator

        // Read ephemeral pubkey (32 bytes)
        const ephemeralPubkey = new Uint8Array(data.slice(offset, offset + 32));
        offset += 32;

        // Read stealth address (32 bytes)
        const stealthAddress = new Uint8Array(data.slice(offset, offset + 32));
        offset += 32;

        // CryptoAnnouncement only needs ephemeralPubkey and stealthAddress
        announcements.push({
          ephemeralPubkey,
          stealthAddress,
        });
      } catch {
        // Skip malformed announcements
        continue;
      }
    }

    // Scan announcements for matches
    return scanAnnouncements(announcements, viewPrivkey, spendPubkey);
  }

  /**
   * Fetches a payment escrow account.
   */
  async getEscrow(escrowAddress: PublicKey): Promise<PaymentEscrow | null> {
    const accountInfo = await this.connection.getAccountInfo(escrowAddress);
    if (!accountInfo) {
      return null;
    }

    try {
      const data = accountInfo.data;
      let offset = 8; // Skip discriminator

      // Read creator (32 bytes)
      const creator = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      // Read token mint (32 bytes)
      const tokenMint = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      // Read amount (8 bytes LE)
      const view = new DataView(data.buffer, data.byteOffset);
      const amount = view.getBigUint64(offset, true);
      offset += 8;

      // Read claim hash (32 bytes)
      const claimHash = new Uint8Array(data.slice(offset, offset + 32));
      offset += 32;

      // Read recipient spend pubkey (32 bytes)
      const recipientSpendPubkey = new Uint8Array(data.slice(offset, offset + 32));
      offset += 32;

      // Read recipient view pubkey (32 bytes)
      const recipientViewPubkey = new Uint8Array(data.slice(offset, offset + 32));
      offset += 32;

      // Read expiry (8 bytes LE)
      const expiry = Number(view.getBigInt64(offset, true));
      offset += 8;

      // Read claimed (1 byte)
      const claimed = data[offset] === 1;
      offset += 1;

      // Read refunded (1 byte)
      const refunded = data[offset] === 1;
      offset += 1;

      // Read nonce (8 bytes LE)
      const nonce = view.getBigUint64(offset, true);
      offset += 8;

      // Read fee bps (2 bytes LE)
      const feeBps = view.getUint16(offset, true);
      offset += 2;

      return {
        address: escrowAddress,
        creator,
        tokenMint,
        amount,
        claimHash,
        recipientMeta: {
          spendPubkey: recipientSpendPubkey,
          viewPubkey: recipientViewPubkey,
        },
        expiry,
        claimed,
        refunded,
        nonce,
        feeBps,
      };
    } catch {
      return null;
    }
  }

  /**
   * Fetches the protocol configuration.
   */
  async getConfig(): Promise<ProtocolConfig | null> {
    const [configAddress] = findConfig();
    const accountInfo = await this.connection.getAccountInfo(configAddress);
    if (!accountInfo) {
      return null;
    }

    try {
      const data = accountInfo.data;
      const view = new DataView(data.buffer, data.byteOffset);
      let offset = 8; // Skip discriminator

      // Read admin (32 bytes)
      const admin = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      // Read fee recipient (32 bytes)
      const feeRecipient = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      // Read fee bps (2 bytes LE)
      const feeBps = view.getUint16(offset, true);
      offset += 2;

      // Read paused (1 byte)
      const paused = data[offset] === 1;

      return {
        admin,
        feeRecipient,
        feeBps,
        paused,
      };
    } catch {
      return null;
    }
  }
}
