import { PoseidonMerkleTree } from '@zkira/crypto';

/**
 * MerkleTree service that wraps the crypto PoseidonMerkleTree.
 * This service manages the off-chain Merkle tree for the shielded pool.
 */
export class MerkleTreeService {
  private tree: PoseidonMerkleTree;
  private initialized: boolean = false;

  constructor(levels: number = 20) {
    this.tree = new PoseidonMerkleTree(levels);
  }

  /**
   * Initialize the Merkle tree service.
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
   * Generate a Merkle proof for a leaf.
   */
  getProof(leafIndex: number) {
    if (!this.initialized) {
      throw new Error('MerkleTreeService not initialized');
    }
    return this.tree.getProof(leafIndex);
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
   * Get the underlying PoseidonMerkleTree instance.
   */
  getTree(): PoseidonMerkleTree {
    return this.tree;
  }

  /**
   * Check if the service is initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}