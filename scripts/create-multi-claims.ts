/**
 * Deploy 3 pools with different denominations and create a claim for each.
 *
 * Uses the existing test infrastructure (verifier, hasher, oracle) from
 * test-deployment-421614.json and the mintable tUSDC TestToken.
 *
 * Usage: npx tsx scripts/create-multi-claims.ts [--api-url URL]
 */

import { JsonRpcProvider, Wallet, Contract, ContractFactory } from 'ethers';
import { buildMimcSponge } from 'circomlibjs';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// ── Configuration ────────────────────────────────────────────────────────────

const RPC_URL = 'https://sepolia-rollup.arbitrum.io/rpc';
const PRIVATE_KEY = 'b5a46989174d7d63e87039107e0214452e3a73c19ef979a425966b27fe545b21';

// Mintable tUSDC TestToken
const TOKEN_ADDRESS = '0x24469622D98ca04AE03fe628Bb0051B76816F897';
const TOKEN_SYMBOL = 'usdc';
const CHAIN = 'arbitrum';

// Existing infrastructure from test-deployment-421614.json
const VERIFIER = '0xa2aA5F74AD18A5d0EAF89B551d27060Ea08a2EEB';
const HASHER = '0xB2f940f7facE51076F823EFfb19C6B615cCBDA16';
const SANCTIONS_ORACLE = '0xAd18BFABA4f6D6c0137559fCa5ff62A21fc3Fd27';
const TREASURY = '0x292B6763E4b26708E1d643AC4F1658e3Ba8636cB';
const MERKLE_TREE_HEIGHT = 20;
const PROTOCOL_FEE_BPS = 100; // 1%

// Pools to deploy: label, denomination in raw units (6 decimals)
const POOLS_TO_DEPLOY = [
  { label: '10 USDC', denomination: 10_000_000n },
  { label: '100 USDC', denomination: 100_000_000n },
  { label: '1000 USDC', denomination: 1_000_000_000n },
];

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

// ── Claim Code Generation ────────────────────────────────────────────────────

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

// ── AES-GCM Encryption ──────────────────────────────────────────────────────

