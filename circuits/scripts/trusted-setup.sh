#!/bin/bash
set -e

CIRCUIT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$CIRCUIT_DIR/build"
R1CS="$BUILD_DIR/withdraw.r1cs"

echo "=== Trusted Setup for Withdraw Circuit ==="

# Verify R1CS exists
if [ ! -f "$R1CS" ]; then
    echo "ERROR: R1CS file not found. Run compile.sh first."
    exit 1
fi

# Phase 1: Powers of Tau
echo ""
echo "=== Phase 1: Powers of Tau ==="
echo "Using power 14 (supports up to 16384 constraints, circuit has ~11354)"

npx snarkjs powersoftau new bn128 14 "$BUILD_DIR/pot14_0000.ptau" -v
npx snarkjs powersoftau contribute "$BUILD_DIR/pot14_0000.ptau" "$BUILD_DIR/pot14_0001.ptau" \
    --name="ZKIRA First contribution" -v -e="$(head -c 64 /dev/urandom | xxd -p -c 128)"

# Phase 1: Prepare
echo ""
echo "=== Phase 1: Prepare Phase 2 ==="
npx snarkjs powersoftau prepare phase2 "$BUILD_DIR/pot14_0001.ptau" "$BUILD_DIR/pot14_final.ptau" -v

# Phase 2: Circuit-specific setup
echo ""
echo "=== Phase 2: Circuit-Specific Setup ==="
npx snarkjs groth16 setup "$R1CS" "$BUILD_DIR/pot14_final.ptau" "$BUILD_DIR/withdraw_0000.zkey"

# Phase 2: Contribute
npx snarkjs zkey contribute "$BUILD_DIR/withdraw_0000.zkey" "$BUILD_DIR/withdraw_final.zkey" \
    --name="ZKIRA Circuit contribution" -v -e="$(head -c 64 /dev/urandom | xxd -p -c 128)"

# Export verification key
echo ""
echo "=== Exporting Verification Key ==="
npx snarkjs zkey export verificationkey "$BUILD_DIR/withdraw_final.zkey" "$BUILD_DIR/verification_key.json"

# Verify the zkey
echo ""
echo "=== Verifying Setup ==="
npx snarkjs zkey verify "$R1CS" "$BUILD_DIR/pot14_final.ptau" "$BUILD_DIR/withdraw_final.zkey"

echo ""
echo "=== Trusted Setup Complete ==="
echo "Proving key: $BUILD_DIR/withdraw_final.zkey"
echo "Verification key: $BUILD_DIR/verification_key.json"
echo ""
echo "Next: Run extract-vk-rust.ts to generate Rust verifying key constants"