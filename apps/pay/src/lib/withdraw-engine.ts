/**
 * Withdraw Engine — batch ZK proof generation + relayer submission.
 *
 * Extracts the core withdrawal logic from WithdrawWizard into a reusable utility
 * so it can be used by ClaimWithCode (auto-withdraw on claim) and
 * RequestPaymentWizard (auto-withdraw on invoice collection).
 *
 * Groups notes by pool address so the Merkle tree is built only once per pool.
 */

import type { DepositNoteRecord } from '@/types/payment';
import type { Chain } from '@/config/pool-registry';
import { getChainConfig, findPool } from '@/config/pool-registry';
import { getWhitelabelConfig } from '@/config/whitelabel';

const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL ?? '';
const TREE_DEPTH = 20;
// Pre-computed zeros from the on-chain MerkleTreeWithHistory contract.
// ZERO_VALUE = keccak256("tornado") % FIELD_SIZE, then each level is MiMC(prev, prev).
// These MUST match the contract exactly or ZK proofs will fail.
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

// ── Public types ──────────────────────────────────────────────

export type WithdrawStage = 'tree' | 'proof' | 'submit';

export interface BatchWithdrawProgress {
  /** 0-based index of the note currently being processed. */
  noteIndex: number;
  /** Total notes in the batch. */
  totalNotes: number;
  /** Current processing stage for the active note. */
  stage: WithdrawStage;
  /** Human-readable status message. */
  message: string;
}

export interface WithdrawResult {
  /** Index in the original notes array. */
  noteIndex: number;
  /** On-chain transaction hash from the relayer. */
  txHash: string;
}

// ── Internal helpers ──────────────────────────────────────────

interface SparseMerkleTreeData {
  root: bigint;
  /** Sparse node storage. Key: `${level}:${index}`, Value: node hash. */
  nodes: Map<string, bigint>;
  /** Number of deposits in the tree. */
  depositCount: number;
}

/**
 * Build a sparse MiMC Merkle tree from on-chain deposit events.
 *
 * Instead of materializing all 2^20 (~1M) leaf nodes and computing ~1M MiMC
 * hashes (which crashes the browser), this mirrors the on-chain _insert() logic:
 *   - Track filledSubtrees[] as each deposit is inserted
 *   - Store only the nodes along insertion paths (sparse)
 *   - Use pre-computed zeros for empty subtrees
 *
 * Complexity: O(deposits × depth) instead of O(2^depth).
 * For 4 deposits at depth 20: 80 hashes vs 1,048,576 hashes.
 */
async function buildSparseMerkleTree(
  poolAddress: string,
  chain: Chain,
  mimcSponge: any,
): Promise<SparseMerkleTreeData> {
  const { JsonRpcProvider, Contract } = await import('ethers');
  const rpcUrl = getChainConfig(chain).rpcUrl;
  const provider = new JsonRpcProvider(rpcUrl);

  const poolAbi = [
    'event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp)',
  ];
  const poolContract = new Contract(poolAddress, poolAbi, provider);
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

  // Sparse node storage: key = `${level}:${index}`
  const nodes = new Map<string, bigint>();

  // Insert each deposit leaf
  for (const dep of deposits) {
    nodes.set(`0:${dep.leafIndex}`, dep.commitment);
  }

  // Replay the contract's _insert() logic to compute filledSubtrees
  // and all nodes along each insertion path.
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

      // Store sibling for path extraction
      if (currentIndex % 2 === 0) {
        nodes.set(`${level}:${currentIndex + 1}`, right);
      } else {
        nodes.set(`${level}:${currentIndex - 1}`, left);
      }

      // Hash and move up
      const parentIndex = Math.floor(currentIndex / 2);
      currentLevelHash = mimcSponge.F.toObject(
        mimcSponge.multiHash([left, right], 0n, 1),
      );
      nodes.set(`${level + 1}:${parentIndex}`, currentLevelHash);
      currentIndex = parentIndex;
    }

    currentRoot = currentLevelHash;
  }

  return { root: currentRoot, nodes, depositCount: deposits.length };
}

/**
 * Extract Merkle path for a given leaf index from the sparse tree.
 */
function extractSparsePath(
  leafIndex: number,
  nodes: Map<string, bigint>,
): { pathElements: bigint[]; pathIndices: number[] } {
  const pathElements: bigint[] = [];
  const pathIndices: number[] = [];
  let idx = leafIndex;

  for (let level = 0; level < TREE_DEPTH; level++) {
    const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
    const sibling = nodes.get(`${level}:${siblingIdx}`) ?? CONTRACT_ZEROS[level];
    pathElements.push(sibling);
    pathIndices.push(idx % 2);
    idx = Math.floor(idx / 2);
  }

  return { pathElements, pathIndices };
}

