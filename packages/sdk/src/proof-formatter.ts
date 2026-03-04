/**
 * Proof formatter for converting snarkjs proof output to Tornado Cash Verifier.sol format.
 *
 * Tornado Cash Verifier.sol expects:
 * - verifyProof(bytes memory _proof, uint256[6] memory _input)
 * - _proof is ABI-encoded: abi.encode(uint256[2] a, uint256[2][2] b, uint256[2] c)
 *   - a = [pi_a[0], pi_a[1]] (G1, NO negation — Tornado verifier handles it)
 *   - b = [[pi_b[0][1], pi_b[0][0]], [pi_b[1][1], pi_b[1][0]]] (G2, swapped indices)
 *   - c = [pi_c[0], pi_c[1]] (G1)
 * - _input = [root, nullifierHash, recipient, relayer, fee, refund]
 */

import type { TornadoFormattedProof } from './types.js';

export interface SnarkjsProof {
  pi_a: [string, string, string]; // [x, y, z] where z should be "1"
  pi_b: [[string, string], [string, string], [string, string]]; // [[x_c1, x_c0], [y_c1, y_c0], [z_c1, z_c0]]
  pi_c: [string, string, string]; // [x, y, z] where z should be "1"
}

/**
 * Convert a decimal string to a 32-byte big-endian Uint8Array (uint256).
 */
function uint256ToBytes(value: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let val = value;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(val & 0xFFn);
    val = val >> 8n;
  }
  return bytes;
}

/**
 * ABI-encode a single uint256 value as 32 bytes (big-endian, zero-padded).
 */
function encodeUint256(value: string): Uint8Array {
  return uint256ToBytes(BigInt(value));
}

/**
 * ABI-encode the Groth16 proof for Tornado Cash Verifier.sol.
 *
 * Layout (8 × 32 = 256 bytes total):
 *   [0..32)    a[0]
 *   [32..64)   a[1]
 *   [64..96)   b[0][0]  (pi_b[0][1] — note swapped)
 *   [96..128)  b[0][1]  (pi_b[0][0] — note swapped)
 *   [128..160) b[1][0]  (pi_b[1][1] — note swapped)
 *   [160..192) b[1][1]  (pi_b[1][0] — note swapped)
 *   [192..224) c[0]
 *   [224..256) c[1]
 */
function encodeProofBytes(proof: SnarkjsProof): Uint8Array {
  const encoded = new Uint8Array(256);

  // a = [pi_a[0], pi_a[1]] — NO negation for Tornado Cash
  encoded.set(encodeUint256(proof.pi_a[0]), 0);
  encoded.set(encodeUint256(proof.pi_a[1]), 32);

  // b = [[pi_b[0][1], pi_b[0][0]], [pi_b[1][1], pi_b[1][0]]] — swapped indices
  encoded.set(encodeUint256(proof.pi_b[0][1]), 64);
  encoded.set(encodeUint256(proof.pi_b[0][0]), 96);
  encoded.set(encodeUint256(proof.pi_b[1][1]), 128);
  encoded.set(encodeUint256(proof.pi_b[1][0]), 160);

  // c = [pi_c[0], pi_c[1]]
  encoded.set(encodeUint256(proof.pi_c[0]), 192);
  encoded.set(encodeUint256(proof.pi_c[1]), 224);

  return encoded;
}

/**
 * Format a snarkjs Groth16 proof for Tornado Cash's Verifier.sol contract.
 *
 * @param proof - snarkjs proof object from groth16.fullProve()
 * @param publicSignals - array of 6 public input strings:
 *   [root, nullifierHash, recipient, relayer, fee, refund]
 * @returns Formatted proof ready for Tornado Cash withdraw() call
 */
export function formatProofForTornado(
  proof: SnarkjsProof,
  publicSignals: string[]
): TornadoFormattedProof {
  // Validate proof structure
  if (!proof.pi_a || proof.pi_a.length !== 3) {
    throw new Error('Invalid proof.pi_a format');
  }
  if (!proof.pi_b || proof.pi_b.length !== 3 || proof.pi_b[0].length !== 2) {
    throw new Error('Invalid proof.pi_b format');
  }
  if (!proof.pi_c || proof.pi_c.length !== 3) {
    throw new Error('Invalid proof.pi_c format');
  }
  if (publicSignals.length !== 6) {
    throw new Error('Expected exactly 6 public inputs: [root, nullifierHash, recipient, relayer, fee, refund]');
  }

  // Encode proof bytes (256 bytes: a[2] + b[2][2] + c[2])
  const proofBytes = encodeProofBytes(proof);

  // Convert public signals to bigint array
  const publicInputs = publicSignals.map(s => BigInt(s));

  return {
    proof: proofBytes,
    publicInputs,
  };
}
