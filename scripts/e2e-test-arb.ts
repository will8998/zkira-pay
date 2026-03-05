import { JsonRpcProvider, Wallet, Contract, solidityPacked, zeroPadValue, toBeHex } from 'ethers';
import { buildMimcSponge } from 'circomlibjs';
import * as snarkjs from 'snarkjs';
import * as crypto from 'crypto';
import * as path from 'path';

// ── Constants ──────────────────────────────────────────────────────────────

const RPC_URL = 'https://sepolia-rollup.arbitrum.io/rpc';
const PRIVATE_KEY = 'b5a46989174d7d63e87039107e0214452e3a73c19ef979a425966b27fe545b21';
const DEPLOYER_ADDRESS = '0x292B6763E4b26708E1d643AC4F1658e3Ba8636cB';
const TREASURY_ADDRESS = '0x292B6763E4b26708E1d643AC4F1658e3Ba8636cB';

const TREE_DEPTH = 20;
const PROTOCOL_FEE_BPS = 100; // 1%

// Test token configurations
const TEST_TOKENS = [
  {
    name: 'tUSDC',
    tokenAddress: '0x6d408C98c4252020abf861ca35D1ED938112ba7E',
    poolAddress: '0xbFDAb1ca862438f8Ab8b48c02d469AF57FB1dD96',
    denomination: 1000000n, // 1 USDC (6 decimals)
    decimals: 6,
  },
  {
    name: 'tUSDT',
    tokenAddress: '0xDC27e984F3cB83E49035829F988F759A8aC9962E',
    poolAddress: '0x33A6255713C9aBdAB917D359Ed086eA17a8C6D8D',
    denomination: 1000000n, // 1 USDT (6 decimals)
    decimals: 6,
  },
  {
    name: 'tDAI',
    tokenAddress: '0x4c14E2a93535979E378a36D7D768b3aA69a197e2',
    poolAddress: '0xDeD4D6b4A33768ca627252c3583AA9b57BF6bD3e',
    denomination: 1000000000000000000n, // 1 DAI (18 decimals)
    decimals: 18,
  },
];

// ── Contract ABIs ──────────────────────────────────────────────────────────

const POOL_ABI = [
  'function deposit(bytes32 _commitment) external payable',
  'function withdraw(bytes calldata _proof, bytes32 _root, bytes32 _nullifierHash, address payable _recipient, address payable _relayer, uint256 _fee, uint256 _refund) external payable',
  'event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp)',
  'function isSpent(bytes32 _nullifierHash) external view returns (bool)',
  'function denomination() external view returns (uint256)',
  'function nextIndex() external view returns (uint32)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function mint(address to, uint256 amount) external returns (bool)',
];

// ── Types ──────────────────────────────────────────────────────────────────

interface DepositData {
  nullifier: Buffer;
  secret: Buffer;
  commitment: bigint;
  leafIndex: number;
  pool: string;
  token: string;
  denomination: bigint;
}

// ── Helper Functions ───────────────────────────────────────────────────────

/**
 * Build MiMC Merkle tree from on-chain deposit events
 */
