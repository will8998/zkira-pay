#!/usr/bin/env node

const { TronWeb } = require('tronweb');
const solc = require('solc');
const fs = require('fs');
const path = require('path');

// Network configuration
const NETWORK_CONFIG = {
  fullHost: 'https://nile.trongrid.io',
  privateKey: process.env.TRON_PRIVATE_KEY || 'B72177AFA23870288CBD90AEC9A56A85CC166BDFA152A71317B8FE411D43826B',
  deployer: 'TGa7EfpbeeoBv7oTWNGRDotHorBAS8S1W9',
  usdtToken: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf', // Nile test USDT from nileex.io faucet
  chainId: '3'  // Nile is chain 3
};

// Pool denominations (USDT 6-decimal format)
const DENOMINATIONS = {
  '10_USDT': 10_000_000,
  '100_USDT': 100_000_000,
  '1000_USDT': 1_000_000_000,
  '10000_USDT': 10_000_000_000,
  '100000_USDT': 100_000_000_000,
  '1000000_USDT': 1_000_000_000_000
};

// Initialize TronWeb
const tronWeb = new TronWeb({
  fullHost: NETWORK_CONFIG.fullHost,
  privateKey: NETWORK_CONFIG.privateKey
});

console.log('🚀 Starting Tron Nile deployment...');
console.log(`Deployer: ${NETWORK_CONFIG.deployer}`);
console.log(`Network: ${NETWORK_CONFIG.fullHost}`);

// Helper function to read contract source
function readContract(contractPath) {
  const fullPath = path.join(__dirname, contractPath);
  return fs.readFileSync(fullPath, 'utf8');
}

// Solidity import resolver
function findImports(importPath) {
  try {
    let resolvedPath;
    if (importPath.startsWith('./')) {
      resolvedPath = path.join(__dirname, importPath);
    } else if (importPath.startsWith('./interfaces/')) {
      resolvedPath = path.join(__dirname, importPath);
    } else {
      resolvedPath = path.join(__dirname, importPath);
    }
    
    const content = fs.readFileSync(resolvedPath, 'utf8');
    return { contents: content };
  } catch (error) {
    console.error(`Failed to resolve import: ${importPath}`, error.message);
    return { error: `File not found: ${importPath}` };
  }
}

