/**
 * ZKIRA Pay — End-to-End Payment Flow Test (Devnet)
 *
 * Tests the full lifecycle:
 *   1. Create a test SPL token mint
 *   2. Mint tokens to creator's ATA
 *   3. Generate recipient meta-address
 *   4. Create payment (creator → escrow)
 *   5. Verify escrow on-chain
 *   6. Claim payment (claimer ← escrow)
 *   7. Verify escrow marked as claimed
 *
 * Run: npx tsx packages/sdk/src/e2e-test.ts
 */

import {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { generateMetaAddress, encodeMetaAddress } from '@zkira/crypto';
import { ZkiraClient } from './client.js';
import type { WalletAdapter } from './types.js';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// ─── Config ────────────────────────────────────────────────────────

const RPC_URL = 'https://api.devnet.solana.com';
const KEYPAIR_PATH = join(homedir(), '.config', 'solana', 'id.json');
const AMOUNT_USDC = 1_000_000n; // 1 USDC (6 decimals)
const EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

// ─── Helpers ───────────────────────────────────────────────────────

function loadKeypair(path: string): Keypair {
  const raw = readFileSync(path, 'utf-8');
  const arr = JSON.parse(raw) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(arr));
}

function makeWalletAdapter(keypair: Keypair): WalletAdapter {
  return {
    publicKey: keypair.publicKey,
    signTransaction: async (tx: Transaction) => {
      tx.sign(keypair);
      return tx;
    },
  };
}

function ok(msg: string) {
  console.log(`  ✅ ${msg}`);
}

function info(msg: string) {
  console.log(`  ℹ️  ${msg}`);
}

function fail(msg: string): never {
  console.error(`  ❌ ${msg}`);
  process.exit(1);
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ZKIRA Pay — E2E Payment Flow Test (Devnet)');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Setup
  console.log('▸ Step 1: Setup');
  const connection = new Connection(RPC_URL, 'confirmed');
  const payer = loadKeypair(KEYPAIR_PATH);
  const wallet = makeWalletAdapter(payer);
  info(`Wallet: ${payer.publicKey.toBase58()}`);

  const balance = await connection.getBalance(payer.publicKey);
  info(`SOL balance: ${(balance / 1e9).toFixed(4)} SOL`);
  if (balance < 0.1 * 1e9) {
    fail('Insufficient SOL balance. Need at least 0.1 SOL for tx fees.');
  }
  ok('Wallet loaded with sufficient SOL');

  // 2. Create test token mint
  console.log('\n▸ Step 2: Create test SPL token mint');
  const mintAuthority = payer;
  const tokenMint = await createMint(
    connection,
    payer,
    mintAuthority.publicKey,
    null,
    6, // 6 decimals like USDC
  );
  ok(`Token mint created: ${tokenMint.toBase58()}`);

  // 3. Create ATA and mint tokens
  console.log('\n▸ Step 3: Mint test tokens');
  const creatorAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    tokenMint,
    payer.publicKey,
  );
  info(`Creator ATA: ${creatorAta.address.toBase58()}`);

  await mintTo(
    connection,
    payer,
    tokenMint,
    creatorAta.address,
    mintAuthority,
    Number(AMOUNT_USDC * 10n), // Mint 10x so we have plenty
  );
  ok(`Minted ${Number(AMOUNT_USDC * 10n) / 1e6} tokens to creator`);

  // 4. Generate recipient meta-address
  console.log('\n▸ Step 4: Generate recipient meta-address');
  const { spendPubkey, viewPubkey } = generateMetaAddress();
  const metaAddr = encodeMetaAddress(spendPubkey, viewPubkey);
  info(`Meta-address: ${metaAddr.slice(0, 30)}...`);
  ok('Recipient meta-address generated');

  // 5. Create payment
  console.log('\n▸ Step 5: Create payment via ZkiraClient');
  const client = new ZkiraClient(connection, wallet);

  let result;
  try {
    result = await client.createPaymentLink({
      recipientMetaAddress: metaAddr,
      amount: AMOUNT_USDC,
      tokenMint,
      expirySeconds: EXPIRY_SECONDS,
    });
  } catch (err) {
    fail(`createPaymentLink failed: ${err}`);
  }

  info(`Payment URL: ${result.paymentUrl}`);
  info(`Escrow: ${result.escrowAddress.toBase58()}`);
  info(`Claim secret (hex): ${result.claimSecretHex.slice(0, 16)}...`);
  ok('Payment created on-chain');

  // 6. Verify escrow exists
  console.log('\n▸ Step 6: Verify escrow on-chain');
  const escrow = await client.getEscrow(result.escrowAddress);
  if (!escrow) {
    fail('Escrow account not found on-chain');
  }
  if (escrow.claimed) {
    fail('Escrow already marked as claimed');
  }
  if (escrow.refunded) {
    fail('Escrow already marked as refunded');
  }
  if (escrow.amount !== AMOUNT_USDC) {
    fail(`Amount mismatch: expected ${AMOUNT_USDC}, got ${escrow.amount}`);
  }
  if (!escrow.creator.equals(payer.publicKey)) {
    fail('Creator mismatch');
  }
  if (!escrow.tokenMint.equals(tokenMint)) {
    fail('Token mint mismatch');
  }
  ok(`Escrow verified: amount=${Number(escrow.amount) / 1e6}, claimed=${escrow.claimed}, refunded=${escrow.refunded}`);

  // 7. Claim payment (using same wallet as claimer for simplicity)
  console.log('\n▸ Step 7: Claim payment');
  let claimResult;
  try {
    claimResult = await client.claimPayment({
      escrowAddress: result.escrowAddress,
      claimSecret: result.claimSecret,
    });
  } catch (err) {
    fail(`claimPayment failed: ${err}`);
  }
  info(`Claim tx: ${claimResult.txSignature}`);
  ok('Payment claimed successfully');

  // 8. Verify escrow is marked claimed
  console.log('\n▸ Step 8: Verify post-claim state');
  const escrowAfter = await client.getEscrow(result.escrowAddress);
  if (!escrowAfter) {
    fail('Escrow account not found after claim');
  }
  if (!escrowAfter.claimed) {
    fail('Escrow not marked as claimed after claim tx');
  }
  ok(`Post-claim: claimed=${escrowAfter.claimed}, refunded=${escrowAfter.refunded}`);

  // 9. Verify protocol config
  console.log('\n▸ Step 9: Verify protocol config');
  const config = await client.getConfig();
  if (!config) {
    fail('Protocol config not found');
  }
  info(`Fee: ${config.feeBps} bps (${config.feeBps / 100}%)`);
  info(`Paused: ${config.paused}`);
  info(`Admin: ${config.admin.toBase58()}`);
  ok('Protocol config verified');

  // Done
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  🎉 ALL E2E TESTS PASSED');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('  Explorer links:');
  console.log(`  • Create tx: https://explorer.solana.com/tx/${claimResult.txSignature}?cluster=devnet`);
  console.log(`  • Escrow: https://explorer.solana.com/address/${result.escrowAddress.toBase58()}?cluster=devnet`);
  console.log('');
}

main().catch((err) => {
  console.error('\n  ❌ Unexpected error:', err);
  process.exit(1);
});