async function aesEncrypt(
  plaintext: string,
  hexKey: string,
): Promise<{ ciphertext: string; nonce: string }> {
  const key = Buffer.from(hexKey, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([encrypted, authTag]);
  return {
    ciphertext: combined.toString('base64'),
    nonce: iv.toString('base64'),
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const apiUrlIdx = args.indexOf('--api-url');
  const apiUrl = apiUrlIdx >= 0 && args[apiUrlIdx + 1] ? args[apiUrlIdx + 1] : DEFAULT_API_URL;

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   OMNIPAY — Deploy Pools + Create Multi-Denomination Claims   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`API URL: ${apiUrl}`);
  console.log('');

  // 1. Connect wallet
  const provider = new JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);
  console.log(`Wallet: ${wallet.address}`);
  const ethBalance = await provider.getBalance(wallet.address);
  console.log(`ETH balance: ${ethBalance} wei`);

  // 2. Initialize MiMC
  console.log('\n🔧 Initializing MiMC...');
  const mimcSponge = await buildMimcSponge();

  // 3. Load ERC20Pool artifact for deployment
  const artifactPath = path.join(__dirname, '..', 'contracts', 'arbitrum', 'ERC20Pool-bytecode.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
  console.log('ERC20Pool artifact loaded');

  const tokenContract = new Contract(TOKEN_ADDRESS, ERC20_ABI, wallet);

  // Mint enough tokens for all pools upfront
  const totalNeeded = POOLS_TO_DEPLOY.reduce((sum, p) => sum + p.denomination, 0n);
  const balance = await tokenContract.balanceOf(wallet.address);
  console.log(`\n💰 Token balance: ${balance} (need ${totalNeeded})`);
  if (balance < totalNeeded) {
    console.log('Minting tokens...');
    const mintTx = await tokenContract.mint(wallet.address, totalNeeded * 2n);
    await mintTx.wait();
    console.log('Minted successfully');
  }

  const results: Array<{
    label: string;
    poolAddress: string;
    denomination: string;
    code: string;
    password: string;
    txHash: string;
    leafIndex: number;
  }> = [];

  for (const poolConfig of POOLS_TO_DEPLOY) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  Deploying ${poolConfig.label} pool...`);
    console.log(`${'═'.repeat(60)}`);

    // Deploy new ERC20Pool
    const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const pool = await factory.deploy(
      VERIFIER,
      HASHER,
      poolConfig.denomination,
      MERKLE_TREE_HEIGHT,
      TOKEN_ADDRESS,
      SANCTIONS_ORACLE,
      PROTOCOL_FEE_BPS,
      TREASURY,
      false, // hasBlacklistCheck
    );
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();
    console.log(`✅ Pool deployed: ${poolAddress}`);

    // Approve + deposit
    console.log('Approving token...');
    const approveTx = await tokenContract.approve(poolAddress, poolConfig.denomination);
    await approveTx.wait();

    // Generate nullifier + secret
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

    console.log('Depositing...');
    const poolContract = new Contract(poolAddress, POOL_ABI, wallet);
    const depositTx = await poolContract.deposit(commitmentHex);
    const depositReceipt = await depositTx.wait();
    console.log(`Deposit tx: ${depositTx.hash}`);

    // Extract leafIndex
    const depositEvent = depositReceipt.logs.find((log: any) => {
      try {
        return poolContract.interface.parseLog(log)?.name === 'Deposit';
      } catch {
        return false;
      }
    });
    if (!depositEvent) throw new Error('Deposit event not found');
    const parsedEvent = poolContract.interface.parseLog(depositEvent);
    const leafIndex = Number(parsedEvent!.args.leafIndex);
    console.log(`Leaf index: ${leafIndex}`);

    // Build DepositBundle
    const noteRecord = {
      nullifier: '0x' + nullifier.toString('hex'),
      secret: '0x' + secret.toString('hex'),
      commitment: commitmentHex,
      leafIndex,
      pool: poolAddress,
      denomination: poolConfig.denomination.toString(),
      chain: CHAIN,
      token: TOKEN_SYMBOL,
    };

    const bundle = {
      notes: [noteRecord],
      createdAt: new Date().toISOString(),
      totalRaw: poolConfig.denomination.toString(),
    };

    // Generate claim code + encrypt + store
    const { code, encryptionKey } = generateClaimCode();
    const bundleJson = JSON.stringify(bundle);
    const { ciphertext, nonce } = await aesEncrypt(bundleJson, encryptionKey);
    const dropId = await deriveDeadDropId(code);

    console.log(`Posting dead drop for ${code}...`);
    const response = await fetch(`${apiUrl}/api/dead-drop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dropId,
        payload: { ciphertext, nonce, version: 1 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }
    console.log(`✅ Claim created: ${code}`);

    results.push({
      label: poolConfig.label,
      poolAddress,
      denomination: poolConfig.denomination.toString(),
      code,
      password: encryptionKey,
      txHash: depositTx.hash,
      leafIndex,
    });
  }

  // Final output
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                          TEST CLAIM CREDENTIALS                               ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  for (const r of results) {
    console.log(`║                                                                               ║`);
    console.log(`║  ${r.label.padEnd(12)} | Code: ${r.code.padEnd(20)} | Pool: ${r.poolAddress.substring(0, 10)}...  ║`);
    console.log(`║  ${''.padEnd(12)} | Password: ${r.password.substring(0, 50)}...  ║`);
  }
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  // Also output in easy-copy JSON format
  console.log('\n📋 JSON (for relayer POOL_ADDRESSES):');
  console.log(results.map(r => r.poolAddress).join(','));

  console.log('\n📋 Full details:');
  for (const r of results) {
    console.log(`\n--- ${r.label} ---`);
    console.log(`  Pool:      ${r.poolAddress}`);
    console.log(`  Claim:     ${r.code}`);
    console.log(`  Password:  ${r.password}`);
    console.log(`  Deposit:   ${r.txHash}`);
    console.log(`  Leaf:      ${r.leafIndex}`);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
