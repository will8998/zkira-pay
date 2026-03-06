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
import { CHAIN_CONFIGS, findPool } from '@/config/pool-registry';
import { getWhitelabelConfig } from '@/config/whitelabel';

const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL ?? '';
const TREE_DEPTH = 20;
const ZERO_VALUE = 0n;

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
  /** Pre-computed zeros for each level. */
  zeros: bigint[];
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
  zeros: bigint[],
): Promise<SparseMerkleTreeData> {
  const { JsonRpcProvider, Contract } = await import('ethers');
  const rpcUrl = CHAIN_CONFIGS[chain].rpcUrl;
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
    filledSubtrees[i] = zeros[i];
  }

  let currentRoot = zeros[TREE_DEPTH];

  for (const dep of deposits) {
    let currentIndex = dep.leafIndex;
    let currentLevelHash = dep.commitment;

    for (let level = 0; level < TREE_DEPTH; level++) {
      let left: bigint;
      let right: bigint;

      if (currentIndex % 2 === 0) {
        left = currentLevelHash;
        right = zeros[level];
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

  return { root: currentRoot, nodes, zeros, depositCount: deposits.length };
}

/**
 * Extract Merkle path for a given leaf index from the sparse tree.
 */
function extractSparsePath(
  leafIndex: number,
  nodes: Map<string, bigint>,
  zeros: bigint[],
): { pathElements: bigint[]; pathIndices: number[] } {
  const pathElements: bigint[] = [];
  const pathIndices: number[] = [];
  let idx = leafIndex;

  for (let level = 0; level < TREE_DEPTH; level++) {
    const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
    const sibling = nodes.get(`${level}:${siblingIdx}`) ?? zeros[level];
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

  // Pre-compute zero hashes for the tree
  const zeros: bigint[] = [ZERO_VALUE];
  for (let i = 1; i <= TREE_DEPTH; i++) {
    zeros[i] = mimcSponge.F.toObject(
      mimcSponge.multiHash([zeros[i - 1], zeros[i - 1]], 0n, 1),
    );
  }

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

    const tree = await buildSparseMerkleTree(poolAddr, chain, mimcSponge, zeros);

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
        tree.zeros,
      );

      const nullifier = BigInt(note.nullifier);
      const secret = BigInt(note.secret);

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

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInputs,
        '/circuits/withdraw.wasm',
        '/circuits/withdraw_final.zkey',
      );

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
