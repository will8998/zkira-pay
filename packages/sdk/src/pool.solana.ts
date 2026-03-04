import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { sha256 } from '@noble/hashes/sha256';
import { PoseidonMerkleTree } from '@zkira/crypto';
import { generateProof } from './pool-worker.js';
import { formatProofForSolana } from './proof-formatter.js';
import type {
  WalletAdapter,
  PoolConfig,
  PoolNote,
  DepositResult,
  WithdrawResult,
  PoolState,
} from './types.js';

// Shielded pool program ID
const SHIELDED_POOL_PROGRAM_ID = new PublicKey('6g5RquPcpe81VzB6CtmuS8pzbXs7nZ5CT7gZt4fLKedx');

/**
 * High-level client for interacting with shielded pools.
 * Provides methods for depositing to and withdrawing from the shielded pool.
 */
export class ShieldedPoolClient {
  constructor(
    private connection: Connection,
    private wallet: WalletAdapter,
    private poolConfig: PoolConfig
  ) {}

  /**
   * Deposit a fixed denomination into the shielded pool.
   * Generates random nullifier + secret and computes commitment.
   */
  async deposit(tokenMint: PublicKey): Promise<DepositResult> {
    // Generate random nullifier and secret (32 bytes each)
    const nullifier = this.generateRandomBigInt();
    const secret = this.generateRandomBigInt();

    // Compute commitment = Poseidon(nullifier, secret)
    const tree = new PoseidonMerkleTree();
    await tree.init();
    
    // Use circomlibjs Poseidon to compute commitment
    const { buildPoseidon } = await import('circomlibjs' as any);
    const poseidon = await buildPoseidon();
    const commitment = poseidon.F.toObject(poseidon([nullifier, secret]));

    // Get pool state PDA
    const [poolStatePda] = this.findPoolStatePda(tokenMint);
    
    // Get pool vault PDA
    const [poolVaultPda] = this.findPoolVaultPda(poolStatePda);

    // Get depositor's ATA
    const depositorAta = await getAssociatedTokenAddress(
      tokenMint,
      this.wallet.publicKey
    );

    // Build deposit instruction
    const instruction = await this.createDepositInstruction(
      poolStatePda,
      poolVaultPda,
      tokenMint,
      depositorAta,
      this.wallet.publicKey,
      commitment
    );

    // Send transaction
    const transaction = new Transaction().add(instruction);
    const signedTx = await this.wallet.signTransaction(transaction);
    const txSignature = await this.connection.sendRawTransaction(signedTx.serialize());
    
    // Wait for confirmation
    await this.connection.confirmTransaction(txSignature);

    // Get the leaf index from the pool state (it was incremented after our deposit)
    const poolState = await this.getPoolState();
    const leafIndex = Number(poolState.nextLeafIndex) - 1;

    const note: PoolNote = {
      nullifier,
      secret,
      commitment,
      leafIndex,
    };

    return {
      txSignature,
      note,
    };
  }

  /**
   * Build a deposit transaction for relay-based submission.
   * The transaction is partial-signed by the wallet but NOT sent.
   * The relayer will set feePayer, sign, and submit.
   */
  async depositForRelay(tokenMint: PublicKey): Promise<{ transaction: Transaction; note: PoolNote }> {
    // Same commitment generation as deposit():
    const nullifier = this.generateRandomBigInt();
    const secret = this.generateRandomBigInt();
    
    const { buildPoseidon } = await import('circomlibjs' as any);
    const poseidon = await buildPoseidon();
    const commitment = poseidon.F.toObject(poseidon([nullifier, secret]));
    
    // Same PDA derivation as deposit():
    const [poolStatePda] = this.findPoolStatePda(tokenMint);
    const [poolVaultPda] = this.findPoolVaultPda(poolStatePda);
    const depositorAta = await getAssociatedTokenAddress(tokenMint, this.wallet.publicKey);
    
    // Build instruction (same as deposit)
    const instruction = await this.createDepositInstruction(
      poolStatePda, poolVaultPda, tokenMint, depositorAta, this.wallet.publicKey, commitment
    );
    
    // Build transaction WITHOUT setting feePayer (relayer will set it)
    const transaction = new Transaction().add(instruction);
    
    // Partial-sign with wallet (as depositor authority)
    const signedTx = await this.wallet.signTransaction(transaction);
    
    // Get leaf index (we can't get it before sending, so use -1 as placeholder)
    // The actual leafIndex will be determined after the transaction is confirmed
    const note: PoolNote = {
      nullifier,
      secret,
      commitment,
      leafIndex: -1, // Will be updated after confirmation
    };
    
    return { transaction: signedTx, note };
  }

