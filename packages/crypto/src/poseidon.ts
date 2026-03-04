import { buildPoseidon } from 'circomlibjs';

export interface MerkleProof {
  pathElements: bigint[];
  pathIndices: number[];
}

/**
 * Poseidon Merkle Tree implementation compatible with circom circuits.
 * Uses circomlibjs for Poseidon hashing to ensure compatibility with ZK circuits.
 */
export class PoseidonMerkleTree {
  private poseidon: any;
  private levels: number;
  private zeroHashes: bigint[];
  private leaves: Map<number, bigint>;
  private nextLeafIndex: number;

  constructor(levels: number = 20) {
    this.levels = levels;
    this.zeroHashes = [];
    this.leaves = new Map();
    this.nextLeafIndex = 0;
  }

  /**
   * Initialize the Poseidon hasher and compute zero hashes.
   * Must be called before using the tree.
   */
  async init(): Promise<void> {
    this.poseidon = await buildPoseidon();
    
    // Compute zero hashes for empty tree
    // Zero leaf = 0, then hash(zero, zero) at each level upward
    const ZERO = BigInt(0);
    this.zeroHashes = [ZERO];
    
    for (let i = 1; i <= this.levels; i++) {
      this.zeroHashes[i] = this.poseidon.F.toObject(
        this.poseidon([this.zeroHashes[i - 1], this.zeroHashes[i - 1]])
      );
    }
  }

  /**
   * Insert a commitment into the tree and return the leaf index.
   */
  insert(commitment: bigint): number {
    if (!this.poseidon) {
      throw new Error('Tree not initialized. Call init() first.');
    }

    const leafIndex = this.nextLeafIndex;
    this.leaves.set(leafIndex, commitment);
    this.nextLeafIndex++;
    
    return leafIndex;
  }

  /**
   * Get the current Merkle root.
   */
  getRoot(): bigint {
    if (!this.poseidon) {
      throw new Error('Tree not initialized. Call init() first.');
    }

    // If no leaves, return the zero hash at the root level
    if (this.leaves.size === 0) {
      return this.zeroHashes[this.levels];
    }

    // Build the tree bottom-up
    const tree: Map<string, bigint> = new Map();
    
    // Set all leaves
    for (const [index, value] of this.leaves) {
      tree.set(`${0}-${index}`, value);
    }

    // Build each level
    for (let level = 0; level < this.levels; level++) {
      const nextLevel = level + 1;
      const nodesAtLevel = Math.pow(2, this.levels - level);
      
      for (let i = 0; i < nodesAtLevel; i += 2) {
        const leftKey = `${level}-${i}`;
        const rightKey = `${level}-${i + 1}`;
        const parentKey = `${nextLevel}-${Math.floor(i / 2)}`;
        
        const left = tree.get(leftKey) ?? this.zeroHashes[level];
        const right = tree.get(rightKey) ?? this.zeroHashes[level];
        
        const parent = this.poseidon.F.toObject(
          this.poseidon([left, right])
        );
        
        tree.set(parentKey, parent);
      }
    }

    return tree.get(`${this.levels}-0`) ?? this.zeroHashes[this.levels];
  }

  /**
   * Generate a Merkle proof for a leaf at the given index.
   */
  getProof(leafIndex: number): MerkleProof {
    if (!this.poseidon) {
      throw new Error('Tree not initialized. Call init() first.');
    }

    const pathElements: bigint[] = [];
    const pathIndices: number[] = [];

    // Build the tree to get sibling values
    const tree: Map<string, bigint> = new Map();
    
    // Set all leaves
    for (const [index, value] of this.leaves) {
      tree.set(`${0}-${index}`, value);
    }

    // Build each level
    for (let level = 0; level < this.levels; level++) {
      const nextLevel = level + 1;
      const nodesAtLevel = Math.pow(2, this.levels - level);
      
      for (let i = 0; i < nodesAtLevel; i += 2) {
        const leftKey = `${level}-${i}`;
        const rightKey = `${level}-${i + 1}`;
        const parentKey = `${nextLevel}-${Math.floor(i / 2)}`;
        
        const left = tree.get(leftKey) ?? this.zeroHashes[level];
        const right = tree.get(rightKey) ?? this.zeroHashes[level];
        
        const parent = this.poseidon.F.toObject(
          this.poseidon([left, right])
        );
        
        tree.set(parentKey, parent);
      }
    }

    // Generate proof path
    let currentIndex = leafIndex;
    
    for (let level = 0; level < this.levels; level++) {
      const isLeft = currentIndex % 2 === 0;
      const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
      
      const siblingKey = `${level}-${siblingIndex}`;
      const sibling = tree.get(siblingKey) ?? this.zeroHashes[level];
      
      pathElements.push(sibling);
      pathIndices.push(isLeft ? 0 : 1);
      
      currentIndex = Math.floor(currentIndex / 2);
    }

    return { pathElements, pathIndices };
  }

  /**
   * Convert a bigint root to 32-byte array (big-endian, matching BN254 field).
   */
  toBytes(value: bigint): Uint8Array {
    const bytes = new Uint8Array(32);
    let val = value;
    
    // Convert to big-endian bytes
    for (let i = 31; i >= 0; i--) {
      bytes[i] = Number(val & 0xFFn);
      val = val >> 8n;
    }
    
    return bytes;
  }

  /**
   * Get the number of leaves in the tree.
   */
  getLeafCount(): number {
    return this.nextLeafIndex;
  }

  /**
   * Get the tree depth (number of levels).
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
   * Check if the tree has been initialized.
   */
  isInitialized(): boolean {
    return this.poseidon !== undefined;
  }
}