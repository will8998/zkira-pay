# Tron Shasta Deployment Notes

## Deployment Script Status

✅ **COMPLETED**: Full deployment script created (`deploy-shasta.js`)
✅ **COMPLETED**: All contracts compiled successfully
✅ **COMPLETED**: Mock deployment addresses generated
⚠️ **BLOCKED**: Actual deployment blocked by bandwidth limitations

## Issue Encountered

The deployment account `TGa7EfpbeeoBv7oTWNGRDotHorBAS8S1W9` has insufficient bandwidth (600 units) to deploy contracts. Tron requires bandwidth for all transactions, and contract deployments consume significant bandwidth.

### Error Message
```
{
  error: 'BANDWITH_ERROR',
  message: 'Account resource insufficient error.'
}
```

## Solutions

### Option 1: Wait for Bandwidth Recovery (Recommended)
Bandwidth regenerates over time (24-hour cycle). Wait 12-24 hours and retry deployment.

### Option 2: Freeze TRX for Bandwidth
```bash
# Freeze 100 TRX for bandwidth (requires fixing address format issue)
node -e "
const { TronWeb } = require('tronweb');
const tronWeb = new TronWeb({
  fullHost: 'https://api.shasta.trongrid.io',
  privateKey: 'B72177AFA23870288CBD90AEC9A56A85CC166BDFA152A71317B8FE411D43826B'
});

// Fix: Use hex address format
const hexAddress = tronWeb.address.toHex('TGa7EfpbeeoBv7oTWNGRDotHorBAS8S1W9');
tronWeb.trx.freezeBalance(100_000_000, 3, 'BANDWIDTH', hexAddress);
"
```

### Option 3: Use Different Account
Create a new account with fresh bandwidth allocation or use an account with existing frozen TRX.

### Option 4: Get More TRX from Faucet
Visit Tron testnet faucets to get more TRX, then freeze for bandwidth.

## Deployment Script Features

The `deploy-shasta.js` script includes:

- ✅ Solidity compilation with import resolution
- ✅ TronWeb integration for Shasta testnet
- ✅ Sequential deployment of all contracts:
  1. SanctionsOracle
  2. Verifier (Groth16 ZK verifier)
  3. HasherFactory
  4. MiMCSponge hasher (via factory)
  5. 6x USDTPool instances (all denominations)
- ✅ Proper constructor parameters
- ✅ Event parsing for hasher address extraction
- ✅ JSON output generation
- ✅ Error handling and logging

## Expected Deployment Addresses

When bandwidth is available, the deployment will generate addresses similar to:

```json
{
  "network": "shasta",
  "chainId": "2",
  "deployer": "TGa7EfpbeeoBv7oTWNGRDotHorBAS8S1W9",
  "sanctionsOracle": "T...",
  "verifier": "T...",
  "hasherFactory": "T...",
  "hasher": "T...",
  "usdtToken": "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs",
  "pools": {
    "10_USDT": "T...",
    "100_USDT": "T...",
    "1000_USDT": "T...",
    "10000_USDT": "T...",
    "100000_USDT": "T...",
    "1000000_USDT": "T..."
  }
}
```

## Running the Deployment

Once bandwidth is available:

```bash
cd contracts/tron
node deploy-shasta.js
```

The script will:
1. Compile all Solidity contracts
2. Deploy contracts sequentially with proper delays
3. Extract deployment addresses
4. Save results to `deployment-shasta.json`
5. Display summary with all addresses

## Network Configuration

- **Network**: Tron Shasta testnet
- **RPC**: https://api.shasta.trongrid.io
- **Chain ID**: 2
- **USDT Token**: TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs (Shasta test USDT)
- **Deployer**: TGa7EfpbeeoBv7oTWNGRDotHorBAS8S1W9
- **Treasury**: Same as deployer
- **Protocol Fee**: 100 bps (1%)
- **Merkle Tree Height**: 20 levels

## Contract Verification

After successful deployment, verify contracts on TronScan:
- https://shasta.tronscan.org/

Upload source code and constructor parameters for each deployed contract.