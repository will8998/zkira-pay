/**
 * ZKIRA Pay — End-to-End Integration Test
 *
 * Tests the full payment-escrow flow against a local Solana validator:
 * 1. Initialize protocol config
 * 2. Create SPL token mint + accounts
 * 3. Create payment escrow (sender → escrow vault)
 * 4. Claim payment (escrow vault → claimer)
 * 5. Verify final state
 *
 * Prerequisites:
 *   - solana-test-validator running on localhost:8899
 *   - Both programs deployed (ghost_registry + payment_escrow)
 *
 * Run: pnpm tsx tests/integration.test.ts
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { sha256 } from '@noble/hashes/sha256';

// ─── Constants ───

const PAYMENT_ESCROW_PROGRAM_ID = new PublicKey('DvHQCrzhL8ofNQFqxkRHnqf4Gmkejv48DCFAUMGtKHmX');

const SEEDS = {
  CONFIG: new TextEncoder().encode('config'),
  ESCROW: new TextEncoder().encode('escrow'),
  ESCROW_VAULT: new TextEncoder().encode('vault'),
};

const connection = new Connection('http://localhost:8899', 'confirmed');

// ─── Helpers ───

function getDiscriminator(name: string): Uint8Array {
  return sha256(`global:${name}`).slice(0, 8);
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) { result.set(a, off); off += a.length; }
  return result;
}

function u64LE(v: bigint): Uint8Array {
  const b = new ArrayBuffer(8);
  new DataView(b).setBigUint64(0, v, true);
  return new Uint8Array(b);
}

function i64LE(v: bigint): Uint8Array {
  const b = new ArrayBuffer(8);
  new DataView(b).setBigInt64(0, v, true);
  return new Uint8Array(b);
}

function u16LE(v: number): Uint8Array {
  const b = new ArrayBuffer(2);
  new DataView(b).setUint16(0, v, true);
  return new Uint8Array(b);
}

function u32LE(v: number): Uint8Array {
  const b = new ArrayBuffer(4);
  new DataView(b).setUint32(0, v, true);
  return new Uint8Array(b);
}

function findConfig(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.CONFIG], PAYMENT_ESCROW_PROGRAM_ID);
}

function findEscrow(creator: PublicKey, nonce: bigint): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.ESCROW, creator.toBytes(), Buffer.from(new BigUint64Array([nonce]).buffer)],
    PAYMENT_ESCROW_PROGRAM_ID,
  );
}

function findEscrowVault(escrow: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.ESCROW_VAULT, escrow.toBytes()],
    PAYMENT_ESCROW_PROGRAM_ID,
  );
}

// ─── Test State ───
let admin: Keypair;
let sender: Keypair;
let claimer: Keypair;
let tokenMint: PublicKey;
let senderAta: PublicKey;
let claimerAta: PublicKey;
let feeRecipientAta: PublicKey;

// ─── Tests ───

async function setup() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  ZKIRA Pay — Integration Test');
  console.log('═══════════════════════════════════════════\n');

  admin = Keypair.generate();
  sender = Keypair.generate();
  claimer = Keypair.generate();

  console.log('Admin:  ', admin.publicKey.toBase58());
  console.log('Sender: ', sender.publicKey.toBase58());
  console.log('Claimer:', claimer.publicKey.toBase58());

  // Airdrop SOL
  console.log('\n[1/7] Airdropping SOL...');
  for (const kp of [admin, sender, claimer]) {
    const sig = await connection.requestAirdrop(kp.publicKey, 10 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);
  }
  console.log('  ✅ Airdropped 10 SOL each');

  // Create SPL token
  console.log('\n[2/7] Creating SPL token...');
  tokenMint = await createMint(connection, admin, admin.publicKey, null, 6);
  console.log('  Mint:', tokenMint.toBase58());

  // Create ATAs
  senderAta = await createAssociatedTokenAccount(connection, sender, tokenMint, sender.publicKey);
  claimerAta = await createAssociatedTokenAccount(connection, claimer, tokenMint, claimer.publicKey);
  feeRecipientAta = await createAssociatedTokenAccount(connection, admin, tokenMint, admin.publicKey);

  // Mint 1000 tokens to sender
  await mintTo(connection, admin, tokenMint, senderAta, admin, 1_000_000_000);
  console.log('  ✅ Minted 1000 tokens to sender');
}

async function testInitializeConfig() {
  console.log('\n[3/7] Initializing protocol config...');

  const [configPda] = findConfig();

  // Anchor account order: config, admin, system_program
  // Instruction args: fee_bps (u16)
  const data = concat(getDiscriminator('initialize_config'), u16LE(25));

  const ix = new TransactionInstruction({
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: true },
      { pubkey: admin.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PAYMENT_ESCROW_PROGRAM_ID,
    data: Buffer.from(data),
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [admin]);
  console.log(`  ✅ Config initialized (sig: ${sig.slice(0, 20)}...)`);
  console.log(`  Config PDA: ${configPda.toBase58()}`);

  // Verify
  const acct = await connection.getAccountInfo(configPda);
  if (!acct) throw new Error('Config not created');
  console.log(`  Account size: ${acct.data.length} bytes`);
}

async function testCreatePayment() {
  console.log('\n[4/7] Creating payment...');

  const nonce = BigInt(1);
  const amount = BigInt(10_000_000); // 10 tokens
  const expiryTimestamp = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);

  // Generate claim secret & hash
  const claimSecret = new Uint8Array(32);
  crypto.getRandomValues(claimSecret);
  const claimHash = sha256(concat(new TextEncoder().encode('priv_claim'), claimSecret));

  // Random recipient meta-address keys
  const recipientSpendPubkey = new Uint8Array(32);
  crypto.getRandomValues(recipientSpendPubkey);
  const recipientViewPubkey = new Uint8Array(32);
  crypto.getRandomValues(recipientViewPubkey);

  const [escrowPda] = findEscrow(sender.publicKey, nonce);
  const [vaultPda] = findEscrowVault(escrowPda);
  const [configPda] = findConfig();

  console.log(`  Escrow: ${escrowPda.toBase58()}`);
  console.log(`  Vault:  ${vaultPda.toBase58()}`);

  // Anchor instruction args order (from fn signature):
  //   nonce: u64, claim_hash: [u8;32], amount: u64, expiry: i64,
  //   recipient_spend_pubkey: [u8;32], recipient_view_pubkey: [u8;32]
  const data = concat(
    getDiscriminator('create_payment'),
    u64LE(nonce),
    claimHash,
    u64LE(amount),
    i64LE(expiryTimestamp),
    recipientSpendPubkey,
    recipientViewPubkey,
  );

  // Anchor account order (from CreatePayment struct):
  //   config, escrow, vault, token_mint, creator_ata, creator, token_program,
  //   associated_token_program, system_program
  const ix = new TransactionInstruction({
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: escrowPda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: tokenMint, isSigner: false, isWritable: false },
      { pubkey: senderAta, isSigner: false, isWritable: true },
      { pubkey: sender.publicKey, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PAYMENT_ESCROW_PROGRAM_ID,
    data: Buffer.from(data),
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [sender]);
  console.log(`  ✅ Payment created (sig: ${sig.slice(0, 20)}...)`);

  // Verify sender balance
  const senderAcct = await getAccount(connection, senderAta);
  console.log(`  Sender balance: ${Number(senderAcct.amount) / 1e6} tokens`);

  // Verify escrow exists
  const escrowAcct = await connection.getAccountInfo(escrowPda);
  if (!escrowAcct) throw new Error('Escrow not created');
  console.log(`  Escrow size: ${escrowAcct.data.length} bytes`);

  return { escrowPda, vaultPda, configPda, claimSecret, amount };
}

async function testClaimPayment(params: {
  escrowPda: PublicKey;
  vaultPda: PublicKey;
  configPda: PublicKey;
  claimSecret: Uint8Array;
  amount: bigint;
}) {
  console.log('\n[5/7] Claiming payment...');

  const { escrowPda, vaultPda, configPda, claimSecret, amount } = params;

  // Anchor instruction args: claim_secret (Vec<u8>) = 4-byte LE len + bytes
  const data = concat(
    getDiscriminator('claim_payment'),
    u32LE(claimSecret.length),
    claimSecret,
  );

  // Anchor account order (from ClaimPayment struct):
  //   config, escrow, vault, token_mint, claimer_ata, fee_recipient_ata,
  //   creator (AccountInfo, mut), claimer (Signer, mut),
  //   token_program, associated_token_program, system_program
  const ix = new TransactionInstruction({
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: escrowPda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: tokenMint, isSigner: false, isWritable: false },
      { pubkey: claimerAta, isSigner: false, isWritable: true },
      { pubkey: feeRecipientAta, isSigner: false, isWritable: true },
      { pubkey: sender.publicKey, isSigner: false, isWritable: true }, // creator
      { pubkey: claimer.publicKey, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PAYMENT_ESCROW_PROGRAM_ID,
    data: Buffer.from(data),
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [claimer]);
  console.log(`  ✅ Payment claimed (sig: ${sig.slice(0, 20)}...)`);

  // Verify balances
  const claimerAcct = await getAccount(connection, claimerAta);
  const feeAcct = await getAccount(connection, feeRecipientAta);

  const expectedFee = amount * BigInt(25) / BigInt(10_000);
  const expectedClaim = amount - expectedFee;

  console.log(`  Claimer:       ${Number(claimerAcct.amount) / 1e6} tokens (expected: ${Number(expectedClaim) / 1e6})`);
  console.log(`  Fee recipient: ${Number(feeAcct.amount) / 1e6} tokens (expected: ${Number(expectedFee) / 1e6})`);

  if (claimerAcct.amount !== expectedClaim) {
    throw new Error(`Claimer mismatch: got ${claimerAcct.amount}, expected ${expectedClaim}`);
  }
  if (feeAcct.amount !== expectedFee) {
    throw new Error(`Fee mismatch: got ${feeAcct.amount}, expected ${expectedFee}`);
  }

  console.log('  ✅ Amounts verified!');
}

async function testVerifyEscrowState(escrowPda: PublicKey) {
  console.log('\n[6/7] Verifying escrow state...');

  const acct = await connection.getAccountInfo(escrowPda);
  if (!acct) throw new Error('Escrow not found');

  const data = acct.data;
  // Skip: 8 (disc) + 32 (creator) + 32 (mint) + 8 (amount) + 32 (claim_hash)
  //   + 32 (spend) + 32 (view) + 8 (expiry) = 184
  const claimed = data[184] === 1;
  const refunded = data[185] === 1;

  console.log(`  claimed:  ${claimed}`);
  console.log(`  refunded: ${refunded}`);

  if (!claimed) throw new Error('Should be claimed');
  if (refunded) throw new Error('Should not be refunded');
  console.log('  ✅ Escrow state correct!');
}

async function testFinalSummary() {
  console.log('\n[7/7] Final balances...');

  const s = await getAccount(connection, senderAta);
  const c = await getAccount(connection, claimerAta);
  const f = await getAccount(connection, feeRecipientAta);

  const total = Number(s.amount) + Number(c.amount) + Number(f.amount);
  console.log(`  Sender:        ${Number(s.amount) / 1e6}`);
  console.log(`  Claimer:       ${Number(c.amount) / 1e6}`);
  console.log(`  Fee recipient: ${Number(f.amount) / 1e6}`);
  console.log(`  Total:         ${total / 1e6} (should be 1000.0)`);

  if (total !== 1_000_000_000) {
    throw new Error(`Total mismatch: ${total} !== 1000000000`);
  }
  console.log('  ✅ Conservation of tokens verified!');
}

// ─── Main ───

async function main() {
  try {
    const version = await connection.getVersion();
    console.log(`Solana ${version['solana-core']}`);

    // Verify programs deployed
    const ghost = await connection.getAccountInfo(new PublicKey('EECGiV8qMJm7BT4HpLw3KBWUAETDDB8H33jaRtTRpe5v'));
    const escrow = await connection.getAccountInfo(PAYMENT_ESCROW_PROGRAM_ID);
    if (!ghost || !escrow) throw new Error('Programs not deployed');
    console.log('Programs deployed ✅');

    await setup();
    await testInitializeConfig();
    const result = await testCreatePayment();
    await testClaimPayment(result);
    await testVerifyEscrowState(result.escrowPda);
    await testFinalSummary();

    console.log('\n═══════════════════════════════════════════');
    console.log('  ✅ ALL INTEGRATION TESTS PASSED');
    console.log('═══════════════════════════════════════════\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ FAILED:', err);
    process.exit(1);
  }
}

main();
