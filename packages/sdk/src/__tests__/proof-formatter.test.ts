import { formatProofForSolana, type SnarkjsProof } from '../proof-formatter.js';

describe('formatProofForSolana', () => {
  const mockSnarkjsProof: SnarkjsProof = {
    pi_a: [
      '12345678901234567890123456789012345678901234567890123456789012345678901234567890',
      '98765432109876543210987654321098765432109876543210987654321098765432109876543210',
      '1'
    ],
    pi_b: [
      [
        '11111111111111111111111111111111111111111111111111111111111111111111111111111111',
        '22222222222222222222222222222222222222222222222222222222222222222222222222222222'
      ],
      [
        '33333333333333333333333333333333333333333333333333333333333333333333333333333333',
        '44444444444444444444444444444444444444444444444444444444444444444444444444444444'
      ],
      ['1', '0']
    ],
    pi_c: [
      '55555555555555555555555555555555555555555555555555555555555555555555555555555555',
      '66666666666666666666666666666666666666666666666666666666666666666666666666666666',
      '1'
    ]
  };

  const mockPublicSignals = [
    '77777777777777777777777777777777777777777777777777777777777777777777777777777777', // root
    '88888888888888888888888888888888888888888888888888888888888888888888888888888888', // nullifierHash
    '99999999999999999999999999999999999999999999999999999999999999999999999999999999', // recipient
    '10000000000000000000000000000000000000000000000000000000000000000000000000000000'  // denomination
  ];

  it('should format proof correctly', () => {
    const result = formatProofForSolana(mockSnarkjsProof, mockPublicSignals);

    expect(result.proof_a).toHaveLength(64);
    expect(result.proof_b).toHaveLength(128);
    expect(result.proof_c).toHaveLength(64);
    expect(result.public_inputs).toHaveLength(4);
    expect(result.public_inputs[0]).toHaveLength(32);
  });

  it('should negate proof_a y-coordinate', () => {
    const result = formatProofForSolana(mockSnarkjsProof, mockPublicSignals);
    
    const BN254_FIELD_PRIME = BigInt('21888242871839275222246405745257275088696311157297823662689037894645226208583');
    const originalY = BigInt(mockSnarkjsProof.pi_a[1]);
    const expectedNegatedY = BN254_FIELD_PRIME - originalY;
    
    const negatedYBytes = new Uint8Array(32);
    let val = expectedNegatedY;
    for (let i = 31; i >= 0; i--) {
      negatedYBytes[i] = Number(val & 0xFFn);
      val = val >> 8n;
    }
    
    const actualYBytes = result.proof_a.slice(32, 64);
    expect(actualYBytes).toEqual(negatedYBytes);
  });

  it('should not negate proof_c coordinates', () => {
    const result = formatProofForSolana(mockSnarkjsProof, mockPublicSignals);
    
    const originalX = BigInt(mockSnarkjsProof.pi_c[0]);
    const originalY = BigInt(mockSnarkjsProof.pi_c[1]);
    
    const expectedXBytes = new Uint8Array(32);
    let val = originalX;
    for (let i = 31; i >= 0; i--) {
      expectedXBytes[i] = Number(val & 0xFFn);
      val = val >> 8n;
    }
    
    const expectedYBytes = new Uint8Array(32);
    val = originalY;
    for (let i = 31; i >= 0; i--) {
      expectedYBytes[i] = Number(val & 0xFFn);
      val = val >> 8n;
    }
    
    const actualXBytes = result.proof_c.slice(0, 32);
    const actualYBytes = result.proof_c.slice(32, 64);
    
    expect(actualXBytes).toEqual(expectedXBytes);
    expect(actualYBytes).toEqual(expectedYBytes);
  });

  it('should format public inputs as 32-byte big-endian arrays', () => {
    const result = formatProofForSolana(mockSnarkjsProof, mockPublicSignals);
    
    for (let i = 0; i < mockPublicSignals.length; i++) {
      const originalValue = BigInt(mockPublicSignals[i]);
      const expectedBytes = new Uint8Array(32);
      let val = originalValue;
      for (let j = 31; j >= 0; j--) {
        expectedBytes[j] = Number(val & 0xFFn);
        val = val >> 8n;
      }
      
      expect(result.public_inputs[i]).toEqual(expectedBytes);
    }
  });

  it('should throw error for invalid proof structure', () => {
    const invalidProof = {
      ...mockSnarkjsProof,
      pi_a: ['1', '2'] // Missing third element
    };
    
    expect(() => formatProofForSolana(invalidProof as any, mockPublicSignals))
      .toThrow('Invalid proof.pi_a format');
  });

  it('should throw error for wrong number of public inputs', () => {
    const invalidPublicSignals = ['1', '2', '3']; // Should be 4
    
    expect(() => formatProofForSolana(mockSnarkjsProof, invalidPublicSignals))
      .toThrow('Expected exactly 4 public inputs');
  });

  it('should handle zero values correctly', () => {
    const zeroProof: SnarkjsProof = {
      pi_a: ['0', '0', '1'],
      pi_b: [['0', '0'], ['0', '0'], ['1', '0']],
      pi_c: ['0', '0', '1']
    };
    const zeroPublicSignals = ['0', '0', '0', '0'];
    
    const result = formatProofForSolana(zeroProof, zeroPublicSignals);
    
    expect(result.proof_a.slice(0, 32)).toEqual(new Uint8Array(32));
    expect(result.proof_a.slice(32, 64)).toEqual(new Uint8Array(32));
    expect(result.proof_c).toEqual(new Uint8Array(64));
    expect(result.public_inputs[0]).toEqual(new Uint8Array(32));
  });
});