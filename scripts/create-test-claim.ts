/**
 * Create a test claim code for OMNIPAY.
 *
 * Flow:
 *  1. Mint tUSDC test tokens (mintable TestToken)
 *  2. Approve + deposit into ERC20Pool on Arbitrum Sepolia
 *  3. Generate a claim code + AES-256 encryption key
 *  4. Build DepositBundle, encrypt with AES-GCM
 *  5. Derive dead-drop ID from claim code via SHA-256
 *  6. POST encrypted bundle to the API
 *  7. Output the claim code + password
 *
 * Usage: npx tsx scripts/create-test-claim.ts [--api-url URL]
 */

import { JsonRpcProvider, Wallet, Contract } from 'ethers';
import { buildMimcSponge } from 'circomlibjs';
import * as crypto from 'crypto';

// ── Configuration ────────────────────────────────────────────────────────────

const RPC_URL = 'https://sepolia-rollup.arbitrum.io/rpc';
const PRIVATE_KEY = 'b5a46989174d7d63e87039107e0214452e3a73c19ef979a425966b27fe545b21';

// e2e test tUSDC (mintable TestToken)
const TOKEN_ADDRESS = '0x24469622D98ca04AE03fe628Bb0051B76816F897';
// e2e test 1 tUSDC pool
const POOL_ADDRESS = '0x8E2De22e4cD6be8EbFf95205d40A343A2a852E45';
const DENOMINATION = 1_000_000n; // 1 USDC in 6 decimals
const TOKEN_SYMBOL = 'usdc';
const CHAIN = 'arbitrum';

// API URL (override with --api-url flag)
const DEFAULT_API_URL = 'http://localhost:3021';

