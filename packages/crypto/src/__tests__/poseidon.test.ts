import { describe, it, expect, beforeAll } from 'vitest';
import { PoseidonMerkleTree } from '../poseidon.js';
import { buildPoseidon } from 'circomlibjs';

describe('PoseidonMerkleTree', () => {
  let tree: PoseidonMerkleTree;
  let poseidon: any;

  beforeAll(async () => {
    // Initialize Poseidon for reference calculations
    poseidon = await buildPoseidon();
    tree = new PoseidonMerkleTree(20);
    await tree.init();
  });

  describe('initialization', () => {
    it('should initialize with default 20 levels', async () => {
      const defaultTree = new PoseidonMerkleTree();
      await defaultTree.init();
      
      expect(defaultTree.getDepth()).toBe(20);
      expect(defaultTree.isInitialized()).toBe(true);
      expect(defaultTree.getLeafCount()).toBe(0);
    });

    it('should initialize with custom levels', async () => {
      const customTree = new PoseidonMerkleTree(10);
      await customTree.init();
      
      expect(customTree.getDepth()).toBe(10);
      expect(customTree.isInitialized()).toBe(true);
    });

    it('should throw error when using uninitialized tree', () => {
      const uninitTree = new PoseidonMerkleTree();
      
      expect(() => uninitTree.insert(BigInt(123))).toThrow('Tree not initialized');
      expect(() => uninitTree.getRoot()).toThrow('Tree not initialized');
      expect(() => uninitTree.getProof(0)).toThrow('Tree not initialized');
    });
  });

  describe('zero hashes computation', () => {
    it('should compute zero hashes matching circuit implementation', async () => {
      // Reference implementation from circuit test
      const levels = 20;
      const ZERO = BigInt(0);
      
      const expectedZeroHashes: bigint[] = [ZERO];
      for (let i = 1; i <= levels; i++) {
        expectedZeroHashes[i] = poseidon.F.toObject(
          poseidon([expectedZeroHashes[i - 1], expectedZeroHashes[i - 1]])
        );
      }

      // Empty tree root should match the zero hash at the top level
      const emptyRoot = tree.getRoot();
      expect(emptyRoot).toBe(expectedZeroHashes[levels]);
    });
  });

  describe('single insertion', () => {
    it('should insert a commitment and change the root', () => {
      const commitment = BigInt('12345678901234567890');
      const emptyRoot = tree.getRoot();
      
      const leafIndex = tree.insert(commitment);
      const newRoot = tree.getRoot();
      
      expect(leafIndex).toBe(0);
      expect(newRoot).not.toBe(emptyRoot);
      expect(tree.getLeafCount()).toBe(1);
      expect(tree.getLeaf(0)).toBe(commitment);
    });

    it('should compute root matching circuit implementation for single leaf', async () => {
      const freshTree = new PoseidonMerkleTree(20);
      await freshTree.init();
      
      const commitment = BigInt('12345678901234567890');
      freshTree.insert(commitment);
      
      // Reference calculation from circuit test
      const levels = 20;
      const ZERO = BigInt(0);
      
      const zeroHashes: bigint[] = [ZERO];
      for (let i = 1; i <= levels; i++) {
        zeroHashes[i] = poseidon.F.toObject(
          poseidon([zeroHashes[i - 1], zeroHashes[i - 1]])
        );
      }

      // Compute expected root: commitment at index 0, all siblings are zero hashes
      let currentHash = commitment;
      for (let i = 0; i < levels; i++) {
        currentHash = poseidon.F.toObject(
          poseidon([currentHash, zeroHashes[i]])
        );
      }
      
      const expectedRoot = currentHash;
      const actualRoot = freshTree.getRoot();
      
      expect(actualRoot).toBe(expectedRoot);
    });
  });

  describe('proof generation', () => {
    it('should generate proof with correct lengths', () => {
      const freshTree = new PoseidonMerkleTree(20);
      freshTree.init();
      
      const commitment = BigInt('98765432109876543210');
      const leafIndex = freshTree.insert(commitment);
      
      const proof = freshTree.getProof(leafIndex);
      
      expect(proof.pathElements).toHaveLength(20);
      expect(proof.pathIndices).toHaveLength(20);
    });

    it('should generate proof matching circuit test implementation', async () => {
      const freshTree = new PoseidonMerkleTree(20);
      await freshTree.init();
      
      const commitment = BigInt('12345678901234567890');
      const leafIndex = freshTree.insert(commitment);
      
      const proof = freshTree.getProof(leafIndex);
      
      // Reference calculation from circuit test
      const levels = 20;
      const ZERO = BigInt(0);
      
      const zeroHashes: bigint[] = [ZERO];
      for (let i = 1; i <= levels; i++) {
        zeroHashes[i] = poseidon.F.toObject(
          poseidon([zeroHashes[i - 1], zeroHashes[i - 1]])
        );
      }

      // For leaf at index 0, all siblings should be zero hashes
      // and all path indices should be 0 (left side)
      const expectedPathElements = zeroHashes.slice(0, levels);
      const expectedPathIndices = new Array(levels).fill(0);
      
      expect(proof.pathElements).toEqual(expectedPathElements);
      expect(proof.pathIndices).toEqual(expectedPathIndices);
    });

    it('should generate different proofs for different leaf positions', async () => {
      const freshTree = new PoseidonMerkleTree(5); // Smaller tree for easier testing
      await freshTree.init();
      
      const commitment1 = BigInt('111');
      const commitment2 = BigInt('222');
      
      const index1 = freshTree.insert(commitment1);
      const index2 = freshTree.insert(commitment2);
      
      const proof1 = freshTree.getProof(index1);
      const proof2 = freshTree.getProof(index2);
      
      // Proofs should be different
      expect(proof1.pathElements).not.toEqual(proof2.pathElements);
      expect(proof1.pathIndices).not.toEqual(proof2.pathIndices);
      
      // But both should have correct length
      expect(proof1.pathElements).toHaveLength(5);
      expect(proof2.pathElements).toHaveLength(5);
    });
  });

  describe('proof verification', () => {
    it('should generate verifiable proofs', async () => {
      const freshTree = new PoseidonMerkleTree(10); // Smaller for faster testing
      await freshTree.init();
      
      const commitment = BigInt('555666777888');
      const leafIndex = freshTree.insert(commitment);
      const root = freshTree.getRoot();
      const proof = freshTree.getProof(leafIndex);
      
      // Verify proof by recomputing root
      let computedHash = commitment;
      for (let i = 0; i < proof.pathElements.length; i++) {
        const sibling = proof.pathElements[i];
        const isLeft = proof.pathIndices[i] === 0;
        
        if (isLeft) {
          computedHash = poseidon.F.toObject(
            poseidon([computedHash, sibling])
          );
        } else {
          computedHash = poseidon.F.toObject(
            poseidon([sibling, computedHash])
          );
        }
      }
      
      expect(computedHash).toBe(root);
    });
  });

  describe('multiple insertions', () => {
    it('should handle multiple insertions correctly', async () => {
      const freshTree = new PoseidonMerkleTree(5);
      await freshTree.init();
      
      const commitments = [
        BigInt('111'),
        BigInt('222'),
        BigInt('333'),
        BigInt('444'),
      ];
      
      const roots: bigint[] = [];
      
      for (const commitment of commitments) {
        freshTree.insert(commitment);
        roots.push(freshTree.getRoot());
      }
      
      // Each insertion should produce a different root
      const uniqueRoots = new Set(roots.map(r => r.toString()));
      expect(uniqueRoots.size).toBe(commitments.length);
      
      // Final tree should have all leaves
      expect(freshTree.getLeafCount()).toBe(commitments.length);
      for (let i = 0; i < commitments.length; i++) {
        expect(freshTree.getLeaf(i)).toBe(commitments[i]);
      }
    });

    it('should generate valid proofs for all leaves after multiple insertions', async () => {
      const freshTree = new PoseidonMerkleTree(8);
      await freshTree.init();
      
      const commitments = [
        BigInt('1001'),
        BigInt('2002'),
        BigInt('3003'),
      ];
      
      // Insert all commitments
      for (const commitment of commitments) {
        freshTree.insert(commitment);
      }
      
      const root = freshTree.getRoot();
      
      // Verify proof for each leaf
      for (let i = 0; i < commitments.length; i++) {
        const proof = freshTree.getProof(i);
        const commitment = commitments[i];
        
        // Recompute root using proof
        let computedHash = commitment;
        for (let j = 0; j < proof.pathElements.length; j++) {
          const sibling = proof.pathElements[j];
          const isLeft = proof.pathIndices[j] === 0;
          
          if (isLeft) {
            computedHash = poseidon.F.toObject(
              poseidon([computedHash, sibling])
            );
          } else {
            computedHash = poseidon.F.toObject(
              poseidon([sibling, computedHash])
            );
          }
        }
        
        expect(computedHash).toBe(root);
      }
    });
  });

  describe('toBytes conversion', () => {
    it('should convert bigint to 32-byte array', () => {
      const value = BigInt('0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0');
      const bytes = tree.toBytes(value);
      
      expect(bytes).toHaveLength(32);
      expect(bytes).toBeInstanceOf(Uint8Array);
      
      // Convert back to verify
      let reconstructed = BigInt(0);
      for (let i = 0; i < 32; i++) {
        reconstructed = (reconstructed << 8n) + BigInt(bytes[i]);
      }
      
      expect(reconstructed).toBe(value);
    });

    it('should handle zero value', () => {
      const bytes = tree.toBytes(BigInt(0));
      
      expect(bytes).toHaveLength(32);
      expect(Array.from(bytes)).toEqual(new Array(32).fill(0));
    });

    it('should handle small values', () => {
      const value = BigInt(255);
      const bytes = tree.toBytes(value);
      
      expect(bytes).toHaveLength(32);
      expect(bytes[31]).toBe(255);
      expect(bytes[30]).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty tree queries', () => {
      const freshTree = new PoseidonMerkleTree(5);
      freshTree.init();
      
      expect(freshTree.getLeafCount()).toBe(0);
      expect(freshTree.getLeaf(0)).toBeUndefined();
      expect(freshTree.getLeaf(999)).toBeUndefined();
    });

    it('should handle proof requests for non-existent leaves', () => {
      const freshTree = new PoseidonMerkleTree(5);
      freshTree.init();
      
      freshTree.insert(BigInt(123));
      
      // Should still generate a proof (with zero siblings)
      const proof = freshTree.getProof(999);
      expect(proof.pathElements).toHaveLength(5);
      expect(proof.pathIndices).toHaveLength(5);
    });
  });
});