  /**
   * Withdraw from the shielded pool using a saved note.
   * Generates a Groth16 proof and submits a withdrawal request.
   */
  async withdraw(note: PoolNote, recipient: PublicKey): Promise<WithdrawResult> {
    // Rebuild the Merkle tree from on-chain events
    const tree = await this.rebuildTree();

    // Get current merkle root
    const merkleRoot = tree.getRoot();

    // Generate Merkle proof for the note
    const proof = tree.getProof(note.leafIndex);

    // Compute nullifier hash = Poseidon(nullifier)
    const { buildPoseidon } = await import('circomlibjs' as any);
    const poseidon = await buildPoseidon();
    const nullifierHash = poseidon.F.toObject(poseidon([note.nullifier]));

    // Prepare circuit inputs
    const circuitInputs = {
      // Private inputs
      nullifier: note.nullifier.toString(),
      secret: note.secret.toString(),
      pathElements: proof.pathElements.map(x => x.toString()),
      pathIndices: proof.pathIndices,
      
      // Public inputs (will be extracted by circuit)
      root: merkleRoot.toString(),
      nullifierHash: nullifierHash.toString(),
      recipient: recipient.toBytes(),
      denomination: this.poolConfig.denomination.toString(),
    };

    // Generate Groth16 proof
    const { proof: snarkjsProof, publicSignals } = await generateProof({
      signals: circuitInputs,
      wasmUrl: this.poolConfig.circuitWasmUrl,
      zkeyUrl: this.poolConfig.circuitZkeyUrl,
    });

    // Format proof for Solana
    const formattedProof = formatProofForSolana(snarkjsProof, publicSignals);

    // Get pool state PDA
    const [poolStatePda] = this.findPoolStatePda(this.poolConfig.tokenMint);

    // Get nullifier PDA
    const [nullifierPda] = this.findNullifierPda(poolStatePda, nullifierHash);

    // Get withdrawal PDA
    const [withdrawalPda] = this.findWithdrawalPda(poolStatePda, nullifierHash);

    // Build queue withdrawal instruction
    const instruction = await this.createQueueWithdrawalInstruction(
      poolStatePda,
      nullifierPda,
      withdrawalPda,
      this.wallet.publicKey,
      formattedProof
    );

    // Send transaction
    const transaction = new Transaction().add(instruction);
    const signedTx = await this.wallet.signTransaction(transaction);
    const txSignature = await this.connection.sendRawTransaction(signedTx.serialize());
    
    // Wait for confirmation
    await this.connection.confirmTransaction(txSignature);

    return {
      txSignature,
      nullifierHash,
    };
  }

