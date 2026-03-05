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
    tokenAddress: '0x24469622D98ca04AE03fe628Bb0051B76816F897',
    poolAddress: '0x8E2De22e4cD6be8EbFf95205d40A343A2a852E45',
    denomination: 1000000n, // 1 USDC (6 decimals)
    decimals: 6,
  },
  {
    name: 'tUSDT',
    tokenAddress: '0xa268D3C2D60Db78F6834C92A3c7443EEd0827F48',
    poolAddress: '0x451E8fF57fB7e5bCF3c830EEA7EA6a792332f03d',
    denomination: 1000000n, // 1 USDT (6 decimals)
    decimals: 6,
  },
  {
    name: 'tDAI',
    tokenAddress: '0xBECcf08803742f4205a0b49bb749F08f6b406574',
    poolAddress: '0xcA23279D6027DFd4eC686C7C6Ce87D0dB507B588',
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
  'function getLastRoot() external view returns (bytes32)',
  'function isKnownRoot(bytes32 _root) external view returns (bool)',
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

// Pre-computed zeros from the contract (MerkleTreeWithHistory.zeros(i))
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
];

/**
 * Build sparse MiMC Merkle tree mirroring the on-chain _insert() logic.
 * Uses CONTRACT_ZEROS (pre-computed zeros matching the contract) for empty siblings.
 */
async function buildMerkleTree(
  poolAddress: string,
  provider: JsonRpcProvider,
  mimcSponge: any
): Promise<{ root: bigint; pathElements: Map<string, bigint>; deposits: Array<{ commitment: bigint; leafIndex: number }> }> {
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

  // Sparse tree: only store nodes that differ from zeros
  // Key format: `${level}:${index}`
  const nodes = new Map<string, bigint>();

  // Insert each deposit leaf
  for (const dep of deposits) {
    nodes.set(`0:${dep.leafIndex}`, dep.commitment);
  }

  // Compute only the nodes on paths from leaves to root
  // Mirroring the contract's _insert logic: process each insertion in order
  // The contract's filledSubtrees tracks the last non-zero subtree at each level
  const filledSubtrees: bigint[] = new Array(TREE_DEPTH).fill(0n);
  for (let i = 0; i < TREE_DEPTH; i++) {
    filledSubtrees[i] = CONTRACT_ZEROS[i];
  }

  let currentRoot = 0n;

  for (const dep of deposits) {
    let currentIndex = dep.leafIndex;
    let currentLevelHash = dep.commitment;

    for (let i = 0; i < TREE_DEPTH; i++) {
      let left: bigint;
      let right: bigint;

      if (currentIndex % 2 === 0) {
        left = currentLevelHash;
        right = CONTRACT_ZEROS[i];
        filledSubtrees[i] = currentLevelHash;
      } else {
        left = filledSubtrees[i];
        right = currentLevelHash;
      }

      // Store siblings for path extraction
      const parentIndex = Math.floor(currentIndex / 2);
      if (currentIndex % 2 === 0) {
        nodes.set(`${i}:${currentIndex + 1}`, right);
      } else {
        nodes.set(`${i}:${currentIndex - 1}`, left);
      }

      // Hash left and right to get parent
      currentLevelHash = mimcSponge.F.toObject(
        mimcSponge.multiHash([left, right], 0n, 1)
      );
      nodes.set(`${i + 1}:${parentIndex}`, currentLevelHash);
      currentIndex = parentIndex;
    }

    currentRoot = currentLevelHash;
  }

  return { root: currentRoot, pathElements: nodes, deposits };
}

/**
 * Extract Merkle path for a given leaf index from sparse tree
 */
function extractPath(
  leafIndex: number,
  pathElements: Map<string, bigint>
): { pathElements: bigint[]; pathIndices: number[] } {
  const elements: bigint[] = [];
  const indices: number[] = [];
  let idx = leafIndex;

  for (let level = 0; level < TREE_DEPTH; level++) {
    const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
    const sibling = pathElements.get(`${level}:${siblingIdx}`) ?? CONTRACT_ZEROS[level];
    elements.push(sibling);
    indices.push(idx % 2);
    idx = Math.floor(idx / 2);
  }

  return { pathElements: elements, pathIndices: indices };
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
    
    // DEBUG: Compare computed root with on-chain root
    const onChainRoot = await poolContract.getLastRoot();
    const computedRootHex = '0x' + BigInt(tree.root).toString(16).padStart(64, '0');
    console.log(`   On-chain root:  ${onChainRoot}`);
    console.log(`   Computed root:  ${computedRootHex}`);
    console.log(`   Roots match:    ${onChainRoot.toLowerCase() === computedRootHex.toLowerCase()}`);
    const isKnown = await poolContract.isKnownRoot(computedRootHex);
    console.log(`   isKnownRoot:    ${isKnown}`);
    console.log(`   Deposits found: ${tree.deposits.length}`);
    
    // 2. Extract Merkle path
    const { pathElements, pathIndices } = extractPath(leafIndex, tree.pathElements);
    
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
    
    // DEBUG: Verify proof locally first
    const vkeyPath = path.join(__dirname, '..', 'apps', 'pay', 'public', 'circuits', 'verification_key.json');
    const vkey = JSON.parse(require('fs').readFileSync(vkeyPath, 'utf8'));
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    console.log(`   Local proof verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`   Public signals: ${JSON.stringify(publicSignals)}`);
    if (!isValid) {
      throw new Error('ZK proof failed local verification');
    }
    
    // 7. Encode proof for Solidity (abi.encode(uint256[8]))
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
    // Note: deployer IS the treasury, so net change = -denomination + protocolFee
    // Instead, check the pool's balance decreased by denomination (tokens were transferred out)
    const finalTreasuryBalance = await tokenContract.balanceOf(TREASURY_ADDRESS);
    if (TREASURY_ADDRESS.toLowerCase() === wallet.address.toLowerCase()) {
      // Deployer = treasury: net = initial - denomination + protocolFee
      const expectedTreasuryBalance = initialTreasuryBalance - denomination + protocolFee;
      if (finalTreasuryBalance !== expectedTreasuryBalance) {
        throw new Error(`Treasury balance mismatch. Expected: ${expectedTreasuryBalance}, Got: ${finalTreasuryBalance}`);
      }
      console.log(`   ✅ Treasury (deployer) balance correct: net -${Number(denomination - protocolFee) / (10 ** decimals)} ${name} (deposit - fee received)`);
    } else {
      const treasuryIncrease = finalTreasuryBalance - initialTreasuryBalance;
      if (treasuryIncrease !== protocolFee) {
        throw new Error(`Treasury fee mismatch. Expected: ${protocolFee}, Got: ${treasuryIncrease}`);
      }
      console.log(`   ✅ Treasury received ${Number(protocolFee) / (10 ** decimals)} ${name} fee (correct)`);
    }
    
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