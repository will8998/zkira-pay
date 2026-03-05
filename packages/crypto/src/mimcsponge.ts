import { buildMimcSponge } from 'circomlibjs';

export interface MerkleProof {
  pathElements: bigint[];
  pathIndices: number[];
}

/**
 * MiMCSponge Merkle Tree implementation compatible with:
 *   - On-chain: MerkleTreeWithHistory.sol (hashLeftRight uses MiMCSponge)
 *   - Circuit: merkle-tree.circom (MiMCSponge(2, 220, 1) with k=0)
 *
 * Uses circomlibjs buildMimcSponge for MiMC hashing to ensure
 * exact compatibility with the Tornado Cash-style contracts.
 *
 * The zero values match MerkleTreeWithHistory.sol's zeros() function,
 * which are precomputed from the MiMCSponge hash chain starting from
 * keccak256("tornado") % FIELD_SIZE.
 */
export class MiMCSpongeTree {
  private mimcSponge: any;
  private levels: number;
  private zeroValues: bigint[];
  private leaves: Map<number, bigint>;
  private nextLeafIndex: number;
  private filledSubtrees: bigint[];
  private roots: bigint[];
  private currentRootIndex: number;
  private ROOT_HISTORY_SIZE = 30;

  constructor(levels: number = 20) {
    this.levels = levels;
    this.zeroValues = [];
    this.leaves = new Map();
    this.nextLeafIndex = 0;
    this.filledSubtrees = [];
    this.roots = new Array(this.ROOT_HISTORY_SIZE).fill(0n);
    this.currentRootIndex = 0;
  }

  /**
   * Initialize the MiMCSponge hasher and compute zero hashes.
   * Must be called before using the tree.
   */
  async init(): Promise<void> {
    this.mimcSponge = await buildMimcSponge();

    // Compute zero values matching MerkleTreeWithHistory.sol
    // ZERO_VALUE = keccak256("tornado") % FIELD_SIZE
    // = 21663839004416932945382355908790599225266501822907911457504978515578255421292
    const ZERO_VALUE = 21663839004416932945382355908790599225266501822907911457504978515578255421292n;
    this.zeroValues = [ZERO_VALUE];

    for (let i = 1; i <= this.levels; i++) {
      this.zeroValues[i] = this._hash(this.zeroValues[i - 1], this.zeroValues[i - 1]);
    }

    // Initialize filled subtrees with zero values
    this.filledSubtrees = [];
    for (let i = 0; i < this.levels; i++) {
      this.filledSubtrees[i] = this.zeroValues[i];
    }

    // Set initial root
    this.roots[0] = this.zeroValues[this.levels];
  }

  /**
   * Hash two values using MiMCSponge (matching on-chain hashLeftRight).
   * MiMCSponge with key=0, same as the Solidity contract.
   */
  private _hash(left: bigint, right: bigint): bigint {
    const F = this.mimcSponge.F;
    const result = this.mimcSponge.multiHash([left, right], 0, 1);
    return F.toObject(result);
  }

  /**
   * Compute commitment = MiMCSponge(nullifier, secret) with key=0.
   * Matches the circuit: MiMCSponge(2, 220, 1) with k=0.
   */
  computeCommitment(nullifier: bigint, secret: bigint): bigint {
    return this._hash(nullifier, secret);
  }

  /**
   * Compute nullifierHash = MiMCSponge(nullifier) with key=0.
   * This is a single-input hash, matching: MiMCSponge(1, 220, 1) with k=0.
   */
  computeNullifierHash(nullifier: bigint): bigint {
    const F = this.mimcSponge.F;
    const result = this.mimcSponge.multiHash([nullifier], 0, 1);
    return F.toObject(result);
  }

