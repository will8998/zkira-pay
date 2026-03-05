import { MiMCSpongeTree } from '@zkira/crypto';

/**
 * MerkleTree service that wraps the MiMCSponge Merkle tree.
 * This service manages the off-chain Merkle tree for the shielded pool.
 * Uses MiMCSponge hashing to match on-chain MerkleTreeWithHistory.sol.
 */
export class MerkleTreeService {
  private tree: MiMCSpongeTree;
  private initialized: boolean = false;

  constructor(levels: number = 20) {
    this.tree = new MiMCSpongeTree(levels);
  }

  /**
   * Initialize the Merkle tree service (loads MiMCSponge WASM).
   */
  async init(): Promise<void> {
    await this.tree.init();
    this.initialized = true;
  }

  /**
   * Insert a commitment into the tree.
   */
  insert(commitment: bigint): number {
    if (!this.initialized) {
      throw new Error('MerkleTreeService not initialized');
    }
    return this.tree.insert(commitment);
  }

  /**
   * Get the current Merkle root.
   */
  getRoot(): bigint {
    if (!this.initialized) {
      throw new Error('MerkleTreeService not initialized');
    }
    return this.tree.getRoot();
  }

  /**
   * Get the current Merkle root as bytes.
   */
  getRootBytes(): Uint8Array {
    if (!this.initialized) {
      throw new Error('MerkleTreeService not initialized');
    }
    return this.tree.toBytes(this.getRoot());
  }

  /**
   * Check if a root is known (exists in root history).
   */
  isKnownRoot(root: bigint): boolean {
    if (!this.initialized) {
      throw new Error('MerkleTreeService not initialized');
    }
    return this.tree.isKnownRoot(root);
  }

  /**
   * Generate a Merkle proof for a leaf.
   */
  getProof(leafIndex: number) {
    if (!this.initialized) {
      throw new Error('MerkleTreeService not initialized');
    }
    return this.tree.getProof(leafIndex);
  }

  /**
   * Compute commitment = MiMCSponge(nullifier, secret).
   */
  computeCommitment(nullifier: bigint, secret: bigint): bigint {
    if (!this.initialized) {
      throw new Error('MerkleTreeService not initialized');
    }
    return this.tree.computeCommitment(nullifier, secret);
  }

  /**
   * Compute nullifierHash = MiMCSponge(nullifier).
   */
  computeNullifierHash(nullifier: bigint): bigint {
    if (!this.initialized) {
      throw new Error('MerkleTreeService not initialized');
    }
    return this.tree.computeNullifierHash(nullifier);
  }

  /**
   * Get the number of leaves in the tree.
   */
  getLeafCount(): number {
    if (!this.initialized) {
      throw new Error('MerkleTreeService not initialized');
    }
    return this.tree.getLeafCount();
  }

  /**
   * Get the underlying MiMCSpongeTree instance.
   */
  getTree(): MiMCSpongeTree {
    return this.tree;
  }

  /**
   * Check if the service is initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