async function buildMerkleTree(
  poolAddress: string,
  provider: JsonRpcProvider,
  mimcSponge: any
): Promise<{ root: bigint; layers: bigint[][]; zeros: bigint[] }> {
  const poolContract = new Contract(poolAddress, POOL_ABI, provider);
  const events = await poolContract.queryFilter(poolContract.filters.Deposit(), 0, 'latest');

  // Collect and sort deposits by leafIndex
  const deposits: Array<{ commitment: bigint; leafIndex: number }> = [];
  for (const event of events) {
    const args = (event as any).args;
    deposits.push({
      commitment: BigInt(args.commitment),
      leafIndex: Number(args.leafIndex),
    });
  }
  deposits.sort((a, b) => a.leafIndex - b.leafIndex);

  // Pre-compute zero values
  const zeros: bigint[] = [0n];
  for (let i = 1; i <= TREE_DEPTH; i++) {
    zeros[i] = mimcSponge.F.toObject(
      mimcSponge.multiHash([zeros[i - 1], zeros[i - 1]], 0n, 1)
    );
  }

  // Build layer 0 (leaves)
  const layers: bigint[][] = [[]];
  for (const dep of deposits) {
    layers[0].push(dep.commitment);
  }

  // Pad to full tree size
  const treeSize = 1 << TREE_DEPTH;
  while (layers[0].length < treeSize) {
    layers[0].push(0n);
  }

  // Build upper layers
  for (let level = 1; level <= TREE_DEPTH; level++) {
    layers[level] = [];
    const prev = layers[level - 1];
    for (let i = 0; i < prev.length; i += 2) {
      const left = prev[i];
      const right = prev[i + 1] ?? zeros[level - 1];
      layers[level].push(
        mimcSponge.F.toObject(mimcSponge.multiHash([left, right], 0n, 1))
      );
    }
  }

  return { root: layers[TREE_DEPTH][0], layers, zeros };
}

/**
 * Extract Merkle path for a given leaf index
 */
function extractPath(
  leafIndex: number,
  layers: bigint[][],
  zeros: bigint[]
): { pathElements: bigint[]; pathIndices: number[] } {
  const pathElements: bigint[] = [];
  const pathIndices: number[] = [];
  let idx = leafIndex;

  for (let level = 0; level < TREE_DEPTH; level++) {
    const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
    pathElements.push(layers[level][siblingIdx] ?? zeros[level]);
    pathIndices.push(idx % 2);
    idx = Math.floor(idx / 2);
  }

  return { pathElements, pathIndices };
}

/**
 * Generate random recipient address for testing
 */
function generateRandomRecipient(): string {
  const randomBytes = crypto.randomBytes(20);
  return '0x' + randomBytes.toString('hex');
}

// ── Main Test Functions ────────────────────────────────────────────────────

/**
 * Test deposit → withdraw flow for a single token
 */
