#!/bin/bash
# ZKIRA Pay - Devnet Deployment Script
# Run this when you have SOL in your devnet wallet
#
# Prerequisites:
#   1. Solana CLI installed and configured for devnet
#   2. At least 4 SOL in ~/.config/solana/id.json on devnet
#   3. Anchor CLI installed
#   4. Programs built (anchor build --no-idl)
#
# Usage:
#   chmod +x scripts/deploy-devnet.sh
#   ./scripts/deploy-devnet.sh

set -e

# Load environment
source "$HOME/.cargo/env" 2>/dev/null || true
export PATH="/Users/williamlee/.local/share/solana/install/active_release/bin:$PATH"

echo "=== ZKIRA Pay Devnet Deployment ==="
echo ""

# Check Solana config
echo "Checking Solana config..."
solana config get
echo ""

# Check balance
BALANCE=$(solana balance --output json | jq -r '.lamports // 0')
BALANCE_SOL=$(echo "scale=2; $BALANCE / 1000000000" | bc 2>/dev/null || echo "unknown")
echo "Current balance: $BALANCE_SOL SOL"

if [ "$BALANCE" -lt 4000000000 ] 2>/dev/null; then
    echo "ERROR: Need at least 4 SOL for deployment. Current: $BALANCE_SOL SOL"
    echo ""
    echo "Get SOL from:"
    echo "  1. https://faucet.solana.com (browser, with GitHub auth for higher limits)"
    echo "  2. solana airdrop 2 (CLI, if not rate-limited)"
    echo ""
    exit 1
fi

echo ""
echo "=== Step 1: Deploy ghost-registry ==="
anchor deploy --program-name ghost_registry --provider.cluster devnet
echo "ghost-registry deployed!"

echo ""
echo "=== Step 2: Deploy payment-escrow ==="
anchor deploy --program-name payment_escrow --provider.cluster devnet
echo "payment-escrow deployed!"

echo ""
echo "=== Step 3: Initialize Protocol Config ==="
ADMIN_PUBKEY=$(solana address)
echo "Admin/Fee Recipient: $ADMIN_PUBKEY"

# Use a Node.js script to initialize config
node -e "
const { Connection, Keypair, Transaction, clusterApiUrl, SystemProgram, PublicKey } = require('@solana/web3.js');
const { sha256 } = require('@noble/hashes/sha256');
const fs = require('fs');

async function main() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Load admin keypair
  const keypairData = JSON.parse(fs.readFileSync(process.cwd() + '/keys/deployer.json', 'utf-8'));
  const admin = Keypair.fromSecretKey(new Uint8Array(keypairData));
  
  console.log('Admin:', admin.publicKey.toBase58());
  
  // Program ID
  const PROGRAM_ID = new PublicKey('DvHQCrzhL8ofNQFqxkRHnqf4Gmkejv48DCFAUMGtKHmX');
  
  // Derive config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    PROGRAM_ID
  );
  console.log('Config PDA:', configPda.toBase58());
  
  // Check if config already exists
  const configInfo = await connection.getAccountInfo(configPda);
  if (configInfo) {
    console.log('Config already initialized! Skipping.');
    return;
  }
  
  // Build initialize_config instruction
  const discriminator = sha256('global:initialize_config').slice(0, 8);
  
  // Serialize fee_bps (u16 LE) = 25 (0.25%)
  const feeBpsBytes = new Uint8Array(2);
  new DataView(feeBpsBytes.buffer).setUint16(0, 25, true);
  
  // Concat data
  const data = Buffer.concat([Buffer.from(discriminator), feeBpsBytes]);
  
  const ix = {
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: true },
      { pubkey: admin.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  };
  
  const tx = new Transaction().add(ix);
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = admin.publicKey;
  tx.sign(admin);
  
  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(sig);
  
  console.log('Config initialized! Tx:', sig);
  console.log('Fee: 0.25% (25 bps)');
  console.log('Admin:', admin.publicKey.toBase58());
  console.log('Fee Recipient:', admin.publicKey.toBase58());
}

main().catch(console.error);
"

echo ""
echo "=== Deployment Complete! ==="
echo ""
echo "Programs deployed to Solana devnet:"
echo "  ghost-registry:  EECGiV8qMJm7BT4HpLw3KBWUAETDDB8H33jaRtTRpe5v"
echo "  payment-escrow:  DvHQCrzhL8ofNQFqxkRHnqf4Gmkejv48DCFAUMGtKHmX"
echo ""
echo "Payment app: http://165.22.161.162:3011"
echo ""
echo "To test:"
echo "  1. Go to http://165.22.161.162:3011/create"
echo "  2. Connect Phantom wallet (switch to devnet)"
echo "  3. Click 'Generate Test' for a test recipient"
echo "  4. Enter amount and create payment"
echo "  5. Share the payment link to claim"