  /**
   * Insert a commitment into the tree and return the leaf index.
   * Mirrors the on-chain _insert() function exactly.
   */
  insert(commitment: bigint): number {
    if (!this.mimcSponge) {
      throw new Error('Tree not initialized. Call init() first.');
    }

    const leafIndex = this.nextLeafIndex;
    let currentIndex = leafIndex;
    let currentLevelHash = commitment;

    for (let i = 0; i < this.levels; i++) {
      let left: bigint;
      let right: bigint;

      if (currentIndex % 2 === 0) {
        left = currentLevelHash;
        right = this.zeroValues[i];
        this.filledSubtrees[i] = currentLevelHash;
      } else {
        left = this.filledSubtrees[i];
        right = currentLevelHash;
      }

      currentLevelHash = this._hash(left, right);
      currentIndex = Math.floor(currentIndex / 2);
    }

    const newRootIndex = (this.currentRootIndex + 1) % this.ROOT_HISTORY_SIZE;
    this.currentRootIndex = newRootIndex;
    this.roots[newRootIndex] = currentLevelHash;

    this.leaves.set(leafIndex, commitment);
    this.nextLeafIndex++;

    return leafIndex;
  }

  /**
   * Get the current Merkle root.
   */
  getRoot(): bigint {
    if (!this.mimcSponge) {
      throw new Error('Tree not initialized. Call init() first.');
    }
    return this.roots[this.currentRootIndex];
  }

  /**
   * Check if a root exists in the root history.
   * Matches on-chain isKnownRoot().
   */
  isKnownRoot(root: bigint): boolean {
    if (root === 0n) return false;
    let i = this.currentRootIndex;
    do {
      if (root === this.roots[i]) return true;
      if (i === 0) i = this.ROOT_HISTORY_SIZE;
      i--;
    } while (i !== this.currentRootIndex);
    return false;
  }

  /**
   * Generate a Merkle proof for a leaf at the given index.
   */
  getProof(leafIndex: number): MerkleProof {
    if (!this.mimcSponge) {
      throw new Error('Tree not initialized. Call init() first.');
    }

    if (leafIndex >= this.nextLeafIndex) {
      throw new Error(`Leaf index ${leafIndex} not yet inserted`);
    }

    const pathElements: bigint[] = [];
    const pathIndices: number[] = [];

    // Rebuild the tree to get sibling values
    // This is less efficient but ensures correctness
    const tree: Map<string, bigint> = new Map();

    // Set all leaves
    for (const [index, value] of this.leaves) {
      tree.set(`0-${index}`, value);
    }

    // Build each level
    for (let level = 0; level < this.levels; level++) {
      const nodesAtLevel = Math.pow(2, this.levels - level);

      for (let i = 0; i < nodesAtLevel; i += 2) {
        const left = tree.get(`${level}-${i}`) ?? this.zeroValues[level];
        const right = tree.get(`${level}-${i + 1}`) ?? this.zeroValues[level];
        const parent = this._hash(left, right);
        tree.set(`${level + 1}-${Math.floor(i / 2)}`, parent);
      }
    }

    // Generate proof path
    let currentIndex = leafIndex;

    for (let level = 0; level < this.levels; level++) {
      const isLeft = currentIndex % 2 === 0;
      const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
      const sibling = tree.get(`${level}-${siblingIndex}`) ?? this.zeroValues[level];

      pathElements.push(sibling);
      pathIndices.push(isLeft ? 0 : 1);

      currentIndex = Math.floor(currentIndex / 2);
    }

    return { pathElements, pathIndices };
  }

  /**
   * Convert a bigint to 32-byte array (big-endian, matching BN254 field).
   */
  toBytes(value: bigint): Uint8Array {
    const bytes = new Uint8Array(32);
    let val = value;
    for (let i = 31; i >= 0; i--) {
      bytes[i] = Number(val & 0xFFn);
      val = val >> 8n;
    }
    return bytes;
  }

  /**
   * Get the number of leaves inserted.
   */
  getLeafCount(): number {
    return this.nextLeafIndex;
  }

  /**
   * Get the tree depth.
   */
  getDepth(): number {
    return this.levels;
  }

  /**
   * Get a leaf value by index.
   */
  getLeaf(index: number): bigint | undefined {
    return this.leaves.get(index);
  }

  /**
   * Check if initialized.
   */
  isInitialized(): boolean {
    return this.mimcSponge !== undefined;
  }
}