async function testTokenFlow(
  name: string,
  tokenAddr: string,
  poolAddr: string,
  denomination: bigint,
  decimals: number,
  provider: JsonRpcProvider,
  wallet: Wallet,
  mimcSponge: any
): Promise<boolean> {
  console.log(`\n=== Testing ${name} ===`);
  
  try {
    const tokenContract = new Contract(tokenAddr, ERC20_ABI, wallet);
    const poolContract = new Contract(poolAddr, POOL_ABI, wallet);
    
    // ── DEPOSIT PHASE ──────────────────────────────────────────────
    console.log('📥 Starting deposit phase...');
    
    // 1. Generate random nullifier and secret (31 bytes each)
    const nullifier = crypto.randomBytes(31);
    const secret = crypto.randomBytes(31);
    
    // 2. Build MiMC commitment
    const commitment = mimcSponge.F.toObject(
      mimcSponge.multiHash([BigInt('0x' + nullifier.toString('hex')), BigInt('0x' + secret.toString('hex'))], 0n, 1)
    );
    const commitmentHex = '0x' + BigInt(commitment).toString(16).padStart(64, '0');
    
    console.log(`   Commitment: ${commitmentHex}`);
    
    // 3. Check initial balances
    const initialDeployerBalance = await tokenContract.balanceOf(wallet.address);
    const initialTreasuryBalance = await tokenContract.balanceOf(TREASURY_ADDRESS);
    
    console.log(`   Initial deployer balance: ${initialDeployerBalance} (${Number(initialDeployerBalance) / (10 ** decimals)} ${name})`);
    
    // 4. Mint tokens if needed (ensure we have enough)
    const requiredAmount = denomination * 2n; // Extra buffer
    if (initialDeployerBalance < requiredAmount) {
      console.log(`   Minting ${requiredAmount} tokens...`);
      const mintTx = await tokenContract.mint(wallet.address, requiredAmount);
      await mintTx.wait();
    }
    
    // 5. Approve token for pool
    console.log(`   Approving ${denomination} tokens for pool...`);
    const approveTx = await tokenContract.approve(poolAddr, denomination);
    await approveTx.wait();
    
    // 6. Deposit
    console.log(`   Depositing ${Number(denomination) / (10 ** decimals)} ${name}...`);
    const depositTx = await poolContract.deposit(commitmentHex);
    const depositReceipt = await depositTx.wait();
    
    // 7. Extract leafIndex from Deposit event
    const depositEvent = depositReceipt.logs.find((log: any) => {
      try {
        const parsed = poolContract.interface.parseLog(log);
        return parsed?.name === 'Deposit';
      } catch {
        return false;
      }
    });
    
    if (!depositEvent) {
      throw new Error('Deposit event not found');
    }
    
    const parsedEvent = poolContract.interface.parseLog(depositEvent);
    const leafIndex = Number(parsedEvent.args.leafIndex);
    
    console.log(`   ✅ Deposit successful! LeafIndex: ${leafIndex}`);
    
    // Store deposit data
    const depositData: DepositData = {
      nullifier,
      secret,
      commitment,
      leafIndex,
      pool: poolAddr,
      token: tokenAddr,
      denomination,
    };
    
    // ── WITHDRAW PHASE ─────────────────────────────────────────────
    console.log('📤 Starting withdraw phase...');
    
    // 1. Build Merkle tree from all deposits
    console.log('   Building Merkle tree...');
    const tree = await buildMerkleTree(poolAddr, provider, mimcSponge);
    
    // 2. Extract Merkle path
    const { pathElements, pathIndices } = extractPath(leafIndex, tree.layers, tree.zeros);
    
    // 3. Compute nullifierHash
    const nullifierHash = mimcSponge.F.toObject(
      mimcSponge.multiHash([BigInt('0x' + nullifier.toString('hex'))], 0n, 1)
    );
    
    // 4. Generate random recipient
    const recipient = generateRandomRecipient();
    console.log(`   Recipient: ${recipient}`);
    
    // 5. Build circuit inputs
    const circuitInputs = {
      nullifier: BigInt('0x' + nullifier.toString('hex')).toString(),
      secret: BigInt('0x' + secret.toString('hex')).toString(),
      pathElements: pathElements.map(e => e.toString()),
      pathIndices: pathIndices,
      root: tree.root.toString(),
      nullifierHash: nullifierHash.toString(),
      recipient: BigInt(recipient).toString(),
      relayer: '0',
      fee: '0',
      refund: '0'
    };
    
    // 6. Generate ZK proof
    console.log('   Generating ZK proof...');
    const wasmPath = path.join(__dirname, '..', 'apps', 'pay', 'public', 'circuits', 'withdraw.wasm');
    const zkeyPath = path.join(__dirname, '..', 'apps', 'pay', 'public', 'circuits', 'withdraw_final.zkey');
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      wasmPath,
      zkeyPath
    );
    
    // 7. Encode proof for Solidity
    const proofElements = [
      proof.pi_a[0], proof.pi_a[1],
      proof.pi_b[0][1], proof.pi_b[0][0],
      proof.pi_b[1][1], proof.pi_b[1][0],
      proof.pi_c[0], proof.pi_c[1],
    ];
    const proofHex = '0x' + proofElements.map((v: string) => {
      return BigInt(v).toString(16).padStart(64, '0');
    }).join('');
    
    // 8. Call withdraw directly on-chain
    console.log('   Submitting withdrawal...');
    const withdrawTx = await poolContract.withdraw(
      proofHex,
      '0x' + BigInt(publicSignals[0]).toString(16).padStart(64, '0'), // root
      '0x' + BigInt(publicSignals[1]).toString(16).padStart(64, '0'), // nullifierHash
      recipient, // recipient
      '0x0000000000000000000000000000000000000000', // relayer
      0, // fee
      0  // refund
    );
    await withdrawTx.wait();
    
    console.log(`   ✅ Withdrawal successful! TxHash: ${withdrawTx.hash}`);
    
    // ── VERIFICATION PHASE ─────────────────────────────────────────
    console.log('🔍 Verifying results...');
    
    // 1. Check recipient received correct amount (denomination - 1% fee)
    const protocolFee = (denomination * BigInt(PROTOCOL_FEE_BPS)) / 10000n;
    const expectedRecipientAmount = denomination - protocolFee;
    
    const recipientBalance = await tokenContract.balanceOf(recipient);
    if (recipientBalance !== expectedRecipientAmount) {
      throw new Error(`Recipient balance mismatch. Expected: ${expectedRecipientAmount}, Got: ${recipientBalance}`);
    }
    console.log(`   ✅ Recipient received ${Number(recipientBalance) / (10 ** decimals)} ${name} (correct)`);
    
    // 2. Check treasury received protocol fee
    const finalTreasuryBalance = await tokenContract.balanceOf(TREASURY_ADDRESS);
    const treasuryIncrease = finalTreasuryBalance - initialTreasuryBalance;
    if (treasuryIncrease !== protocolFee) {
      throw new Error(`Treasury fee mismatch. Expected: ${protocolFee}, Got: ${treasuryIncrease}`);
    }
    console.log(`   ✅ Treasury received ${Number(protocolFee) / (10 ** decimals)} ${name} fee (correct)`);
    
    // 3. Check nullifier is spent
    const isSpent = await poolContract.isSpent('0x' + BigInt(nullifierHash).toString(16).padStart(64, '0'));
    if (!isSpent) {
      throw new Error('Nullifier should be marked as spent');
    }
    console.log(`   ✅ Nullifier marked as spent (correct)`);
    
    // 4. Try to withdraw again (should fail)
    try {
      await poolContract.withdraw(
        proofHex,
        '0x' + BigInt(publicSignals[0]).toString(16).padStart(64, '0'),
        '0x' + BigInt(publicSignals[1]).toString(16).padStart(64, '0'),
        recipient,
        '0x0000000000000000000000000000000000000000',
        0,
        0
      );
      throw new Error('Double withdrawal should have failed');
    } catch (error: any) {
      if (error.message.includes('Double withdrawal')) {
        throw error;
      }
      console.log(`   ✅ Double withdrawal correctly rejected`);
    }
    
    console.log(`✅ ${name} test PASSED`);
    return true;
    
  } catch (error: any) {
    console.error(`❌ ${name} test FAILED:`, error.message);
    return false;
  }
}