// ── ABIs ─────────────────────────────────────────────────────────────────────

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function mint(address to, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

const POOL_ABI = [
  'function deposit(bytes32 _commitment) external payable',
  'event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp)',
  'function denomination() external view returns (uint256)',
  'function nextIndex() external view returns (uint32)',
];

// ── Claim Code Generation (mirrors apps/pay/src/lib/claim-code.ts) ───────────

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSegment(len: number): string {
  const bytes = crypto.randomBytes(len);
  let segment = '';
  for (let i = 0; i < len; i++) {
    segment += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return segment;
}

function generateClaimCode(): { code: string; encryptionKey: string } {
  const code = `OMNIPAY-${randomSegment(4)}-${randomSegment(4)}`;
  const keyBytes = crypto.randomBytes(32);
  const encryptionKey = keyBytes.toString('hex');
  return { code, encryptionKey };
}

async function deriveDeadDropId(code: string): Promise<string> {
  const data = Buffer.from(code.toUpperCase().trim(), 'utf-8');
  const hash = crypto.createHash('sha256').update(data).digest();
  return hash.toString('hex');
}

// ── AES-GCM Encryption (mirrors apps/pay/src/lib/dead-drop-crypto.ts) ────────

async function aesEncrypt(
  plaintext: string,
  hexKey: string,
): Promise<{ ciphertext: string; nonce: string }> {
  const key = Buffer.from(hexKey, 'hex');
  const iv = crypto.randomBytes(12); // 96-bit nonce
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf-8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // AES-GCM in WebCrypto appends the auth tag to the ciphertext
  const combined = Buffer.concat([encrypted, authTag]);

  return {
    ciphertext: combined.toString('base64'),
    nonce: iv.toString('base64'),
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Parse --api-url flag
  const args = process.argv.slice(2);
  const apiUrlIdx = args.indexOf('--api-url');
  const apiUrl = apiUrlIdx >= 0 && args[apiUrlIdx + 1] ? args[apiUrlIdx + 1] : DEFAULT_API_URL;

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        OMNIPAY — Create Test Claim Code                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`API URL: ${apiUrl}`);
  console.log(`RPC: ${RPC_URL}`);
  console.log(`Pool: ${POOL_ADDRESS}`);
  console.log(`Token: ${TOKEN_ADDRESS}`);
  console.log('');

  // 1. Connect wallet
  const provider = new JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);
  console.log(`Wallet: ${wallet.address}`);

  const ethBalance = await provider.getBalance(wallet.address);
  console.log(`ETH balance: ${ethBalance} wei`);
  if (ethBalance === 0n) {
    throw new Error('Deployer has no ETH for gas');
  }

  // 2. Initialize MiMC
  console.log('\n🔧 Initializing MiMC...');
  const mimcSponge = await buildMimcSponge();

  // 3. Generate random nullifier and secret
  const nullifier = crypto.randomBytes(31);
  const secret = crypto.randomBytes(31);

  const commitment = mimcSponge.F.toObject(
    mimcSponge.multiHash(
      [BigInt('0x' + nullifier.toString('hex')), BigInt('0x' + secret.toString('hex'))],
      0n,
      1,
    ),
  );
  const commitmentHex = '0x' + BigInt(commitment).toString(16).padStart(64, '0');
  console.log(`Commitment: ${commitmentHex}`);

  // 4. Mint tokens if needed
  const tokenContract = new Contract(TOKEN_ADDRESS, ERC20_ABI, wallet);
  const balance = await tokenContract.balanceOf(wallet.address);
  console.log(`\n💰 Token balance: ${balance} (need ${DENOMINATION})`);

  if (balance < DENOMINATION) {
    console.log('Minting tokens...');
    const mintTx = await tokenContract.mint(wallet.address, DENOMINATION * 10n);
    await mintTx.wait();
    console.log('Minted successfully');
  }

  // 5. Approve pool
  const currentAllowance = await tokenContract.allowance(wallet.address, POOL_ADDRESS);
  if (currentAllowance < DENOMINATION) {
    console.log('Approving pool...');
    const approveTx = await tokenContract.approve(POOL_ADDRESS, DENOMINATION);
    await approveTx.wait();
    console.log('Approved');
  }

  // 6. Deposit into pool
  console.log('\n📥 Depositing into pool...');
  const poolContract = new Contract(POOL_ADDRESS, POOL_ABI, wallet);
  const depositTx = await poolContract.deposit(commitmentHex);
  const depositReceipt = await depositTx.wait();
  console.log(`Deposit tx: ${depositTx.hash}`);

  // Extract leafIndex from event
  const depositEvent = depositReceipt.logs.find((log: any) => {
    try {
      const parsed = poolContract.interface.parseLog(log);
      return parsed?.name === 'Deposit';
    } catch {
      return false;
    }
  });

  if (!depositEvent) {
    throw new Error('Deposit event not found in receipt');
  }

  const parsedEvent = poolContract.interface.parseLog(depositEvent);
  const leafIndex = Number(parsedEvent!.args.leafIndex);
  console.log(`✅ Deposit successful! Leaf index: ${leafIndex}`);

  // 7. Build the DepositNoteRecord
  const noteRecord = {
    nullifier: '0x' + nullifier.toString('hex'),
    secret: '0x' + secret.toString('hex'),
    commitment: '0x' + BigInt(commitment).toString(16).padStart(64, '0'),
    leafIndex,
    pool: POOL_ADDRESS,
    denomination: DENOMINATION.toString(),
    chain: CHAIN,
    token: TOKEN_SYMBOL,
  };

  // 8. Build the DepositBundle
  const bundle = {
    notes: [noteRecord],
    createdAt: new Date().toISOString(),
    totalRaw: DENOMINATION.toString(),
  };

  console.log('\n📦 Deposit bundle created');

  // 9. Generate claim code + encryption key
  const { code, encryptionKey } = generateClaimCode();
  console.log(`Claim code: ${code}`);

  // 10. Encrypt the bundle
  console.log('\n🔐 Encrypting bundle with AES-256-GCM...');
  const bundleJson = JSON.stringify(bundle);
  const { ciphertext, nonce } = await aesEncrypt(bundleJson, encryptionKey);
  console.log(`Ciphertext length: ${ciphertext.length} chars`);

  // 11. Derive dead-drop ID
  const dropId = await deriveDeadDropId(code);
  console.log(`Dead drop ID: ${dropId}`);

  // 12. Store dead drop via API
  console.log(`\n📡 Posting dead drop to ${apiUrl}/api/dead-drop ...`);
  const payload = {
    dropId,
    payload: {
      ciphertext,
      nonce,
      version: 1,
    },
  };

  const response = await fetch(`${apiUrl}/api/dead-drop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const result = await response.json();
  console.log('✅ Dead drop stored:', result);

  // 13. Output the claim credentials
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║              TEST CLAIM CREDENTIALS                       ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Claim Code:  ${code.padEnd(42)}║`);
  console.log(`║  Password:    ${encryptionKey.substring(0, 42)}║`);
  if (encryptionKey.length > 42) {
    console.log(`║              ${encryptionKey.substring(42).padEnd(43)}║`);
  }
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Pool:        ${POOL_ADDRESS.padEnd(42)}║`);
  console.log(`║  Deposit TX:  ${depositTx.hash.substring(0, 42)}║`);
  if (depositTx.hash.length > 42) {
    console.log(`║              ${depositTx.hash.substring(42).padEnd(43)}║`);
  }
  console.log(`║  Leaf Index:  ${String(leafIndex).padEnd(42)}║`);
  console.log(`║  Amount:      1 USDC (test)                              ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');
  console.log('To claim, go to omnipay.club → Claim Payment');
  console.log('Enter the claim code and password above.');
  console.log('');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
