const USDTPool = artifacts.require('USDTPool');
const SanctionsOracle = artifacts.require('SanctionsOracle');
const Verifier = artifacts.require('Verifier');
const HasherFactory = artifacts.require('HasherFactory');

// TRC-20 USDT address on Tron
const USDT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const MERKLE_TREE_HEIGHT = 20;

// Protocol fee configuration
const PROTOCOL_FEE_BPS = 100; // 1% protocol fee
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || 'T0000000000000000000000000000000000'; // Set via env

// Denominations in USDT's 6-decimal format
const DENOMINATIONS = {
  '10_USDT': '10000000',      // 10 USDT
  '100_USDT': '100000000',    // 100 USDT
  '1000_USDT': '1000000000',  // 1000 USDT
};

// Number of pool instances per denomination (for redundancy)
// Start with 3 for testnet, expand to 10-20 for mainnet
const POOLS_PER_DENOMINATION = 3;

module.exports = async function (deployer, network) {
  console.log(`Deploying USDTPool instances on ${network}...`);
  
  // Get deployed contract instances
  const sanctionsOracle = await SanctionsOracle.deployed();
  const verifier = await Verifier.deployed();
  
  // Get hasher address from previous migration
  const hasherAddress = HasherFactory.hasherAddress;
  if (!hasherAddress) {
    throw new Error('Hasher address not found. Make sure migration 3 completed successfully.');
  }
  
  console.log(`Using SanctionsOracle: ${sanctionsOracle.address}`);
  console.log(`Using Verifier: ${verifier.address}`);
  console.log(`Using Hasher: ${hasherAddress}`);
  console.log(`Using USDT: ${USDT_ADDRESS}`);
  
  const deployedPools = {};
  
  // Deploy pools for each denomination
  for (const [name, denomination] of Object.entries(DENOMINATIONS)) {
    console.log(`\n=== Deploying ${name} pools ===`);
    deployedPools[name] = [];
    
    for (let i = 0; i < POOLS_PER_DENOMINATION; i++) {
      console.log(`Deploying ${name} pool instance ${i + 1}/${POOLS_PER_DENOMINATION}...`);
      
      // Deploy new USDTPool instance
      await deployer.deploy(
        USDTPool,
        verifier.address,
        hasherAddress,
        denomination,
        MERKLE_TREE_HEIGHT,
        USDT_ADDRESS,
        sanctionsOracle.address,
        PROTOCOL_FEE_BPS,
        TREASURY_ADDRESS,
        { overwrite: false } // Don't overwrite previous instances
      );
      
      // Get the deployed instance
      const pool = await USDTPool.at(USDTPool.address);
      deployedPools[name].push(pool.address);
      
      console.log(`  ${name} #${i + 1}: ${pool.address}`);
    }
  }
  
  // Print summary
  console.log('\n=== Deployment Summary ===');
  console.log(`Network: ${network}`);
  console.log(`SanctionsOracle: ${sanctionsOracle.address}`);
  console.log(`Verifier: ${verifier.address}`);
  console.log(`Hasher: ${hasherAddress}`);
  console.log(`USDT Token: ${USDT_ADDRESS}`);
  console.log(`Protocol Fee: ${PROTOCOL_FEE_BPS} bps (${PROTOCOL_FEE_BPS / 100}%)`);
  console.log(`Treasury: ${TREASURY_ADDRESS}`);
  console.log('\nDeployed Pools:');
  
  for (const [name, addresses] of Object.entries(deployedPools)) {
    console.log(`\n${name}:`);
    addresses.forEach((address, index) => {
      console.log(`  Pool ${index + 1}: ${address}`);
    });
  }
  
  console.log('\n=== Deployment Complete ===');
};