// Compile Solidity contract
function compileContract(contractName, contractPath) {
  console.log(`📝 Compiling ${contractName}...`);
  
  const source = readContract(contractPath);
  
  const input = {
    language: 'Solidity',
    sources: {
      [contractName]: {
        content: source
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      },
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  
  if (output.errors) {
    const errors = output.errors.filter(error => error.severity === 'error');
    if (errors.length > 0) {
      console.error(`❌ Compilation errors for ${contractName}:`, errors);
      throw new Error(`Compilation failed for ${contractName}`);
    }
    // Show warnings
    const warnings = output.errors.filter(error => error.severity === 'warning');
    if (warnings.length > 0) {
      console.warn(`⚠️  Compilation warnings for ${contractName}:`, warnings.map(w => w.message));
    }
  }

  const contract = output.contracts[contractName][contractName];
  if (!contract) {
    throw new Error(`Contract ${contractName} not found in compilation output`);
  }

  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object
  };
}

// Check account balance
async function checkBalance() {
  try {
    console.log('\n=== Checking Account Balance ===');
    const balance = await tronWeb.trx.getBalance(NETWORK_CONFIG.deployer);
    const balanceTRX = tronWeb.fromSun(balance);
    console.log(`Account balance: ${balanceTRX} TRX`);
    
    if (balanceTRX < 100) {
      throw new Error(`Insufficient balance: ${balanceTRX} TRX. Need at least 100 TRX for deployment.`);
    }
    
    console.log('✅ Balance check passed');
    return balanceTRX;
  } catch (error) {
    console.error('❌ Balance check failed:', error.message);
    throw error;
  }
}

// Estimate energy for deployment
async function estimateEnergy(contractName, bytecode) {
  try {
    // Rough estimation based on bytecode size
    const bytecodeSize = bytecode.length / 2; // Convert hex to bytes
    const estimatedEnergy = Math.ceil(bytecodeSize * 100); // Rough estimate
    console.log(`📊 Estimated energy for ${contractName}: ${estimatedEnergy.toLocaleString()}`);
    return estimatedEnergy;
  } catch (error) {
    console.warn(`⚠️  Could not estimate energy for ${contractName}:`, error.message);
    return 0;
  }
}

// Deploy contract helper with improved error handling
async function deployContract(contractName, abi, bytecode, parameters = []) {
  console.log(`🚀 Deploying ${contractName}...`);
  
  try {
    // Estimate energy
    await estimateEnergy(contractName, bytecode);
    
    const contract = await tronWeb.contract().new({
      abi: abi,
      bytecode: bytecode,
      feeLimit: 3_000_000_000, // 3000 TRX fee limit (increased for Nile)
      callValue: 0,
      parameters: parameters
    });

    const address = contract.address;
    console.log(`✅ ${contractName} deployed at: ${address}`);
    
    // Wait for transaction confirmation and bandwidth recovery (increased for Nile)
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    return { address, contract };
  } catch (error) {
    console.error(`❌ Failed to deploy ${contractName}:`, error.message);
    throw error;
  }
}

// Deploy MiMCSponge hasher via HasherFactory with improved retry logic
async function deployHasher(hasherFactory) {
  console.log('📝 Reading MiMCSponge bytecode...');
  
  const bytecodeFile = path.join(__dirname, 'mimcsponge-bytecode.txt');
  let bytecode = fs.readFileSync(bytecodeFile, 'utf8').trim();
  
  // Remove 0x prefix if present
  if (bytecode.startsWith('0x')) {
    bytecode = bytecode.slice(2);
  }
  
  console.log(`🚀 Deploying MiMCSponge hasher via factory...`);
  console.log(`Bytecode length: ${bytecode.length} characters`);
  
  // Retry logic with increasing delays
  const maxAttempts = 3;
  const baseDelay = 5000;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxAttempts}...`);
      
      const result = await hasherFactory.deployHasher(`0x${bytecode}`).send({
        feeLimit: 3_000_000_000, // 3000 TRX for hasher deployment (increased for Nile)
        callValue: 0
      });
      
      console.log(`Transaction hash: ${result}`);
      
      // Wait for transaction confirmation with increased delay
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Get transaction info to extract hasher address
      const txInfo = await tronWeb.trx.getTransactionInfo(result);
      
      console.log('Transaction info:', JSON.stringify(txInfo, null, 2));
      
      // Check if transaction was successful
      if (txInfo.result !== 'SUCCESS') {
        throw new Error(`HasherFactory transaction failed: ${txInfo.result || 'Unknown error'}`);
      }
      
      // Try to parse event logs first
      if (txInfo.log && txInfo.log.length > 0) {
        for (const log of txInfo.log) {
          // Look for HasherDeployed event
          if (log.topics && log.topics.length > 0) {
            try {
              // Parse the event data to extract hasher address
              const eventData = log.data;
              if (eventData && eventData.length >= 40) {
                const addressHex = eventData.slice(-40);
                const hasherAddress = tronWeb.address.fromHex('41' + addressHex);
                console.log(`✅ MiMCSponge hasher deployed at: ${hasherAddress} (from event log)`);
                return hasherAddress;
              }
            } catch (parseError) {
              console.warn('Could not parse event log:', parseError.message);
            }
          }
        }
      }
      
      // Fallback: try to get the return value from the transaction
      if (txInfo.contractResult && txInfo.contractResult.length > 0) {
        const contractResult = txInfo.contractResult[0];
        console.log('Contract result:', contractResult);
        
        // Parse the return value - should be an address (32 bytes)
        if (contractResult && contractResult.length >= 40) {
          // Take the last 40 characters (20 bytes) as the address
          const addressHex = contractResult.slice(-40);
          const hasherAddress = tronWeb.address.fromHex('41' + addressHex);
          console.log(`✅ MiMCSponge hasher deployed at: ${hasherAddress} (from contract result)`);
          return hasherAddress;
        }
      }
      
      // If we can't extract the address, throw an error to trigger retry
      throw new Error('Could not extract hasher address from transaction result');
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxAttempts) {
        console.error('❌ All attempts failed to deploy MiMCSponge hasher');
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Main deployment function
async function main() {
  const deploymentResult = {
    network: 'nile',
    chainId: NETWORK_CONFIG.chainId,
    deployer: NETWORK_CONFIG.deployer,
    usdtToken: NETWORK_CONFIG.usdtToken,
    protocolFeeBps: 100,
    treasury: NETWORK_CONFIG.deployer,
    pools: {}
  };

  let poolSuccessCount = 0;
  let poolFailureCount = 0;

  try {
    // Check balance first
    await checkBalance();

    // 1. Deploy SanctionsOracle
    console.log('\n=== 1. Deploying SanctionsOracle ===');
    try {
      const sanctionsOracleCompiled = compileContract('SanctionsOracle', 'SanctionsOracle.sol');
      const sanctionsOracleDeployment = await deployContract(
        'SanctionsOracle',
        sanctionsOracleCompiled.abi,
        sanctionsOracleCompiled.bytecode
      );
      deploymentResult.sanctionsOracle = sanctionsOracleDeployment.address;
    } catch (error) {
      console.error('❌ SanctionsOracle deployment failed:', error.message);
      throw error;
    }

    // 2. Deploy Verifier
    console.log('\n=== 2. Deploying Verifier ===');
    try {
      const verifierCompiled = compileContract('Verifier', 'Verifier.sol');
      const verifierDeployment = await deployContract(
        'Verifier',
        verifierCompiled.abi,
        verifierCompiled.bytecode
      );
      deploymentResult.verifier = verifierDeployment.address;
    } catch (error) {
      console.error('❌ Verifier deployment failed:', error.message);
      throw error;
    }

    // 3. Deploy HasherFactory and MiMCSponge hasher
    console.log('\n=== 3. Deploying HasherFactory ===');
    let hasherFactoryDeployment;
    try {
      const hasherFactoryCompiled = compileContract('HasherFactory', 'HasherFactory.sol');
      hasherFactoryDeployment = await deployContract(
        'HasherFactory',
        hasherFactoryCompiled.abi,
        hasherFactoryCompiled.bytecode
      );
      deploymentResult.hasherFactory = hasherFactoryDeployment.address;
    } catch (error) {
      console.error('❌ HasherFactory deployment failed:', error.message);
      throw error;
    }

    console.log('\n=== 4. Deploying MiMCSponge Hasher ===');
    try {
      const hasherAddress = await deployHasher(hasherFactoryDeployment.contract);
      deploymentResult.hasher = hasherAddress;
    } catch (error) {
      console.error('❌ MiMCSponge hasher deployment failed:', error.message);
      throw error;
    }

    // 4. Deploy USDTPool instances
    console.log('\n=== 5. Deploying USDTPool instances ===');
    const usdtPoolCompiled = compileContract('USDTPool', 'USDTPool.sol');

    for (const [denominationName, denominationValue] of Object.entries(DENOMINATIONS)) {
      console.log(`\n--- Deploying ${denominationName} pool ---`);
      
      try {
        const poolDeployment = await deployContract(
          `USDTPool_${denominationName}`,
          usdtPoolCompiled.abi,
          usdtPoolCompiled.bytecode,
          [
            deploymentResult.verifier,        // IVerifier _verifier
            deploymentResult.hasher,          // IHasher _hasher
            denominationValue,                // uint256 _denomination
            20,                              // uint32 _merkleTreeHeight
            NETWORK_CONFIG.usdtToken,        // IUSDT _token
            deploymentResult.sanctionsOracle, // ISanctionsOracle _sanctionsOracle
            100,                             // uint256 _protocolFeeBps (1%)
            NETWORK_CONFIG.deployer          // address _treasury
          ]
        );
        
        deploymentResult.pools[denominationName] = poolDeployment.address;
        poolSuccessCount++;
        console.log(`✅ ${denominationName} pool deployed successfully`);
      } catch (error) {
        console.error(`❌ Failed to deploy ${denominationName} pool:`, error.message);
        poolFailureCount++;
        // Continue with remaining pools instead of aborting
      }
    }

    // 5. Save deployment results
    console.log('\n=== 6. Saving deployment results ===');
    const outputPath = path.join(__dirname, 'deployment-nile.json');
    fs.writeFileSync(outputPath, JSON.stringify(deploymentResult, null, 2));
    console.log(`✅ Deployment results saved to: ${outputPath}`);

    // 6. Display summary
    console.log('\n🎉 DEPLOYMENT COMPLETE! 🎉');
    console.log('\n📋 Deployment Summary:');
    console.log(`Network: Tron Nile (${deploymentResult.chainId})`);
    console.log(`Deployer: ${deploymentResult.deployer}`);
    console.log(`SanctionsOracle: ${deploymentResult.sanctionsOracle}`);
    console.log(`Verifier: ${deploymentResult.verifier}`);
    console.log(`HasherFactory: ${deploymentResult.hasherFactory}`);
    console.log(`MiMCSponge Hasher: ${deploymentResult.hasher}`);
    console.log(`USDT Token: ${deploymentResult.usdtToken}`);
    console.log(`Protocol Fee: ${deploymentResult.protocolFeeBps} bps`);
    console.log(`Treasury: ${deploymentResult.treasury}`);
    console.log('\n💰 Pool Deployment Results:');
    console.log(`✅ Successful: ${poolSuccessCount}/${Object.keys(DENOMINATIONS).length}`);
    console.log(`❌ Failed: ${poolFailureCount}/${Object.keys(DENOMINATIONS).length}`);
    console.log('\n📍 Pool Addresses:');
    for (const [denomination, address] of Object.entries(deploymentResult.pools)) {
      console.log(`  ${denomination}: ${address}`);
    }

    if (poolFailureCount > 0) {
      console.warn(`\n⚠️  Warning: ${poolFailureCount} pool(s) failed to deploy. Check logs above for details.`);
    }

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main };