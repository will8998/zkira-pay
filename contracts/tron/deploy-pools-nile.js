#!/usr/bin/env node

/**
 * Deploy only USDTPool contracts to Nile testnet.
 * Uses already-deployed infrastructure from previous run.
 */

const { TronWeb } = require('tronweb');
const solc = require('solc');
const fs = require('fs');
const path = require('path');

// Already deployed infrastructure (run 2)
const DEPLOYED = {
  sanctionsOracle: 'TKKDJ7DsMauhU2KJB3PcwdRox1yZZFFpNN',
  verifier: 'TXtLrbYdAVrUjohYQ1vpKPaAfvGV32QX7N',
  hasherFactory: 'TNAtD1sYBwNPALEUeyHZxVWxoQPCHWN4c3',
  hasher: 'TQVbjEkeKrQVjtPW8K3GhcEx2couaDm7Zx'
};

const NETWORK_CONFIG = {
  fullHost: 'https://nile.trongrid.io',
  privateKey: process.env.TRON_PRIVATE_KEY || 'B72177AFA23870288CBD90AEC9A56A85CC166BDFA152A71317B8FE411D43826B',
  deployer: 'TGa7EfpbeeoBv7oTWNGRDotHorBAS8S1W9',
  usdtToken: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf',
};

const DENOMINATIONS = {
  '10_USDT': 10_000_000,
  '100_USDT': 100_000_000,
  '1000_USDT': 1_000_000_000,
  '10000_USDT': 10_000_000_000,
  '100000_USDT': 100_000_000_000,
  '1000000_USDT': 1_000_000_000_000
};

const tronWeb = new TronWeb({
  fullHost: NETWORK_CONFIG.fullHost,
  privateKey: NETWORK_CONFIG.privateKey
});

function readContract(contractPath) {
  return fs.readFileSync(path.join(__dirname, contractPath), 'utf8');
}

function findImports(importPath) {
  try {
    // Try resolving relative to __dirname (handles ./foo.sol and ./interfaces/foo.sol)
    let resolvedPath = path.resolve(__dirname, importPath);
    if (fs.existsSync(resolvedPath)) {
      return { contents: fs.readFileSync(resolvedPath, 'utf8') };
    }
    // Try node_modules
    resolvedPath = path.join(__dirname, 'node_modules', importPath);
    if (fs.existsSync(resolvedPath)) {
      return { contents: fs.readFileSync(resolvedPath, 'utf8') };
    }
    return { error: `File not found: ${importPath}` };
  } catch (error) {
    return { error: error.message };
  }
}

function compileContract(contractName, fileName) {
  console.log(`📝 Compiling ${contractName}...`);
  const source = readContract(fileName);

  const input = {
    language: 'Solidity',
    sources: { [fileName]: { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
      evmVersion: 'istanbul'
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      throw new Error(`Compilation errors:\n${errors.map(e => e.formattedMessage).join('\n')}`);
    }
  }

  const contract = output.contracts[fileName][contractName];
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object
  };
}

async function waitForTxInfo(txId, maxWaitMs = 60000) {
  const start = Date.now();
  const pollInterval = 3000;
  
  while (Date.now() - start < maxWaitMs) {
    const txInfo = await tronWeb.trx.getTransactionInfo(txId);
    if (txInfo && txInfo.id) {
      return txInfo;
    }
    console.log(`  ⏳ Waiting for confirmation... (${Math.round((Date.now() - start) / 1000)}s)`);
    await new Promise(r => setTimeout(r, pollInterval));
  }
  throw new Error(`Transaction ${txId} not confirmed after ${maxWaitMs / 1000}s`);
}

