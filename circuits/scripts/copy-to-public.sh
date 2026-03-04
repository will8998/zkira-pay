#!/bin/bash
set -e

# Script to copy circuit artifacts to Next.js public directory
# Run from repo root or circuits/ directory

# Determine the repo root
if [ -f "circuits/scripts/copy-to-public.sh" ]; then
  REPO_ROOT="."
elif [ -f "scripts/copy-to-public.sh" ]; then
  REPO_ROOT=".."
else
  echo "Error: Could not determine repo root. Please run this script from the repo root or circuits/ directory."
  exit 1
fi

# Define paths
CIRCUITS_BUILD="${REPO_ROOT}/circuits/build"
PUBLIC_CIRCUITS="${REPO_ROOT}/apps/pay/public/circuits"
WASM_FILE="${CIRCUITS_BUILD}/withdraw_js/withdraw.wasm"
ZKEY_FILE="${CIRCUITS_BUILD}/withdraw_final.zkey"
VKEY_FILE="${CIRCUITS_BUILD}/verification_key.json"

# Create public circuits directory if it doesn't exist
mkdir -p "${PUBLIC_CIRCUITS}"
echo "✓ Created/verified ${PUBLIC_CIRCUITS} directory"

# Check for WASM file
if [ ! -f "${WASM_FILE}" ]; then
  echo "Error: ${WASM_FILE} not found"
  echo "Please run 'pnpm run compile' in the circuits/ directory first"
  exit 1
fi
echo "✓ Found WASM file: ${WASM_FILE}"

# Check for zkey file
if [ ! -f "${ZKEY_FILE}" ]; then
  echo "Error: ${ZKEY_FILE} not found"
  echo "Please run 'pnpm run setup' in the circuits/ directory first"
  exit 1
fi
echo "✓ Found zkey file: ${ZKEY_FILE}"

# Check for verification key file
if [ ! -f "${VKEY_FILE}" ]; then
  echo "Warning: ${VKEY_FILE} not found (optional)"
else
  echo "✓ Found verification key file: ${VKEY_FILE}"
fi

# Copy files
echo ""
echo "Copying circuit artifacts..."
cp "${WASM_FILE}" "${PUBLIC_CIRCUITS}/withdraw.wasm"
cp "${ZKEY_FILE}" "${PUBLIC_CIRCUITS}/withdraw_final.zkey"
if [ -f "${VKEY_FILE}" ]; then
  cp "${VKEY_FILE}" "${PUBLIC_CIRCUITS}/verification_key.json"
fi

# Print file sizes and success message
echo ""
echo "✓ Successfully copied circuit artifacts to ${PUBLIC_CIRCUITS}"
echo ""
echo "File sizes:"
ls -lh "${PUBLIC_CIRCUITS}/" | tail -n +2 | awk '{print "  " $9 ": " $5}'
echo ""
echo "Ready for browser proof generation!"
