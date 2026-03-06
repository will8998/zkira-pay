/**
 * Diagnostic script: simulates the EXACT browser claim flow in Node.js.
 *
 * 1. Fetch dead drop by claim code
 * 2. Decrypt with AES-GCM
 * 3. Parse DepositBundle
 * 4. Build sparse Merkle tree (same code as withdraw-engine.ts)
 * 5. Extract Merkle path
 * 6. Check isKnownRoot on-chain
 * 7. Generate ZK proof
 * 8. Verify proof locally
 *
 * Usage: npx tsx scripts/diagnose-claim.ts \
 *   --code "OMNIPAY-XXXX-XXXX" \
 *   --password "hex..." \
 *   --api-url http://localhost:3021
 */

import { JsonRpcProvider, Contract } from 'ethers';
import { buildMimcSponge } from 'circomlibjs';
import * as snarkjs from 'snarkjs';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

// ── Constants ────────────────────────────────────────────────────────────
const RPC_URL = 'https://sepolia-rollup.arbitrum.io/rpc';
const TREE_DEPTH = 20;

const POOL_ABI = [
  'event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp)',
  'function getLastRoot() external view returns (bytes32)',
  'function isKnownRoot(bytes32 _root) external view returns (bool)',
  'function isSpent(bytes32 _nullifierHash) external view returns (bool)',
];

// Pre-computed zeros from contract (identical to withdraw-engine.ts)
const CONTRACT_ZEROS: bigint[] = [
  0x2fe54c60d3acabf3343a35b6eba15db4821b340f76e741e2249685ed4899af6cn,
  0x256a6135777eee2fd26f54b8b7037a25439d5235caee224154186d2b8a52e31dn,
  0x1151949895e82ab19924de92c40a3d6f7bcb60d92b00504b8199613683f0c200n,
  0x20121ee811489ff8d61f09fb89e313f14959a0f28bb428a20dba6b0b068b3bdbn,
  0x0a89ca6ffa14cc462cfedb842c30ed221a50a3d6bf022a6a57dc82ab24c157c9n,
  0x24ca05c2b5cd42e890d6be94c68d0689f4f21c9cec9c0f13fe41d566dfb54959n,
  0x1ccb97c932565a92c60156bdba2d08f3bf1377464e025cee765679e604a7315cn,
  0x19156fbd7d1a8bf5cba8909367de1b624534ebab4f0f79e003bccdd1b182bdb4n,
  0x261af8c1f0912e465744641409f622d466c3920ac6e5ff37e36604cb11dfff80n,
  0x0058459724ff6ca5a1652fcbc3e82b93895cf08e975b19beab3f54c217d1c007n,
  0x1f04ef20dee48d39984d8eabe768a70eafa6310ad20849d4573c3c40c2ad1e30n,
  0x1bea3dec5dab51567ce7e200a30f7ba6d4276aeaa53e2686f962a46c66d511e5n,
  0x0ee0f941e2da4b9e31c3ca97a40d8fa9ce68d97c084177071b3cb46cd3372f0fn,
  0x1ca9503e8935884501bbaf20be14eb4c46b89772c97b96e3b2ebf3a36a948bbdn,
  0x133a80e30697cd55d8f7d4b0965b7be24057ba5dc3da898ee2187232446cb108n,
  0x13e6d8fc88839ed76e182c2a779af5b2c0da9dd18c90427a644f7e148a6253b6n,
  0x1eb16b057a477f4bc8f572ea6bee39561098f78f15bfb3699dcbb7bd8db61854n,
  0x0da2cb16a1ceaabf1c16b838f7a9e3f2a3a3088d9e0a6debaa748114620696ean,
  0x24a3b3d822420b14b5d8cb6c28a574f01e98ea9e940551d2ebd75cee12649f9dn,
  0x198622acbd783d1b0d9064105b1fc8e4d8889de95c4c519b3f635809fe6afc05n,
  0x29d7ed391256ccc3ea596c86e933b89ff339d25ea8ddced975ae2fe30b5296d4n,
];

// ── AES-GCM Decryption (mirrors browser WebCrypto) ───────────────────────
function decryptAesGcm(ciphertextB64: string, nonceB64: string, hexKey: string): string {
  const key = Buffer.from(hexKey, 'hex');
  const nonce = Buffer.from(nonceB64, 'base64');
  const combined = Buffer.from(ciphertextB64, 'base64');

  // WebCrypto AES-GCM appends 16-byte auth tag
  const authTagLen = 16;
  const encrypted = combined.subarray(0, combined.length - authTagLen);
  const authTag = combined.subarray(combined.length - authTagLen);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf-8');
}

