import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  AccountMeta,
  SystemProgram,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { sha256 } from '@noble/hashes/sha256';
import { RelayerWallet } from './wallet.js';
import {
  PaymentEscrow,
  ProtocolConfig,
  BuildClaimTransactionParams,
  PAYMENT_ESCROW_PROGRAM_ID,
  CONFIG_SEED,
  ESCROW_SEED,
  VAULT_SEED,
} from '../types.js';

export class TransactionBuilder {
  constructor(
    private connection: Connection,
    private relayerWallet: RelayerWallet,
  ) {}

  async buildClaimTransaction(params: BuildClaimTransactionParams): Promise<Transaction> {
    const { escrowAddress, claimSecret, claimerPubkey } = params;

    // Fetch escrow account data
    const escrowAccount = await this.connection.getAccountInfo(escrowAddress);
    if (!escrowAccount) {
      throw new Error('Escrow account not found');
    }

    const escrow = this.deserializePaymentEscrow(escrowAccount.data);

    // Validate escrow state
    if (escrow.claimed) {
      throw new Error('Escrow already claimed');
    }
    if (escrow.refunded) {
      throw new Error('Escrow already refunded');
    }
    if (Date.now() / 1000 > Number(escrow.expiry)) {
      throw new Error('Escrow expired');
    }

    // Validate claim secret hash
    const claimHash = sha256(claimSecret);
    if (!this.arraysEqual(claimHash, escrow.claimHash)) {
      throw new Error('Invalid claim secret');
    }

    // Derive PDAs
    const configPda = this.deriveConfigPda();
    const vaultPda = this.deriveVaultPda(escrowAddress);

    // Fetch protocol config
    const configAccount = await this.connection.getAccountInfo(configPda);
    if (!configAccount) {
      throw new Error('Protocol config not found');
    }
    const protocolConfig = this.deserializeProtocolConfig(configAccount.data);

    if (protocolConfig.paused) {
      throw new Error('Protocol is paused');
    }

    // Get or create ATAs
    const claimerAta = await getAssociatedTokenAddress(escrow.tokenMint, claimerPubkey);
    const feeRecipientAta = await getAssociatedTokenAddress(escrow.tokenMint, protocolConfig.feeRecipient);

    // Build claim instruction
    const claimInstruction = this.buildClaimInstruction({
      config: configPda,
      escrow: escrowAddress,
      vault: vaultPda,
      tokenMint: escrow.tokenMint,
      claimerAta,
      feeRecipientAta,
      creator: escrow.creator,
      claimer: claimerPubkey,
      claimSecret,
    });

    // Create transaction
    const transaction = new Transaction();
    transaction.add(claimInstruction);
    transaction.feePayer = this.relayerWallet.publicKey;

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    return transaction;
  }

  private buildClaimInstruction(params: {
    config: PublicKey;
    escrow: PublicKey;
    vault: PublicKey;
    tokenMint: PublicKey;
    claimerAta: PublicKey;
    feeRecipientAta: PublicKey;
    creator: PublicKey;
    claimer: PublicKey;
    claimSecret: Uint8Array;
  }): TransactionInstruction {
    // Build instruction data
    const discriminator = sha256('global:claim_payment').slice(0, 8);
    const claimSecretLen = new Uint8Array(4);
    new DataView(claimSecretLen.buffer).setUint32(0, params.claimSecret.length, true); // Little endian
    
    const data = new Uint8Array(discriminator.length + claimSecretLen.length + params.claimSecret.length);
    data.set(discriminator, 0);
    data.set(claimSecretLen, discriminator.length);
    data.set(params.claimSecret, discriminator.length + claimSecretLen.length);

    // Build account metas (order must match Anchor struct exactly)
    const accounts: AccountMeta[] = [
      { pubkey: params.config, isSigner: false, isWritable: false },
      { pubkey: params.escrow, isSigner: false, isWritable: true },
      { pubkey: params.vault, isSigner: false, isWritable: true },
      { pubkey: params.tokenMint, isSigner: false, isWritable: false },
      { pubkey: params.claimerAta, isSigner: false, isWritable: true },
      { pubkey: params.feeRecipientAta, isSigner: false, isWritable: true },
      { pubkey: params.creator, isSigner: false, isWritable: true },
      { pubkey: params.claimer, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
      keys: accounts,
      programId: PAYMENT_ESCROW_PROGRAM_ID,
      data: Buffer.from(data),
    });
  }

  private deriveConfigPda(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONFIG_SEED)],
      PAYMENT_ESCROW_PROGRAM_ID
    );
    return pda;
  }

  private deriveVaultPda(escrowAddress: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(VAULT_SEED), escrowAddress.toBuffer()],
      PAYMENT_ESCROW_PROGRAM_ID
    );
    return pda;
  }

  private deserializePaymentEscrow(data: Uint8Array): PaymentEscrow {
    let offset = 8; // Skip Anchor discriminator

    const creator = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    const tokenMint = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    const amount = new DataView(data.buffer, data.byteOffset + offset).getBigUint64(0, true);
    offset += 8;

    const claimHash = data.slice(offset, offset + 32);
    offset += 32;

    const recipientSpendPubkey = data.slice(offset, offset + 32);
    offset += 32;

    const recipientViewPubkey = data.slice(offset, offset + 32);
    offset += 32;

    const expiry = new DataView(data.buffer, data.byteOffset + offset).getBigInt64(0, true);
    offset += 8;

    const claimed = data[offset] !== 0;
    offset += 1;

    const refunded = data[offset] !== 0;
    offset += 1;

    const nonce = new DataView(data.buffer, data.byteOffset + offset).getBigUint64(0, true);
    offset += 8;

    const feeBps = new DataView(data.buffer, data.byteOffset + offset).getUint16(0, true);
    offset += 2;

    const bump = data[offset];
    offset += 1;

    const createdAt = new DataView(data.buffer, data.byteOffset + offset).getBigInt64(0, true);

    return {
      creator,
      tokenMint,
      amount,
      claimHash,
      recipientSpendPubkey,
      recipientViewPubkey,
      expiry,
      claimed,
      refunded,
      nonce,
      feeBps,
      bump,
      createdAt,
    };
  }

  private deserializeProtocolConfig(data: Uint8Array): ProtocolConfig {
    let offset = 8; // Skip Anchor discriminator

    const admin = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    const feeRecipient = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    const feeBps = new DataView(data.buffer, data.byteOffset + offset).getUint16(0, true);
    offset += 2;

    const paused = data[offset] !== 0;
    offset += 1;

    const bump = data[offset];

    return {
      admin,
      feeRecipient,
      feeBps,
      paused,
      bump,
    };
  }

  private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}