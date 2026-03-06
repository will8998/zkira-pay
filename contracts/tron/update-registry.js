#!/usr/bin/env node

/**
 * Reads deployment-nile.json and outputs the TypeScript pool entries
 * to paste into packages/sdk/src/registry.ts (POOL_REGISTRY_TESTNET.tron.usdt).
 * 
 * Usage: node update-registry.js
 */

const fs = require('fs');
const path = require('path');

const deploymentFile = path.join(__dirname, 'deployment-nile.json');

if (!fs.existsSync(deploymentFile)) {
  console.error('ERROR: deployment-nile.json not found. Run deploy-nile.js first.');
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

const denomLabels = {
  '10_USDT': { denomination: '10000000', label: '10 USDT' },
  '100_USDT': { denomination: '100000000', label: '100 USDT' },
  '1000_USDT': { denomination: '1000000000', label: '1,000 USDT' },
  '10000_USDT': { denomination: '10000000000', label: '10,000 USDT' },
  '100000_USDT': { denomination: '100000000000', label: '100,000 USDT' },
  '1000000_USDT': { denomination: '1000000000000', label: '1,000,000 USDT' },
};

console.log('\n=== POOL_REGISTRY_TESTNET.tron.usdt entries ===\n');
console.log('    usdt: [');

for (const [poolName, poolAddress] of Object.entries(deployment.pools)) {
  const config = denomLabels[poolName];
  if (!config) {
    console.warn(`  // WARNING: Unknown pool ${poolName}, skipping`);
    continue;
  }
  console.log(`      { address: '${poolAddress}', token: 'usdt', denomination: '${config.denomination}', label: '${config.label}', chain: 'tron' },`);
}

console.log('    ],');

console.log('\n=== Ecosystem config TRON_POOL_ADDRESSES (comma-separated) ===\n');
const addresses = Object.values(deployment.pools).join(',');
console.log(`TRON_POOL_ADDRESSES: "${addresses}"`);

console.log('\n=== Deployment Info ===\n');
console.log(`Network: ${deployment.network}`);
console.log(`Deployer: ${deployment.deployer}`);
console.log(`Verifier: ${deployment.verifier}`);
console.log(`Hasher: ${deployment.hasher}`);
console.log(`SanctionsOracle: ${deployment.sanctionsOracle}`);
console.log(`USDT Token: ${deployment.usdtToken}`);
console.log(`Treasury: ${deployment.treasury}`);
console.log(`Protocol Fee: ${deployment.protocolFeeBps} bps`);
console.log(`Total Pools: ${Object.keys(deployment.pools).length}`);
