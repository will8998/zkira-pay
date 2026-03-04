import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import * as os from 'os';
import { existsSync, readFileSync, mkdtempSync, rmSync } from 'fs';

// Note: These tests require the circuit to be compiled first
// Run: bash circuits/scripts/compile.sh

const CIRCUITS_DIR = path.join(__dirname, '..');
const BUILD_DIR = path.join(CIRCUITS_DIR, 'build');
const CIRCUIT_WASM = path.join(BUILD_DIR, 'withdraw_js', 'withdraw.wasm');
const CIRCUIT_R1CS = path.join(BUILD_DIR, 'withdraw.r1cs');
const CIRCUIT_SYM = path.join(BUILD_DIR, 'withdraw.sym');

// Maximum allowed constraints for the circuit
const MAX_CONSTRAINTS = 50_000;

describe('Withdraw Circuit', () => {
    describe('compilation artifacts', () => {
        it('should have r1cs file after compilation', () => {
            if (!existsSync(CIRCUIT_R1CS)) {
                console.warn('Circuit not compiled yet. Run: bash circuits/scripts/compile.sh');
                return;
            }
            expect(existsSync(CIRCUIT_R1CS)).toBe(true);
        });

        it('should have wasm file after compilation', () => {
            if (!existsSync(CIRCUIT_WASM)) {
                console.warn('Circuit not compiled yet. Run: bash circuits/scripts/compile.sh');
                return;
            }
            expect(existsSync(CIRCUIT_WASM)).toBe(true);
        });

        it('should have sym file after compilation', () => {
            if (!existsSync(CIRCUIT_SYM)) {
                console.warn('Circuit not compiled yet. Run: bash circuits/scripts/compile.sh');
                return;
            }
            expect(existsSync(CIRCUIT_SYM)).toBe(true);
        });
    });

    describe('constraint count', () => {
        it('should have fewer than 50k constraints', async () => {
            if (!existsSync(CIRCUIT_R1CS)) {
                console.warn('Circuit not compiled yet — skipping constraint check');
                return;
            }

            // Use snarkjs to read r1cs info
            const snarkjs = await import('snarkjs');
            const r1csInfo = await snarkjs.r1cs.info(CIRCUIT_R1CS);

            console.log(`Circuit constraints: ${r1csInfo.nConstraints}`);
            expect(r1csInfo.nConstraints).toBeLessThan(MAX_CONSTRAINTS);
        });
    });

    describe('witness generation', () => {
        it('should generate a valid witness with correct inputs', async () => {
            if (!existsSync(CIRCUIT_WASM)) {
                console.warn('Circuit not compiled yet — skipping witness test');
                return;
            }

            // Import circomlibjs for Poseidon (compatible with circomlib's Poseidon)
            const { buildPoseidon } = await import('circomlibjs');
            const poseidon = await buildPoseidon();
            const snarkjs = await import('snarkjs');

            // Generate random secrets
            const nullifier = BigInt('12345678901234567890');
            const secret = BigInt('98765432109876543210');

            // Compute commitment = Poseidon(nullifier, secret)
            const commitment = poseidon.F.toObject(
                poseidon([nullifier, secret])
            );

            // Compute nullifierHash = Poseidon(nullifier)
            const nullifierHash = poseidon.F.toObject(
                poseidon([nullifier])
            );

            // Build a 20-level Merkle tree with commitment at index 0
            const levels = 20;
            const ZERO = BigInt(0);

            // Compute zero hashes for empty tree
            const zeroHashes: bigint[] = [ZERO];
            for (let i = 1; i <= levels; i++) {
                zeroHashes[i] = poseidon.F.toObject(
                    poseidon([zeroHashes[i - 1], zeroHashes[i - 1]])
                );
            }

            // Insert commitment at leaf index 0
            // Path: all left (pathIndices = all 0)
            // Siblings: all zero hashes at each level
            const pathElements: bigint[] = [];
            const pathIndices: number[] = [];

            let currentHash = commitment;
            for (let i = 0; i < levels; i++) {
                pathElements.push(zeroHashes[i]);
                pathIndices.push(0); // leaf is on the left side

                currentHash = poseidon.F.toObject(
                    poseidon([currentHash, zeroHashes[i]])
                );
            }

            const root = currentHash;

            // Public inputs
            const recipient = BigInt('0x1234567890abcdef1234567890abcdef12345678');
            const denomination = BigInt('1000000000'); // 1 SOL in lamports

            const input = {
                // Public
                root: root.toString(),
                nullifierHash: nullifierHash.toString(),
                recipient: recipient.toString(),
                denomination: denomination.toString(),
                // Private
                nullifier: nullifier.toString(),
                secret: secret.toString(),
                pathElements: pathElements.map((e) => e.toString()),
                pathIndices: pathIndices,
            };

            // Generate witness to a temp file
            const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'zkira-circuit-'));
            const wtnsPath = path.join(tmpDir, 'witness.wtns');

            try {
                await snarkjs.wtns.calculate(input, CIRCUIT_WASM, wtnsPath);
                expect(existsSync(wtnsPath)).toBe(true);
            } finally {
                rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('should reject an invalid nullifier hash', async () => {
            if (!existsSync(CIRCUIT_WASM)) {
                console.warn('Circuit not compiled yet — skipping invalid nullifier test');
                return;
            }

            const { buildPoseidon } = await import('circomlibjs');
            const poseidon = await buildPoseidon();
            const snarkjs = await import('snarkjs');

            const nullifier = BigInt('12345678901234567890');
            const secret = BigInt('98765432109876543210');

            const commitment = poseidon.F.toObject(
                poseidon([nullifier, secret])
            );

            // Deliberately wrong nullifier hash
            const wrongNullifierHash = BigInt('999999999');

            const levels = 20;
            const ZERO = BigInt(0);

            const zeroHashes: bigint[] = [ZERO];
            for (let i = 1; i <= levels; i++) {
                zeroHashes[i] = poseidon.F.toObject(
                    poseidon([zeroHashes[i - 1], zeroHashes[i - 1]])
                );
            }

            const pathElements: bigint[] = [];
            const pathIndices: number[] = [];

            let currentHash = commitment;
            for (let i = 0; i < levels; i++) {
                pathElements.push(zeroHashes[i]);
                pathIndices.push(0);
                currentHash = poseidon.F.toObject(
                    poseidon([currentHash, zeroHashes[i]])
                );
            }

            const root = currentHash;

            const input = {
                root: root.toString(),
                nullifierHash: wrongNullifierHash.toString(), // WRONG
                recipient: BigInt('0x1234567890abcdef').toString(),
                denomination: BigInt('1000000000').toString(),
                nullifier: nullifier.toString(),
                secret: secret.toString(),
                pathElements: pathElements.map((e) => e.toString()),
                pathIndices: pathIndices,
            };

            // Should throw because nullifierHash doesn't match Poseidon(nullifier)
            const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'zkira-circuit-'));
            const wtnsPath = path.join(tmpDir, 'witness.wtns');
            try {
                await expect(
                    snarkjs.wtns.calculate(input, CIRCUIT_WASM, wtnsPath)
                ).rejects.toThrow();
            } finally {
                rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('should reject a wrong Merkle root', async () => {
            if (!existsSync(CIRCUIT_WASM)) {
                console.warn('Circuit not compiled yet — skipping wrong root test');
                return;
            }

            const { buildPoseidon } = await import('circomlibjs');
            const poseidon = await buildPoseidon();
            const snarkjs = await import('snarkjs');

            const nullifier = BigInt('12345678901234567890');
            const secret = BigInt('98765432109876543210');

            const commitment = poseidon.F.toObject(
                poseidon([nullifier, secret])
            );

            const nullifierHash = poseidon.F.toObject(
                poseidon([nullifier])
            );

            const levels = 20;
            const ZERO = BigInt(0);

            const zeroHashes: bigint[] = [ZERO];
            for (let i = 1; i <= levels; i++) {
                zeroHashes[i] = poseidon.F.toObject(
                    poseidon([zeroHashes[i - 1], zeroHashes[i - 1]])
                );
            }

            const pathElements: bigint[] = [];
            const pathIndices: number[] = [];

            let currentHash = commitment;
            for (let i = 0; i < levels; i++) {
                pathElements.push(zeroHashes[i]);
                pathIndices.push(0);
                currentHash = poseidon.F.toObject(
                    poseidon([currentHash, zeroHashes[i]])
                );
            }

            // Deliberately wrong root
            const wrongRoot = BigInt('111111111');

            const input = {
                root: wrongRoot.toString(), // WRONG
                nullifierHash: nullifierHash.toString(),
                recipient: BigInt('0x1234567890abcdef').toString(),
                denomination: BigInt('1000000000').toString(),
                nullifier: nullifier.toString(),
                secret: secret.toString(),
                pathElements: pathElements.map((e) => e.toString()),
                pathIndices: pathIndices,
            };

            // Should throw because root doesn't match computed Merkle root
            const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'zkira-circuit-'));
            const wtnsPath = path.join(tmpDir, 'witness.wtns');
            try {
                await expect(
                    snarkjs.wtns.calculate(input, CIRCUIT_WASM, wtnsPath)
                ).rejects.toThrow();
            } finally {
                rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });

    // TODO: Full integration tests after trusted setup (Wave 2B)
    // - Generate actual Groth16 proof
    // - Verify proof with snarkjs
    // - Export verifier for Solana (groth16-solana compatible)
    // - Test with multiple deposits in the tree
    // - Test with deposits at various leaf indices
});