// ── Dead Drop ID derivation (mirrors claim-code.ts) ─────────────────────
async function deriveDeadDropId(code: string): Promise<string> {
  const data = Buffer.from(code.toUpperCase().trim(), 'utf-8');
  const hash = crypto.createHash('sha256').update(data).digest();
  return hash.toString('hex');
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  // Parse args
  const args = process.argv.slice(2);
  const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
  };

  const claimCode = getArg('--code');
  const password = getArg('--password');
  const apiUrl = getArg('--api-url') || 'http://localhost:3021';
  const recipient = getArg('--recipient') || '0x' + '1'.repeat(40); // dummy recipient

  if (!claimCode || !password) {
    console.error('Usage: npx tsx scripts/diagnose-claim.ts --code "OMNIPAY-XXXX-XXXX" --password "hex..."');
    process.exit(1);
  }

  console.log('=== CLAIM FLOW DIAGNOSTIC ===');
  console.log(`Code: ${claimCode}`);
  console.log(`Password: ${password.substring(0, 16)}...`);
  console.log(`API: ${apiUrl}`);
  console.log(`Recipient: ${recipient}`);
  console.log('');

  // ── Step 1: Derive dead drop ID ──────────────────────────────────
  console.log('STEP 1: Derive dead drop ID');
  const dropId = await deriveDeadDropId(claimCode);
  console.log(`  Drop ID: ${dropId}`);

  // ── Step 2: Fetch dead drop ──────────────────────────────────────
  console.log('\nSTEP 2: Fetch dead drop');
  const res = await fetch(`${apiUrl}/api/dead-drop/${dropId}`);
  if (!res.ok) {
    console.error(`  ❌ API returned ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const dropData = await res.json();
  console.log(`  ✅ Retrieved. Claimed: ${dropData.claimed}`);

  // ── Step 3: Decrypt ──────────────────────────────────────────────
  console.log('\nSTEP 3: Decrypt bundle');
  let plaintext: string;
  try {
    plaintext = decryptAesGcm(dropData.payload.ciphertext, dropData.payload.nonce, password);
    console.log(`  ✅ Decrypted. Length: ${plaintext.length} chars`);
  } catch (err: any) {
    console.error(`  ❌ Decryption failed: ${err.message}`);
    process.exit(1);
  }

  // ── Step 4: Parse bundle ─────────────────────────────────────────
  console.log('\nSTEP 4: Parse deposit bundle');
  const bundle = JSON.parse(plaintext);
  console.log(`  Notes: ${bundle.notes.length}`);
  for (const note of bundle.notes) {
    console.log(`  Note:`);
    console.log(`    nullifier:    ${note.nullifier}`);
    console.log(`    secret:       ${note.secret}`);
    console.log(`    commitment:   ${note.commitment}`);
    console.log(`    leafIndex:    ${note.leafIndex}`);
    console.log(`    pool:         ${note.pool}`);
    console.log(`    chain:        ${note.chain}`);
    console.log(`    denomination: ${note.denomination}`);
    console.log(`    token:        ${note.token}`);
  }

  // ── Step 5: Initialize MiMC ──────────────────────────────────────
  console.log('\nSTEP 5: Initialize MiMC');
  const mimcSponge = await buildMimcSponge();
  console.log('  ✅ MiMC initialized');

  // ── Step 6: Verify commitment ────────────────────────────────────
  console.log('\nSTEP 6: Verify commitment matches nullifier+secret');
  const note = bundle.notes[0];
  const nullifier = BigInt(note.nullifier);
  const secret = BigInt(note.secret);
  console.log(`  nullifier as BigInt: ${nullifier}`);
  console.log(`  secret as BigInt:    ${secret}`);

  const recomputedCommitment = mimcSponge.F.toObject(
    mimcSponge.multiHash([nullifier, secret], 0n, 1),
  );
  const recomputedHex = '0x' + BigInt(recomputedCommitment).toString(16).padStart(64, '0');
  console.log(`  Stored commitment:     ${note.commitment}`);
  console.log(`  Recomputed commitment: ${recomputedHex}`);
  console.log(`  Match: ${note.commitment.toLowerCase() === recomputedHex.toLowerCase() ? '✅ YES' : '❌ NO'}`);

  // ── Step 7: Build sparse Merkle tree ─────────────────────────────
  console.log('\nSTEP 7: Build sparse Merkle tree');
  const provider = new JsonRpcProvider(RPC_URL);
  const poolContract = new Contract(note.pool, POOL_ABI, provider);

  const events = await poolContract.queryFilter(poolContract.filters.Deposit(), 0, 'latest');
  const deposits: Array<{ commitment: bigint; leafIndex: number }> = [];
  for (const event of events) {
    const eArgs = (event as any).args;
    deposits.push({
      commitment: BigInt(eArgs.commitment),
      leafIndex: Number(eArgs.leafIndex),
    });
  }
  deposits.sort((a, b) => a.leafIndex - b.leafIndex);

  console.log(`  Deposits found: ${deposits.length}`);
  for (const dep of deposits) {
    const match = dep.commitment === recomputedCommitment ? ' ← OUR NOTE' : '';
    console.log(`    [${dep.leafIndex}] ${('0x' + dep.commitment.toString(16).padStart(64, '0')).substring(0, 20)}...${match}`);
  }

  // Check if our commitment is in the deposits
  const ourDeposit = deposits.find(d => d.leafIndex === note.leafIndex);
  if (!ourDeposit) {
    console.error(`  ❌ No deposit found at leafIndex ${note.leafIndex}`);
    process.exit(1);
  }
  console.log(`  On-chain commitment at index ${note.leafIndex}: 0x${ourDeposit.commitment.toString(16).padStart(64, '0')}`);
  console.log(`  Matches recomputed: ${ourDeposit.commitment === recomputedCommitment ? '✅ YES' : '❌ NO'}`);

  // Build sparse tree
  const nodes = new Map<string, bigint>();
  for (const dep of deposits) {
    nodes.set(`0:${dep.leafIndex}`, dep.commitment);
  }

  const filledSubtrees: bigint[] = new Array(TREE_DEPTH).fill(0n);
  for (let i = 0; i < TREE_DEPTH; i++) {
    filledSubtrees[i] = CONTRACT_ZEROS[i];
  }
  let currentRoot = CONTRACT_ZEROS[TREE_DEPTH];

  for (const dep of deposits) {
    let currentIndex = dep.leafIndex;
    let currentLevelHash = dep.commitment;

    for (let level = 0; level < TREE_DEPTH; level++) {
      let left: bigint;
      let right: bigint;

      if (currentIndex % 2 === 0) {
        left = currentLevelHash;
        right = CONTRACT_ZEROS[level];
        filledSubtrees[level] = currentLevelHash;
      } else {
        left = filledSubtrees[level];
        right = currentLevelHash;
      }

      if (currentIndex % 2 === 0) {
        nodes.set(`${level}:${currentIndex + 1}`, right);
      } else {
        nodes.set(`${level}:${currentIndex - 1}`, left);
      }

      const parentIndex = Math.floor(currentIndex / 2);
      currentLevelHash = mimcSponge.F.toObject(
        mimcSponge.multiHash([left, right], 0n, 1),
      );
      nodes.set(`${level + 1}:${parentIndex}`, currentLevelHash);
      currentIndex = parentIndex;
    }
    currentRoot = currentLevelHash;
  }

  const computedRootHex = '0x' + BigInt(currentRoot).toString(16).padStart(64, '0');

  // ── Step 8: Verify root on-chain ─────────────────────────────────
  console.log('\nSTEP 8: Verify computed root against on-chain');
  const onChainRoot = await poolContract.getLastRoot();
  console.log(`  Computed root: ${computedRootHex}`);
  console.log(`  On-chain root: ${onChainRoot}`);
  console.log(`  Match: ${onChainRoot.toLowerCase() === computedRootHex.toLowerCase() ? '✅ YES' : '❌ NO'}`);

  const isKnown = await poolContract.isKnownRoot(computedRootHex);
  console.log(`  isKnownRoot:   ${isKnown ? '✅ YES' : '❌ NO'}`);

  if (!isKnown) {
    console.error('  ❌ ROOT NOT KNOWN ON-CHAIN — tree computation is wrong!');
    // Don't exit — continue to diagnose further
  }

  // ── Step 9: Extract Merkle path ──────────────────────────────────
  console.log('\nSTEP 9: Extract Merkle path');
  const pathElements: bigint[] = [];
  const pathIndices: number[] = [];
  let idx = note.leafIndex;

  for (let level = 0; level < TREE_DEPTH; level++) {
    const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
    const sibling = nodes.get(`${level}:${siblingIdx}`) ?? CONTRACT_ZEROS[level];
    pathElements.push(sibling);
    pathIndices.push(idx % 2);
    idx = Math.floor(idx / 2);
  }

  console.log(`  Path indices: [${pathIndices.slice(0, 5).join(', ')}...]`);
  console.log(`  First 3 path elements:`);
  for (let i = 0; i < 3; i++) {
    console.log(`    [${i}] 0x${pathElements[i].toString(16).padStart(64, '0').substring(0, 20)}...`);
  }

  // Verify path manually: hash up from leaf to root
  console.log('\n  Manual path verification:');
  let currentHash = recomputedCommitment;
  for (let level = 0; level < TREE_DEPTH; level++) {
    const left = pathIndices[level] === 0 ? currentHash : pathElements[level];
    const right = pathIndices[level] === 0 ? pathElements[level] : currentHash;
    currentHash = mimcSponge.F.toObject(
      mimcSponge.multiHash([left, right], 0n, 1),
    );
  }
  const manualRootHex = '0x' + BigInt(currentHash).toString(16).padStart(64, '0');
  console.log(`  Manual root:   ${manualRootHex}`);
  console.log(`  Matches tree:  ${manualRootHex === computedRootHex ? '✅ YES' : '❌ NO'}`);

  // ── Step 10: Compute nullifierHash ───────────────────────────────
  console.log('\nSTEP 10: Compute nullifierHash');
  const nullifierHash = mimcSponge.F.toObject(
    mimcSponge.multiHash([nullifier], 0n, 1),
  );
  console.log(`  nullifierHash: 0x${BigInt(nullifierHash).toString(16).padStart(64, '0')}`);

  const isSpent = await poolContract.isSpent('0x' + BigInt(nullifierHash).toString(16).padStart(64, '0'));
  console.log(`  isSpent:       ${isSpent ? '⚠️ ALREADY SPENT' : '✅ NOT SPENT'}`);

  // ── Step 11: Generate ZK proof ───────────────────────────────────
  console.log('\nSTEP 11: Generate ZK proof');
  const circuitInputs = {
    nullifier: nullifier.toString(),
    secret: secret.toString(),
    pathElements: pathElements.map((e) => e.toString()),
    pathIndices,
    root: currentRoot.toString(),
    nullifierHash: nullifierHash.toString(),
    recipient: BigInt(recipient).toString(),
    relayer: '0',
    fee: '0',
    refund: '0',
  };

  console.log('  Circuit inputs:');
  console.log(`    nullifier:    ${circuitInputs.nullifier.substring(0, 20)}...`);
  console.log(`    secret:       ${circuitInputs.secret.substring(0, 20)}...`);
  console.log(`    root:         ${circuitInputs.root.substring(0, 20)}...`);
  console.log(`    nullifierHash:${circuitInputs.nullifierHash.substring(0, 20)}...`);
  console.log(`    recipient:    ${circuitInputs.recipient.substring(0, 20)}...`);
  console.log(`    pathIndices:  [${pathIndices.slice(0, 5).join(',')}...]`);

  const wasmPath = path.join(__dirname, '..', 'apps', 'pay', 'public', 'circuits', 'withdraw.wasm');
  const zkeyPath = path.join(__dirname, '..', 'apps', 'pay', 'public', 'circuits', 'withdraw_final.zkey');

  try {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      wasmPath,
      zkeyPath,
    );
    console.log('  ✅ Proof generated successfully!');
    console.log(`  Public signals: ${JSON.stringify(publicSignals)}`);

    // ── Step 12: Verify proof locally ──────────────────────────────
    console.log('\nSTEP 12: Verify proof locally');
    const vkeyPath = path.join(__dirname, '..', 'apps', 'pay', 'public', 'circuits', 'verification_key.json');
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    console.log(`  Local verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

    console.log('\n🎉 FULL CLAIM FLOW DIAGNOSTIC PASSED');
  } catch (err: any) {
    console.error(`\n  ❌ PROOF GENERATION FAILED: ${err.message}`);
    console.error('  This means the circuit inputs are inconsistent.');
    console.error('  Check steps above for ❌ markers.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