  /**
   * Rebuild the Merkle tree from on-chain deposit events.
   */
  async rebuildTree(): Promise<PoseidonMerkleTree> {
    const tree = new PoseidonMerkleTree();
    await tree.init();

    // Get pool state PDA
    const [poolStatePda] = this.findPoolStatePda(this.poolConfig.tokenMint);

    // Fetch all signatures for the pool
    const signatures = await this.connection.getSignaturesForAddress(poolStatePda);

    // Collect all deposit events
    const depositEvents: Array<{ commitment: bigint; leafIndex: number; timestamp: number }> = [];

    for (const sigInfo of signatures) {
      try {
        const tx = await this.connection.getTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx || !tx.meta || tx.meta.err) continue;

        // Parse logs for DepositEvent
        const logs = tx.meta.logMessages || [];
        for (const log of logs) {
          if (log.includes('DepositEvent')) {
            // Parse the event data from the log
            // Format: "Program log: DepositEvent { commitment: [bytes], leaf_index: number, timestamp: number }"
            const match = log.match(/DepositEvent.*commitment:\s*\[([^\]]+)\].*leaf_index:\s*(\d+).*timestamp:\s*(\d+)/);
            if (match) {
              const commitmentBytes = match[1].split(',').map(s => parseInt(s.trim()));
              const commitment = this.bytesToBigInt(new Uint8Array(commitmentBytes));
              const leafIndex = parseInt(match[2]);
              const timestamp = parseInt(match[3]);
              
              depositEvents.push({ commitment, leafIndex, timestamp });
            }
          }
        }
      } catch (error) {
        // Skip failed transactions
        continue;
      }
    }

    // Sort events by leaf index to ensure correct tree construction
    depositEvents.sort((a, b) => a.leafIndex - b.leafIndex);

    // Insert commitments into tree in order
    for (const event of depositEvents) {
      tree.insert(event.commitment);
    }

    return tree;
  }

  /**
   * Fetch the current pool state from on-chain.
   */
  async getPoolState(): Promise<PoolState> {
    const [poolStatePda] = this.findPoolStatePda(this.poolConfig.tokenMint);
    
    const accountInfo = await this.connection.getAccountInfo(poolStatePda);
    if (!accountInfo) {
      throw new Error('Pool state account not found');
    }

    return this.deserializePoolState(accountInfo.data);
  }

  /**
   * Find pool state PDA.
   */
  private findPoolStatePda(tokenMint: PublicKey): [PublicKey, number] {
    const denominationBytes = new Uint8Array(8);
    const view = new DataView(denominationBytes.buffer);
    view.setBigUint64(0, this.poolConfig.denomination, true); // little-endian

    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('pool'),
        tokenMint.toBuffer(),
        denominationBytes,
      ],
      SHIELDED_POOL_PROGRAM_ID
    );
  }

  /**
   * Find pool vault PDA.
   */
  private findPoolVaultPda(poolState: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('pool_vault'),
        poolState.toBuffer(),
      ],
      SHIELDED_POOL_PROGRAM_ID
    );
  }

  /**
   * Find nullifier PDA.
   */
  private findNullifierPda(poolState: PublicKey, nullifierHash: bigint): [PublicKey, number] {
    const nullifierHashBytes = this.bigIntToBytes(nullifierHash);
    
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('nullifier'),
        poolState.toBuffer(),
        nullifierHashBytes,
      ],
      SHIELDED_POOL_PROGRAM_ID
    );
  }

  /**
   * Find withdrawal PDA.
   */
  private findWithdrawalPda(poolState: PublicKey, nullifierHash: bigint): [PublicKey, number] {
    const nullifierHashBytes = this.bigIntToBytes(nullifierHash);
    
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('withdrawal'),
        poolState.toBuffer(),
        nullifierHashBytes,
      ],
      SHIELDED_POOL_PROGRAM_ID
    );
  }

  /**
   * Create deposit instruction.
   */
  private async createDepositInstruction(
    poolState: PublicKey,
    poolVault: PublicKey,
    tokenMint: PublicKey,
    depositorAta: PublicKey,
    depositor: PublicKey,
    commitment: bigint
  ): Promise<TransactionInstruction> {
    // Instruction discriminator: first 8 bytes of SHA256("global:deposit")
    const discriminator = sha256('global:deposit').slice(0, 8);
    
    // Commitment as 32-byte array
    const commitmentBytes = this.bigIntToBytes(commitment);
    
    // Build instruction data
    const data = Buffer.concat([
      Buffer.from(discriminator),
      Buffer.from(commitmentBytes),
    ]);

    return new TransactionInstruction({
      keys: [
        { pubkey: poolState, isSigner: false, isWritable: true },
        { pubkey: poolVault, isSigner: false, isWritable: true },
        { pubkey: tokenMint, isSigner: false, isWritable: false },
        { pubkey: depositorAta, isSigner: false, isWritable: true },
        { pubkey: depositor, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: SHIELDED_POOL_PROGRAM_ID,
      data,
    });
  }

  /**
   * Create queue withdrawal instruction.
   */
  private async createQueueWithdrawalInstruction(
    poolState: PublicKey,
    nullifier: PublicKey,
    withdrawal: PublicKey,
    payer: PublicKey,
    formattedProof: any
  ): Promise<TransactionInstruction> {
    // Instruction discriminator: first 8 bytes of SHA256("global:queue_withdrawal")
    const discriminator = sha256('global:queue_withdrawal').slice(0, 8);
    
    // Build instruction data: discriminator + proof_a + proof_b + proof_c + public_inputs
    const data = Buffer.concat([
      Buffer.from(discriminator),
      Buffer.from(formattedProof.proof_a),
      Buffer.from(formattedProof.proof_b),
      Buffer.from(formattedProof.proof_c),
      Buffer.concat(formattedProof.public_inputs.map((input: Uint8Array) => Buffer.from(input))),
    ]);

    return new TransactionInstruction({
      keys: [
        { pubkey: poolState, isSigner: false, isWritable: true },
        { pubkey: nullifier, isSigner: false, isWritable: true },
        { pubkey: withdrawal, isSigner: false, isWritable: true },
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: SHIELDED_POOL_PROGRAM_ID,
      data,
    });
  }

  /**
   * Generate a random 32-byte bigint using crypto.getRandomValues.
   */
  private generateRandomBigInt(): bigint {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return this.bytesToBigInt(bytes);
  }

  /**
   * Convert 32-byte array to bigint (big-endian).
   */
  private bytesToBigInt(bytes: Uint8Array): bigint {
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) + BigInt(bytes[i]);
    }
    return result;
  }

  /**
   * Convert bigint to 32-byte array (big-endian).
   */
  private bigIntToBytes(value: bigint): Uint8Array {
    const bytes = new Uint8Array(32);
    let val = value;
    
    for (let i = 31; i >= 0; i--) {
      bytes[i] = Number(val & 0xFFn);
      val = val >> 8n;
    }
    
    return bytes;
  }

  /**
   * Deserialize pool state from account data.
   */
  private deserializePoolState(data: Uint8Array): PoolState {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let offset = 8; // Skip discriminator

    // authority (32 bytes)
    const authority = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    // token_mint (32 bytes)
    const tokenMint = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    // denomination (8 bytes, u64 little-endian)
    const denomination = view.getBigUint64(offset, true);
    offset += 8;

    // merkle_root (32 bytes)
    const merkleRoot = data.slice(offset, offset + 32);
    offset += 32;

    // next_leaf_index (8 bytes, u64 little-endian)
    const nextLeafIndex = Number(view.getBigUint64(offset, true));
    offset += 8;

    // deposit_count (8 bytes, u64 little-endian)
    const depositCount = Number(view.getBigUint64(offset, true));
    offset += 8;

    // withdrawal_count (8 bytes, u64 little-endian)
    const withdrawalCount = Number(view.getBigUint64(offset, true));
    offset += 8;

    // paused (1 byte, bool)
    const paused = data[offset] !== 0;
    offset += 1;

    // bump (1 byte)
    offset += 1;

    // root_history (640 bytes, skip)
    offset += 640;

    // root_history_index (1 byte, skip)
    offset += 1;

    // pending_withdrawals (8 bytes, u64 little-endian)
    const pendingWithdrawals = Number(view.getBigUint64(offset, true));

    return {
      authority,
      tokenMint,
      denomination,
      merkleRoot,
      nextLeafIndex,
      depositCount,
      withdrawalCount,
      paused,
      pendingWithdrawals,
    };
  }
}