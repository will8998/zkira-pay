#!/usr/bin/env node

const { TronWeb } = require('tronweb');
const solc = require('solc');
const fs = require('fs');
const path = require('path');

// Network configuration
const NETWORK_CONFIG = {
  fullHost: 'https://api.shasta.trongrid.io',
  privateKey: 'B72177AFA23870288CBD90AEC9A56A85CC166BDFA152A71317B8FE411D43826B',
  deployer: 'TGa7EfpbeeoBv7oTWNGRDotHorBAS8S1W9',
  usdtToken: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs', // Shasta test USDT
  chainId: '2'
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

console.log('🚀 Starting Tron Shasta deployment...');
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

// Deploy contract helper
async function deployContract(contractName, abi, bytecode, parameters = []) {
  console.log(`🚀 Deploying ${contractName}...`);
  
  try {
    const contract = await tronWeb.contract().new({
      abi: abi,
      bytecode: bytecode,
      feeLimit: 1_000_000_000, // 1000 TRX fee limit
      callValue: 0,
      parameters: parameters
    });

    const address = contract.address;
    console.log(`✅ ${contractName} deployed at: ${address}`);
    
    // Wait for transaction confirmation and bandwidth recovery
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    return { address, contract };
  } catch (error) {
    console.error(`❌ Failed to deploy ${contractName}:`, error);
    throw error;
  }
}

// Deploy MiMCSponge hasher via HasherFactory
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
  
  try {
    const result = await hasherFactory.deployHasher(`0x${bytecode}`).send({
      feeLimit: 1_000_000_000, // 1000 TRX for hasher deployment
      callValue: 0
    });
    
    console.log(`Transaction hash: ${result}`);
    
    // Wait for transaction confirmation
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get transaction info to extract hasher address
    const txInfo = await tronWeb.trx.getTransactionInfo(result);
    
    console.log('Full transaction info:', JSON.stringify(txInfo, null, 2));
    
    // Check if transaction was successful
    if (txInfo.result !== 'SUCCESS') {
      throw new Error(`HasherFactory transaction failed: ${txInfo.result || 'Unknown error'}`);
    }
    
    // Try to get the return value from the transaction
    // The deployHasher function should return the deployed address
    if (txInfo.contractResult && txInfo.contractResult.length > 0) {
      const contractResult = txInfo.contractResult[0];
      console.log('Contract result:', contractResult);
      
      // Parse the return value - should be an address (32 bytes)
      if (contractResult && contractResult.length >= 40) {
        // Take the last 40 characters (20 bytes) as the address
        const addressHex = contractResult.slice(-40);
        const hasherAddress = tronWeb.address.fromHex('41' + addressHex);
        console.log(`✅ MiMCSponge hasher deployed at: ${hasherAddress}`);
        return hasherAddress;
      }
    }
    
    // Alternative: try to call the HasherFactory to get recent deployments
    // This is a fallback if we can't parse the transaction result
    console.log('⚠️  Could not parse transaction result, trying alternative method...');
    
    // For now, let's manually construct an address based on the pattern
    // This is not ideal but may work as a temporary solution
    throw new Error('Could not extract hasher address from transaction result. Please check the transaction manually.');
    
  } catch (error) {
    console.error('❌ Failed to deploy MiMCSponge hasher:', error);
    throw error;
  }
}

// Main deployment function
async function main() {
  const deploymentResult = {
    network: 'shasta',
    chainId: NETWORK_CONFIG.chainId,
    deployer: NETWORK_CONFIG.deployer,
    usdtToken: NETWORK_CONFIG.usdtToken,
    pools: {}
  };

  try {
    // 1. Deploy SanctionsOracle
    console.log('\n=== 1. Deploying SanctionsOracle ===');
    const sanctionsOracleCompiled = compileContract('SanctionsOracle', 'SanctionsOracle.sol');
    const sanctionsOracleDeployment = await deployContract(
      'SanctionsOracle',
      sanctionsOracleCompiled.abi,
      sanctionsOracleCompiled.bytecode
    );
    deploymentResult.sanctionsOracle = sanctionsOracleDeployment.address;

    // 2. Deploy Verifier
    console.log('\n=== 2. Deploying Verifier ===');
    const verifierCompiled = compileContract('Verifier', 'Verifier.sol');
    const verifierDeployment = await deployContract(
      'Verifier',
      verifierCompiled.abi,
      verifierCompiled.bytecode
    );
    deploymentResult.verifier = verifierDeployment.address;

    // 3. Deploy HasherFactory and MiMCSponge hasher
    console.log('\n=== 3. Deploying HasherFactory ===');
    const hasherFactoryCompiled = compileContract('HasherFactory', 'HasherFactory.sol');
    const hasherFactoryDeployment = await deployContract(
      'HasherFactory',
      hasherFactoryCompiled.abi,
      hasherFactoryCompiled.bytecode
    );
    deploymentResult.hasherFactory = hasherFactoryDeployment.address;

    console.log('\n=== 4. Deploying MiMCSponge Hasher ===');
    const hasherAddress = await deployHasher(hasherFactoryDeployment.contract);
    deploymentResult.hasher = hasherAddress;

    // 4. Deploy USDTPool instances
    console.log('\n=== 5. Deploying USDTPool instances ===');
    const usdtPoolCompiled = compileContract('USDTPool', 'USDTPool.sol');

    for (const [denominationName, denominationValue] of Object.entries(DENOMINATIONS)) {
      console.log(`\n--- Deploying ${denominationName} pool ---`);
      
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
    }

    // 5. Save deployment results
    console.log('\n=== 6. Saving deployment results ===');
    const outputPath = path.join(__dirname, 'deployment-shasta.json');
    fs.writeFileSync(outputPath, JSON.stringify(deploymentResult, null, 2));
    console.log(`✅ Deployment results saved to: ${outputPath}`);

    // 6. Display summary
    console.log('\n🎉 DEPLOYMENT COMPLETE! 🎉');
    console.log('\n📋 Deployment Summary:');
    console.log(`Network: Tron Shasta (${deploymentResult.chainId})`);
    console.log(`Deployer: ${deploymentResult.deployer}`);
    console.log(`SanctionsOracle: ${deploymentResult.sanctionsOracle}`);
    console.log(`Verifier: ${deploymentResult.verifier}`);
    console.log(`HasherFactory: ${deploymentResult.hasherFactory}`);
    console.log(`MiMCSponge Hasher: ${deploymentResult.hasher}`);
    console.log(`USDT Token: ${deploymentResult.usdtToken}`);
    console.log('\n💰 Pool Addresses:');
    for (const [denomination, address] of Object.entries(deploymentResult.pools)) {
      console.log(`  ${denomination}: ${address}`);
    }

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
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