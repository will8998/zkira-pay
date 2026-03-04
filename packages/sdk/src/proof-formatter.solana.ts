/**
 * Proof formatter for converting snarkjs proof output to groth16-solana format.
 * 
 * groth16-solana expects:
 * - proof_a: [u8; 64] — two G1 points (x, y), each 32 bytes big-endian
 * - proof_b: [u8; 128] — one G2 point (x_c0, x_c1, y_c0, y_c1), each 32 bytes big-endian  
 * - proof_c: [u8; 64] — two G1 points (x, y), each 32 bytes big-endian
 * - public_inputs: [[u8; 32]; 4] — each as 32-byte big-endian
 * 
 * CRITICAL: groth16-solana expects NEGATED proof_a (negate the y-coordinate on BN254)
 */

// BN254 field prime for negation
const BN254_FIELD_PRIME = BigInt('21888242871839275222246405745257275088696311157297823662689037894645226208583');

export interface SnarkjsProof {
  pi_a: [string, string, string]; // [x, y, z] where z should be "1"
  pi_b: [[string, string], [string, string], [string, string]]; // [[x_c1, x_c0], [y_c1, y_c0], [z_c1, z_c0]]
  pi_c: [string, string, string]; // [x, y, z] where z should be "1"
}

export interface FormattedProof {
  proof_a: Uint8Array; // 64 bytes
  proof_b: Uint8Array; // 128 bytes
  proof_c: Uint8Array; // 64 bytes
  public_inputs: Uint8Array[]; // Array of 32-byte arrays
}

/**
 * Convert a decimal string to 32-byte big-endian array.
 */
function stringToBigEndianBytes(str: string): Uint8Array {
  const value = BigInt(str);
  const bytes = new Uint8Array(32);
  
  let val = value;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(val & 0xFFn);
    val = val >> 8n;
  }
  
  return bytes;
}

/**
 * Negate a field element on BN254 curve.
 */
function negateFieldElement(str: string): string {
  const value = BigInt(str);
  if (value === 0n) {
    return '0';
  }
  return (BN254_FIELD_PRIME - value).toString();
}

/**
 * Format snarkjs proof output for groth16-solana.
 * 
 * @param proof - snarkjs proof object
 * @param publicSignals - array of public input strings
 * @returns formatted proof ready for Solana
 */
export function formatProofForSolana(
  proof: SnarkjsProof,
  publicSignals: string[]
): FormattedProof {
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
  if (publicSignals.length !== 4) {
    throw new Error('Expected exactly 4 public inputs');
  }

  // Format proof_a (G1 point, NEGATED y-coordinate)
  const proof_a = new Uint8Array(64);
  const a_x_bytes = stringToBigEndianBytes(proof.pi_a[0]);
  const a_y_negated = negateFieldElement(proof.pi_a[1]);
  const a_y_bytes = stringToBigEndianBytes(a_y_negated);
  
  proof_a.set(a_x_bytes, 0);  // x coordinate
  proof_a.set(a_y_bytes, 32); // negated y coordinate

  // Format proof_b (G2 point: x_c0, x_c1, y_c0, y_c1)
  const proof_b = new Uint8Array(128);
  const b_x_c0_bytes = stringToBigEndianBytes(proof.pi_b[0][1]); // x_c0
  const b_x_c1_bytes = stringToBigEndianBytes(proof.pi_b[0][0]); // x_c1
  const b_y_c0_bytes = stringToBigEndianBytes(proof.pi_b[1][1]); // y_c0
  const b_y_c1_bytes = stringToBigEndianBytes(proof.pi_b[1][0]); // y_c1
  
  proof_b.set(b_x_c0_bytes, 0);   // x_c0
  proof_b.set(b_x_c1_bytes, 32);  // x_c1
  proof_b.set(b_y_c0_bytes, 64);  // y_c0
  proof_b.set(b_y_c1_bytes, 96);  // y_c1

  // Format proof_c (G1 point, no negation)
  const proof_c = new Uint8Array(64);
  const c_x_bytes = stringToBigEndianBytes(proof.pi_c[0]);
  const c_y_bytes = stringToBigEndianBytes(proof.pi_c[1]);
  
  proof_c.set(c_x_bytes, 0);  // x coordinate
  proof_c.set(c_y_bytes, 32); // y coordinate

  // Format public inputs
  const public_inputs = publicSignals.map(signal => stringToBigEndianBytes(signal));

  return {
    proof_a,
    proof_b,
    proof_c,
    public_inputs,
  };
}