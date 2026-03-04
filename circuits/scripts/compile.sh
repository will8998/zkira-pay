#!/bin/bash
set -e

CIRCUIT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$CIRCUIT_DIR/build"

echo "=== Compiling withdraw circuit ==="
mkdir -p "$BUILD_DIR"

# Install circom deps if needed
if [ ! -d "$CIRCUIT_DIR/node_modules" ]; then
    echo "Installing circuit dependencies..."
    cd "$CIRCUIT_DIR" && pnpm install
fi

# Check circom is installed
if ! command -v circom &> /dev/null; then
    echo "ERROR: circom not found. Install with: cargo install circom"
    echo "  Requires Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Compile circuit
circom "$CIRCUIT_DIR/withdraw.circom" \
    --r1cs \
    --wasm \
    --sym \
    -o "$BUILD_DIR" \
    -l "$CIRCUIT_DIR/node_modules"

echo "=== Circuit compiled ==="
echo "R1CS: $BUILD_DIR/withdraw.r1cs"
echo "WASM: $BUILD_DIR/withdraw_js/withdraw.wasm"
echo "Sym:  $BUILD_DIR/withdraw.sym"

# Print circuit info
if command -v snarkjs &> /dev/null || [ -f "$CIRCUIT_DIR/node_modules/.bin/snarkjs" ]; then
    echo ""
    echo "=== Circuit info ==="
    npx snarkjs r1cs info "$BUILD_DIR/withdraw.r1cs"
fi
