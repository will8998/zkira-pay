#!/bin/bash
# ZKIRA Pay - Devnet Deployment Script
# Run this when you have SOL in your devnet wallet
#
# Prerequisites:
#   1. Solana CLI installed and configured for devnet
#   2. At least 6 SOL in ~/.config/solana/id.json on devnet
#   3. Anchor CLI installed
#   4. Programs built (anchor build --no-idl)
#   5. Circom installed for circuit compilation
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

if [ "$BALANCE" -lt 6000000000 ] 2>/dev/null; then
    echo "ERROR: Need at least 6 SOL for deployment. Current: $BALANCE_SOL SOL"
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
echo "=== Step 4: Build shielded-pool program ==="
echo "Building shielded-pool program..."
anchor build --no-idl -p shielded_pool
echo "shielded-pool program built!"

echo ""
echo "=== Step 5: Deploy shielded-pool ==="
anchor deploy --program-name shielded_pool --provider.cluster devnet
echo "shielded-pool deployed!"

echo ""
echo "=== Step 6: Compile circuits ==="
echo "Checking circom installation..."
if ! command -v circom &> /dev/null; then
    echo "ERROR: circom not found!"
    echo ""
    echo "Install circom:"
    echo "  1. Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo "  2. Install circom: cargo install --git https://github.com/iden3/circom.git"
    echo "  3. Or use npm: npm install -g circom"
    echo ""
    exit 1
fi

echo "Compiling circuits..."
cd circuits
if [ ! -f "package.json" ]; then
    echo "ERROR: circuits/package.json not found. Make sure you're in the project root."
    exit 1
fi

pnpm run compile
echo "Circuits compiled!"
cd ..

echo ""
echo "=== Step 7: Run trusted setup ==="
cd circuits
if [ ! -f "build/withdraw_final.zkey" ]; then
    echo "Running trusted setup (this may take a few minutes)..."
    pnpm run setup
    echo "Trusted setup complete!"
else
    echo "Trusted setup already exists, skipping..."
fi
cd ..

echo ""
echo "=== Step 8: Copy circuit artifacts ==="
echo "Creating public circuits directory..."
mkdir -p apps/pay/public/circuits

echo "Copying circuit artifacts..."
if [ -f "circuits/build/withdraw_js/withdraw.wasm" ]; then
    cp circuits/build/withdraw_js/withdraw.wasm apps/pay/public/circuits/withdraw.wasm
    echo "✓ withdraw.wasm copied"
else
    echo "ERROR: withdraw.wasm not found in circuits/build/withdraw_js/"
    exit 1
fi

if [ -f "circuits/build/withdraw_final.zkey" ]; then
    cp circuits/build/withdraw_final.zkey apps/pay/public/circuits/withdraw_final.zkey
    echo "✓ withdraw_final.zkey copied"
else
    echo "ERROR: withdraw_final.zkey not found in circuits/build/"
    exit 1
fi

echo "Circuit artifacts ready for browser access!"

echo ""
echo "=== Step 9: Initialize shielded pool ==="
ADMIN_PUBKEY=$(solana address)
echo "Initializing shielded pool with admin: $ADMIN_PUBKEY"

# Use a Node.js script to initialize shielded pool
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
  
  // Program ID and constants
  const PROGRAM_ID = new PublicKey('6g5RquPcpe81VzB6CtmuS8pzbXs7nZ5CT7gZt4fLKedx');
  const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // devnet USDC
  const DENOMINATION = 10000000; // 10 USDC with 6 decimals
  
  // Derive pool state PDA
  const [poolStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_state'), USDC_MINT.toBuffer()],
    PROGRAM_ID
  );
  console.log('Pool State PDA:', poolStatePda.toBase58());
  
  // Check if pool already exists
  const poolInfo = await connection.getAccountInfo(poolStatePda);
  if (poolInfo) {
    console.log('Shielded pool already initialized! Skipping.');
    return;
  }
  
  // Build initialize instruction
  const discriminator = sha256('global:initialize').slice(0, 8);
  
  // Serialize denomination (u64 LE)
  const denominationBytes = new Uint8Array(8);
  new DataView(denominationBytes.buffer).setBigUint64(0, BigInt(DENOMINATION), true);
  
  // Concat data
  const data = Buffer.concat([Buffer.from(discriminator), denominationBytes]);
  
  const ix = {
    keys: [
      { pubkey: poolStatePda, isSigner: false, isWritable: true },
      { pubkey: USDC_MINT, isSigner: false, isWritable: false },
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
  
  console.log('Shielded pool initialized! Tx:', sig);
  console.log('Token Mint:', USDC_MINT.toBase58());
  console.log('Denomination: 10 USDC');
  console.log('Pool State PDA:', poolStatePda.toBase58());
}

main().catch(console.error);
"

echo ""
echo "=== Deployment Complete! ==="
echo ""
echo "Programs deployed to Solana devnet:"
echo "  ghost-registry:  EECGiV8qMJm7BT4HpLw3KBWUAETDDB8H33jaRtTRpe5v"
echo "  payment-escrow:  DvHQCrzhL8ofNQFqxkRHnqf4Gmkejv48DCFAUMGtKHmX"
echo "  shielded-pool:   6g5RquPcpe81VzB6CtmuS8pzbXs7nZ5CT7gZt4fLKedx"
echo ""
echo "Privacy Infrastructure:"
echo "  ✓ Circuits compiled and artifacts copied to apps/pay/public/circuits/"
echo "  ✓ Shielded pool initialized for USDC (10 USDC denomination)"
echo "  ✓ Circuit files: withdraw.wasm, withdraw_final.zkey"
echo ""
echo "Payment app: http://165.22.161.162:3011"
echo ""

echo "=== Step 10: Relayer Setup Instructions ==="
echo ""
echo "To start the relayer service:"
echo ""
echo "1. Set environment variables:"
echo "   export SOLANA_RPC_URL=https://api.devnet.solana.com"
echo "   export RELAYER_PRIVATE_KEY=<your_relayer_private_key>"
echo "   export SHIELDED_POOL_PROGRAM_ID=6g5RquPcpe81VzB6CtmuS8pzbXs7nZ5CT7gZt4fLKedx"
echo "   export USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
echo ""
echo "2. Start the relayer:"
echo "   cd services/relayer"
echo "   pnpm install"
echo "   pnpm start"
echo ""
echo "3. Relayer will run on port 3013"
echo "   Health check: http://165.22.161.162:3013/health"
echo ""
echo "Note: Make sure the relayer wallet has sufficient SOL for transaction fees"
echo "and USDC tokens for pool operations."
echo ""

echo "To test:"
echo "  1. Go to http://165.22.161.162:3011/create"
echo "  2. Connect Phantom wallet (switch to devnet)"
echo "  3. Click 'Generate Test' for a test recipient"
echo "  4. Enter amount and create payment"
echo "  5. Share the payment link to claim"
echo "  6. Test shielded transfers via the privacy tab"