// ── Main Function ──────────────────────────────────────────────────────────

async function main() {
  console.log('=== ZKIRA Pay E2E Test (Arbitrum Sepolia) ===');
  console.log(`RPC: ${RPC_URL}`);
  console.log(`Deployer: ${DEPLOYER_ADDRESS}`);
  console.log(`Treasury: ${TREASURY_ADDRESS}`);
  
  // Initialize provider and wallet
  const provider = new JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);
  
  // Verify connection
  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer ETH balance: ${balance} wei`);
  
  if (balance === 0n) {
    throw new Error('Deployer has no ETH for gas fees');
  }
  
  // Initialize MiMC
  console.log('Initializing MiMC...');
  const mimcSponge = await buildMimcSponge();
  
  // Run tests for all tokens
  const results: boolean[] = [];
  
  for (const token of TEST_TOKENS) {
    const success = await testTokenFlow(
      token.name,
      token.tokenAddress,
      token.poolAddress,
      token.denomination,
      token.decimals,
      provider,
      wallet,
      mimcSponge
    );
    results.push(success);
  }
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  const passedCount = results.filter(r => r).length;
  const totalCount = results.length;
  
  TEST_TOKENS.forEach((token, i) => {
    const status = results[i] ? '✅ PASS' : '❌ FAIL';
    console.log(`${token.name}: ${status}`);
  });
  
  console.log(`\nTotal: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 ALL TESTS PASSED!');
  } else {
    console.log('💥 SOME TESTS FAILED!');
    process.exit(1);
  }
}

// ── Entry Point ────────────────────────────────────────────────────────────

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});