// ── Main API ──────────────────────────────────────────────────

/**
 * Execute batch withdrawal of multiple deposit notes to a single recipient.
 *
 * Groups notes by pool address so the Merkle tree is built only once per pool.
 * ZK proofs are generated in the browser via snarkjs, then submitted to the
 * relayer which broadcasts the on-chain withdrawal transaction.
 *
 * @throws on any failure — caller should catch and display error
 */
export async function executeBatchWithdrawal(
  notes: DepositNoteRecord[],
  recipientAddress: string,
  onProgress: (progress: BatchWithdrawProgress) => void,
): Promise<WithdrawResult[]> {
  if (notes.length === 0) throw new Error('No notes to withdraw');
  if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
    throw new Error('Invalid recipient address');
  }

  const results: WithdrawResult[] = [];

  // ── 1. Import heavy dependencies once ──────────────────────
  const { buildMimcSponge } = await import('circomlibjs');
  const mimcSponge = await buildMimcSponge();
  const snarkjs = await import('snarkjs');

  // ── MiMC sanity check ─────────────────────────────────────
  // Verify that browser circomlibjs MiMC matches the contract's zeros.
  // CONTRACT_ZEROS[1] = MiMC(CONTRACT_ZEROS[0], CONTRACT_ZEROS[0]).
  const sanityHash = mimcSponge.F.toObject(
    mimcSponge.multiHash([CONTRACT_ZEROS[0], CONTRACT_ZEROS[0]], 0n, 1),
  );
  if (sanityHash !== CONTRACT_ZEROS[1]) {
    console.error('[withdraw-engine] MiMC SANITY CHECK FAILED!');
    console.error('  Expected:', CONTRACT_ZEROS[1].toString(16));
    console.error('  Got:     ', sanityHash.toString(16));
    throw new Error(
      'MiMC hash mismatch: browser circomlibjs produces different results than the on-chain contract. Cannot generate valid proofs.',
    );
  }
  console.log('[withdraw-engine] MiMC sanity check passed');

  // ── 2. Validate & recover pool addresses ───────────────────
  //    Bundles created by older code may be missing the pool field.
  //    Recover from chain + token + denomination via the registry.
  const resolvedNotes = notes.map((note) => {
    if (note.pool) return note;
    if (note.chain && note.token && note.denomination) {
      const pool = findPool(note.chain, note.token, note.denomination);
      if (pool) return { ...note, pool: pool.address };
    }
    throw new Error(
      `Note is missing pool address and cannot be recovered (chain=${note.chain}, token=${note.token}, denomination=${note.denomination})`,
    );
  });

  // ── 3. Group notes by pool address ─────────────────────────
  const poolGroups = new Map<
    string,
    { notes: Array<DepositNoteRecord & { _batchIndex: number }> }
  >();

  resolvedNotes.forEach((note, i) => {
    const key = note.pool.toLowerCase();
    if (!poolGroups.has(key)) poolGroups.set(key, { notes: [] });
    poolGroups.get(key)!.notes.push({ ...note, _batchIndex: i });
  });

  // ── 4. Process each pool group ─────────────────────────────
  let processed = 0;
  const whitelabelConfig = getWhitelabelConfig();

  for (const [poolAddr, group] of poolGroups) {
    const chain = group.notes[0].chain;

    // Build Merkle tree once for this pool
    onProgress({
      noteIndex: processed,
      totalNotes: notes.length,
      stage: 'tree',
      message: `Building Merkle tree for pool ${poolAddr.slice(0, 8)}...`,
    });

    const tree = await buildSparseMerkleTree(poolAddr, chain, mimcSponge);

    // ── Verify root on-chain before generating proof ──────
    const { JsonRpcProvider: RpcProvider, Contract: RpcContract } = await import('ethers');
    const verifyProvider = new RpcProvider(CHAIN_CONFIGS[chain].rpcUrl);
    const verifyPoolContract = new RpcContract(poolAddr, [
      'function isKnownRoot(bytes32 _root) external view returns (bool)',
      'function getLastRoot() external view returns (bytes32)',
    ], verifyProvider);
    const computedRootHex = '0x' + BigInt(tree.root).toString(16).padStart(64, '0');
    const isKnown = await verifyPoolContract.isKnownRoot(computedRootHex);
    const onChainRoot = await verifyPoolContract.getLastRoot();
    console.log('[withdraw-engine] Computed root:', computedRootHex);
    console.log('[withdraw-engine] On-chain root:', onChainRoot);
    console.log('[withdraw-engine] isKnownRoot:', isKnown);
    if (!isKnown) {
      throw new Error(
        `Computed Merkle root is not known on-chain. Computed: ${computedRootHex}, On-chain: ${onChainRoot}. Tree has ${tree.depositCount} deposits.`,
      );
    }

    // Process each note in this pool
    for (const note of group.notes) {
      // ── Generate ZK proof ──────────────────────────────────
      onProgress({
        noteIndex: processed,
        totalNotes: notes.length,
        stage: 'proof',
        message: `Generating zero-knowledge proof (${processed + 1}/${notes.length})...`,
      });

      const { pathElements, pathIndices } = extractSparsePath(
        note.leafIndex,
        tree.nodes,
      );

      const nullifier = BigInt(note.nullifier);
      const secret = BigInt(note.secret);

      // Verify commitment matches nullifier+secret
      const recomputedCommitment = mimcSponge.F.toObject(
        mimcSponge.multiHash([nullifier, secret], 0n, 1),
      );
      const storedCommitment = note.commitment ? BigInt(note.commitment) : undefined;
      console.log('[withdraw-engine] Note leafIndex:', note.leafIndex);
      console.log('[withdraw-engine] Recomputed commitment:', '0x' + BigInt(recomputedCommitment).toString(16).padStart(64, '0'));
      if (storedCommitment !== undefined && storedCommitment !== recomputedCommitment) {
        console.error('[withdraw-engine] COMMITMENT MISMATCH!');
        console.error('  Stored:     ', '0x' + storedCommitment.toString(16).padStart(64, '0'));
        console.error('  Recomputed: ', '0x' + BigInt(recomputedCommitment).toString(16).padStart(64, '0'));
      }

      const nullifierHash = mimcSponge.F.toObject(
        mimcSponge.multiHash([nullifier], 0n, 1),
      );

      const circuitInputs = {
        // Private
        nullifier: nullifier.toString(),
        secret: secret.toString(),
        pathElements: pathElements.map((e) => e.toString()),
        pathIndices,
        // Public
        root: tree.root.toString(),
        nullifierHash: nullifierHash.toString(),
        recipient: BigInt(recipientAddress).toString(),
        relayer: '0',
        fee: '0',
        refund: '0',
      };

      console.log('[withdraw-engine] Circuit inputs:', {
        nullifier: circuitInputs.nullifier.substring(0, 20) + '...',
        secret: circuitInputs.secret.substring(0, 20) + '...',
        root: circuitInputs.root.substring(0, 20) + '...',
        pathIndices: circuitInputs.pathIndices.slice(0, 5),
        pathElements0: circuitInputs.pathElements[0]?.substring(0, 20) + '...',
      });

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInputs,
        '/circuits/withdraw.wasm',
        '/circuits/withdraw_final.zkey',
      );

      // ── Local proof verification (safety check) ────────────
      const vkey = await fetch('/circuits/verification_key.json').then((r) => r.json());
      const proofValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
      if (!proofValid) {
        throw new Error('ZK proof failed local verification — aborting to avoid wasting gas');
      }
      console.log('[withdraw-engine] Proof verified locally ✅');

      // ── Submit to relayer ──────────────────────────────────
      onProgress({
        noteIndex: processed,
        totalNotes: notes.length,
        stage: 'submit',
        message: `Submitting withdrawal ${processed + 1}/${notes.length} to relayer...`,
      });

      // Encode proof as ABI-packed hex bytes for the relayer/contract
      // Format: abi.encodePacked(a[0], a[1], b[0][0], b[0][1], b[1][0], b[1][1], c[0], c[1])
      const proofElements = [
        proof.pi_a[0], proof.pi_a[1],
        proof.pi_b[0][1], proof.pi_b[0][0],
        proof.pi_b[1][1], proof.pi_b[1][0],
        proof.pi_c[0], proof.pi_c[1],
      ];
      const proofHex = '0x' + proofElements.map((v: string) => {
        return BigInt(v).toString(16).padStart(64, '0');
      }).join('');

      const response = await fetch(`${RELAYER_URL}/session/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolAddress: note.pool,
          proof: proofHex,
          root: publicSignals[0],
          nullifierHash: publicSignals[1],
          recipient: recipientAddress,
          relayer: '0x0000000000000000000000000000000000000000',
          fee: '0',
          refund: '0',
          ...(whitelabelConfig.partnerId && { partnerId: whitelabelConfig.partnerId }),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Withdrawal ${processed + 1}/${notes.length} failed: ${errorBody}`,
        );
      }

      const result = await response.json();
      const txHash = result.txHash ?? result.txId ?? result.transactionHash ?? '';

      results.push({ noteIndex: note._batchIndex, txHash });
      processed++;
    }
  }

  return results;
}
