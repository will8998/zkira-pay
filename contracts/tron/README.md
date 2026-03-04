# ZKIRA Tornado Cash Fork - Tron Deployment

This directory contains the TronBox deployment infrastructure for the compliant Tornado Cash fork on Tron.

## Files Created

### Core Contracts
- `Verifier.sol` — Groth16 verifier from Tornado Cash's trusted setup ceremony
- `HasherFactory.sol` — Factory to deploy MiMCSponge hasher bytecode

### Configuration
- `tronbox-config.js` — TronBox configuration for all networks (development, shasta, nile, mainnet)

### Migrations
- `migrations/1_deploy_sanctions_oracle.js` — Deploy SanctionsOracle
- `migrations/2_deploy_verifier.js` — Deploy Verifier
- `migrations/3_deploy_hasher.js` — Deploy Hasher (MiMCSponge) via factory
- `migrations/4_deploy_pools.js` — Deploy multiple USDTPool instances per denomination

### Scripts
- `scripts/deploy-all.sh` — One-command deployment script

## Deployment

### Prerequisites
1. Install TronBox: `npm install -g tronbox`
2. Set private key: `export PRIVATE_KEY=your_private_key`

### Quick Deployment
```bash
# Deploy to Shasta testnet
cd contracts/tron
PRIVATE_KEY=your_private_key ./scripts/deploy-all.sh shasta

# Deploy to mainnet
PRIVATE_KEY=your_private_key ./scripts/deploy-all.sh mainnet
```

### Manual Deployment
```bash
cd contracts/tron
tronbox migrate --network shasta --reset
```

## Network Configuration

| Network | RPC | Network ID |
|---------|-----|------------|
| Development | http://127.0.0.1:9090 | * |
| Shasta | https://api.shasta.trongrid.io | 2 |
| Nile | https://nile.trongrid.io | 3 |
| Mainnet | https://api.trongrid.io | 1 |

## Pool Configuration

### Denominations (USDT 6-decimal format)
- 10 USDT = 10,000,000
- 100 USDT = 100,000,000  
- 1000 USDT = 1,000,000,000

### Pool Instances
- **Testnet**: 3 pools per denomination
- **Mainnet**: Should be increased to 10-20 pools per denomination for redundancy

### Constants
- USDT Address: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`
- Merkle Tree Height: 20 levels (~1M deposits per pool)

## Important Notes

### Verifier Contract
✅ **COMPLETE**: Uses exact Tornado Cash Verifier.sol with trusted setup verification key
- Implements correct `IVerifier` interface
- Uses BN254 curve precompiles (supported on Tron TVM)
- Matches Tornado Cash's trusted setup ceremony

### Hasher Contract  
⚠️ **TODO**: Replace placeholder with actual MiMCSponge bytecode
- Current: HasherFactory deploys placeholder bytecode
- Required: Actual MiMCSponge bytecode from Tornado Cash
- Source: https://github.com/tornadocash/tornado-core/blob/master/src/mimcsponge_gencontract.js

### Security Considerations
1. **Private Key**: Never commit private keys to version control
2. **Mainnet Deployment**: Test thoroughly on Shasta before mainnet
3. **Hasher Bytecode**: Must use exact Tornado Cash MiMCSponge for proof compatibility
4. **Pool Redundancy**: Deploy 10-20 pools per denomination on mainnet

## Verification

After deployment:
1. Verify contracts on TronScan
2. Test deposit/withdraw functionality
3. Verify proof generation/verification works
4. Check compliance features (sanctions oracle, blacklists)

## Troubleshooting

### Common Issues
- **"PRIVATE_KEY env var required"**: Set the environment variable
- **"Hasher address not found"**: Migration 3 failed, check HasherFactory deployment
- **Proof verification fails**: Ensure Verifier uses correct trusted setup key

### Migration Order
Migrations must run in order:
1. SanctionsOracle (no dependencies)
2. Verifier (no dependencies)  
3. Hasher (no dependencies)
4. USDTPool (depends on all above)