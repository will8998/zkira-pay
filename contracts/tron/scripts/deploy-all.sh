#!/bin/bash
set -e

NETWORK=${1:-shasta}

echo "=== Deploying ZKIRA Tornado to $NETWORK ==="

# Check prerequisites
if [ -z "$PRIVATE_KEY" ]; then
  echo "ERROR: PRIVATE_KEY env var required"
  echo "Usage: PRIVATE_KEY=your_private_key ./deploy-all.sh [network]"
  echo "Networks: development, shasta, nile, mainnet"
  exit 1
fi

# Install tronbox if not present
if ! command -v tronbox &> /dev/null; then
  echo "Installing TronBox..."
  npm install -g tronbox
fi

# Change to contracts directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "Working directory: $(pwd)"
echo "Network: $NETWORK"

# Validate network
case $NETWORK in
  development|shasta|nile|mainnet)
    echo "Deploying to $NETWORK network..."
    ;;
  *)
    echo "ERROR: Invalid network '$NETWORK'"
    echo "Valid networks: development, shasta, nile, mainnet"
    exit 1
    ;;
esac

# Run migrations
echo "Running TronBox migrations..."
tronbox migrate --network $NETWORK --reset

echo ""
echo "=== Deployment complete ==="
echo "Network: $NETWORK"
echo ""
echo "Next steps:"
echo "1. Verify contracts on TronScan"
echo "2. Update frontend with deployed addresses"
echo "3. Test deposit/withdraw functionality"
echo "4. For mainnet: Replace HasherFactory placeholder with actual MiMCSponge bytecode"