async function deployContract(contractName, abi, bytecode, constructorArgs = []) {
  console.log(`🚀 Deploying ${contractName}...`);

  const tx = await tronWeb.transactionBuilder.createSmartContract({
    abi,
    bytecode,
    feeLimit: 3_000_000_000,
    callValue: 0,
    parameters: constructorArgs,
    name: contractName,
    ownerAddress: NETWORK_CONFIG.deployer
  });

  const signedTx = await tronWeb.trx.sign(tx);
  const result = await tronWeb.trx.sendRawTransaction(signedTx);

  if (!result.result) {
    throw new Error(`Broadcast failed: ${JSON.stringify(result)}`);
  }

  const txId = result.txid;
  console.log(`  📤 TX: ${txId}`);

  // Poll for confirmation
  const txInfo = await waitForTxInfo(txId);

  if (txInfo.receipt && txInfo.receipt.result === 'SUCCESS') {
    const address = tronWeb.address.fromHex(txInfo.contract_address || tx.contract_address);
    const energyUsed = txInfo.receipt.energy_usage_total || 0;
    const feeTrx = (txInfo.fee || 0) / 1e6;
    console.log(`  ✅ ${contractName} deployed at: ${address} (energy: ${energyUsed}, fee: ${feeTrx} TRX)`);
    return address;
  } else {
    throw new Error(`${contractName} deployment failed: ${JSON.stringify(txInfo.receipt)}`);
  }
}

async function main() {
  console.log('🚀 Deploying USDTPool contracts to Nile...');
  console.log(`Deployer: ${NETWORK_CONFIG.deployer}`);
  console.log(`Using infrastructure:`);
  console.log(`  Verifier: ${DEPLOYED.verifier}`);
  console.log(`  Hasher: ${DEPLOYED.hasher}`);
  console.log(`  SanctionsOracle: ${DEPLOYED.sanctionsOracle}`);
  console.log(`  USDT: ${NETWORK_CONFIG.usdtToken}`);

  // Check balance
  const account = await tronWeb.trx.getAccount(NETWORK_CONFIG.deployer);
  const balance = (account.balance || 0) / 1e6;
  console.log(`\nBalance: ${balance} TRX\n`);

  if (balance < 100) {
    throw new Error(`Insufficient balance: ${balance} TRX. Need at least 100 TRX.`);
  }

  const compiled = compileContract('USDTPool', 'USDTPool.sol');
  const pools = {};
  let successCount = 0;
  let failCount = 0;

  for (const [name, denomination] of Object.entries(DENOMINATIONS)) {
    console.log(`\n--- ${name} (denomination: ${denomination}) ---`);

    try {
      const address = await deployContract(
        `USDTPool_${name}`,
        compiled.abi,
        compiled.bytecode,
        [
          DEPLOYED.verifier,
          DEPLOYED.hasher,
          denomination,
          20,
          NETWORK_CONFIG.usdtToken,
          DEPLOYED.sanctionsOracle,
          100,
          NETWORK_CONFIG.deployer
        ]
      );
      pools[name] = address;
      successCount++;

      // 10s cooldown between pool deployments
      console.log('  ⏳ Cooldown 10s...');
      await new Promise(r => setTimeout(r, 10000));
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      failCount++;
    }
  }

  // Build full deployment result
  const deploymentResult = {
    network: 'nile',
    chainId: '3',
    deployer: NETWORK_CONFIG.deployer,
    deployedAt: new Date().toISOString(),
    ...DEPLOYED,
    usdtToken: NETWORK_CONFIG.usdtToken,
    pools,
    summary: { success: successCount, failed: failCount }
  };

  const outputPath = path.join(__dirname, 'deployment-nile.json');
  fs.writeFileSync(outputPath, JSON.stringify(deploymentResult, null, 2));
  console.log(`\n✅ Saved to: ${outputPath}`);

  console.log('\n=== DEPLOYMENT SUMMARY ===');
  console.log(`SanctionsOracle: ${DEPLOYED.sanctionsOracle}`);
  console.log(`Verifier: ${DEPLOYED.verifier}`);
  console.log(`HasherFactory: ${DEPLOYED.hasherFactory}`);
  console.log(`Hasher: ${DEPLOYED.hasher}`);
  console.log(`USDT Token: ${NETWORK_CONFIG.usdtToken}`);
  for (const [name, addr] of Object.entries(pools)) {
    console.log(`Pool ${name}: ${addr}`);
  }
  console.log(`\nPools deployed: ${successCount}/${Object.keys(DENOMINATIONS).length}`);
  
  const finalAccount = await tronWeb.trx.getAccount(NETWORK_CONFIG.deployer);
  console.log(`Remaining balance: ${(finalAccount.balance || 0) / 1e6} TRX`);
}

main().catch(err => {
  console.error('\n❌ Deployment failed:', err.message);
  process.exit(1);
});
