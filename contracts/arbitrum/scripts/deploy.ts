import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// === Mainnet token addresses (Arbitrum One) ===
const MAINNET_TOKENS = {
  USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
};

// === Testnet token addresses (Arbitrum Sepolia — Aave V3 faucet tokens) ===
const TESTNET_TOKENS = {
  USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Aave faucet USDC (6 decimals)
  DAI: "0x9bc8388dd439fa3365b1f78a81242adbb4677759",  // Aave faucet DAI (18 decimals)
  USDT: "0x93d67359a0f6f117150a70fdde6bb96782497248", // Aave faucet USDT (6 decimals)
};

const CHAINALYSIS_ORACLE = "0x40C57923924B5c5c5455c48D93317139ADDaC8fb";
const MERKLE_TREE_HEIGHT = 20;

// Fee configuration
const PROTOCOL_FEE_BPS = 100; // 1%

interface TokenConfig {
  name: string;
  address: string;
  decimals: number;
  hasBlacklistCheck: boolean;
  denominations: Record<string, bigint>;
}

function getTokens(isMainnet: boolean): TokenConfig[] {
  const addrs = isMainnet ? MAINNET_TOKENS : TESTNET_TOKENS;

  return [
    {
      name: "USDC",
      address: addrs.USDC,
      decimals: 6,
      hasBlacklistCheck: isMainnet,
      denominations: {
        "1_USDC": 1_000_000n,
        "5_USDC": 5_000_000n,
        "10_USDC": 10_000_000n,
        "25_USDC": 25_000_000n,
        "50_USDC": 50_000_000n,
        "100_USDC": 100_000_000n,
        "250_USDC": 250_000_000n,
        "500_USDC": 500_000_000n,
        "1000_USDC": 1_000_000_000n,
        "2500_USDC": 2_500_000_000n,
        "5000_USDC": 5_000_000_000n,
        "10000_USDC": 10_000_000_000n,
        "25000_USDC": 25_000_000_000n,
        "50000_USDC": 50_000_000_000n,
        "100000_USDC": 100_000_000_000n,
        "1000000_USDC": 1_000_000_000_000n,
      },
    },
    {
      name: "USDT",
      address: addrs.USDT,
      decimals: 6,
      hasBlacklistCheck: false,
      denominations: {
        "1_USDT": 1_000_000n,
        "5_USDT": 5_000_000n,
        "10_USDT": 10_000_000n,
        "25_USDT": 25_000_000n,
        "50_USDT": 50_000_000n,
        "100_USDT": 100_000_000n,
        "250_USDT": 250_000_000n,
        "500_USDT": 500_000_000n,
        "1000_USDT": 1_000_000_000n,
        "2500_USDT": 2_500_000_000n,
        "5000_USDT": 5_000_000_000n,
        "10000_USDT": 10_000_000_000n,
        "25000_USDT": 25_000_000_000n,
        "50000_USDT": 50_000_000_000n,
        "100000_USDT": 100_000_000_000n,
        "1000000_USDT": 1_000_000_000_000n,
      },
    },
    {
      name: "DAI",
      address: addrs.DAI,
      decimals: 18,
      hasBlacklistCheck: false,
      denominations: {
        "1_DAI": 1_000_000_000_000_000_000n,
        "5_DAI": 5_000_000_000_000_000_000n,
        "10_DAI": 10_000_000_000_000_000_000n,
        "25_DAI": 25_000_000_000_000_000_000n,
        "50_DAI": 50_000_000_000_000_000_000n,
        "100_DAI": 100_000_000_000_000_000_000n,
        "250_DAI": 250_000_000_000_000_000_000n,
        "500_DAI": 500_000_000_000_000_000_000n,
        "1000_DAI": 1_000_000_000_000_000_000_000n,
        "2500_DAI": 2_500_000_000_000_000_000_000n,
        "5000_DAI": 5_000_000_000_000_000_000_000n,
        "10000_DAI": 10_000_000_000_000_000_000_000n,
        "25000_DAI": 25_000_000_000_000_000_000_000n,
        "50000_DAI": 50_000_000_000_000_000_000_000n,
        "100000_DAI": 100_000_000_000_000_000_000_000n,
        "1000000_DAI": 1_000_000_000_000_000_000_000_000n,
      },
    },
  ];
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const treasury = deployer.address; // Owner is treasury initially

  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Detect network
  const network = await ethers.provider.getNetwork();
  const isMainnet = network.chainId === 42161n;
  const tokens = getTokens(isMainnet);
  console.log(`Network: ${isMainnet ? 'Arbitrum One (mainnet)' : 'Arbitrum Sepolia (testnet)'}`);

  // 1. Deploy SanctionsOracle (or use Chainalysis on mainnet)
  let sanctionsOracleAddress: string;
  if (network.chainId === 42161n) {
    // Mainnet: use Chainalysis oracle
    sanctionsOracleAddress = CHAINALYSIS_ORACLE;
    console.log("Using Chainalysis oracle:", sanctionsOracleAddress);
  } else {
    // Testnet: deploy our own
    const SanctionsOracle = await ethers.getContractFactory("SanctionsOracle");
    const oracle = await SanctionsOracle.deploy();
    await oracle.waitForDeployment();
    sanctionsOracleAddress = await oracle.getAddress();
    console.log("SanctionsOracle deployed:", sanctionsOracleAddress);
  }

  // 2. Deploy Verifier (generated from our MiMC circuit trusted setup)
  const Verifier = await ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("Verifier deployed:", verifierAddress);

  // 3. Deploy Hasher via HasherFactory + MiMCSponge bytecode
  //    The MiMCSponge bytecode is generated by:
  //      import { createCode } from 'circomlibjs/src/mimcsponge_gencontract.js';
  //      createCode('mimcsponge', 220)
  const HasherFactory = await ethers.getContractFactory("HasherFactory");
  const hasherFactory = await HasherFactory.deploy();
  await hasherFactory.waitForDeployment();
  console.log("HasherFactory deployed:", await hasherFactory.getAddress());

  // Read MiMCSponge bytecode from file
  const bytecodeFile = path.join(__dirname, "..", "mimcsponge-bytecode.txt");
  const mimcBytecode = fs.readFileSync(bytecodeFile, "utf-8").trim();
  console.log("MiMCSponge bytecode loaded:", mimcBytecode.length, "chars");

  const deployHasherTx = await hasherFactory.deployHasher(mimcBytecode);
  const receipt = await deployHasherTx.wait();

  // Get hasher address from HasherDeployed event
  let hasherAddress = "";
  if (receipt && receipt.logs) {
    for (const log of receipt.logs) {
      try {
        const parsed = hasherFactory.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed && parsed.name === "HasherDeployed") {
          hasherAddress = parsed.args.hasher;
        }
      } catch {
        // Skip logs that don't match
      }
    }
  }

  if (!hasherAddress) {
    throw new Error("Failed to get hasher address from HasherDeployed event");
  }
  console.log("Hasher (MiMCSponge) deployed:", hasherAddress);

  // 4. Deploy ERC20Pool for each token and denomination
  const deployedPools: Record<string, Record<string, string>> = {};

  for (const token of tokens) {
    deployedPools[token.name] = {};
    console.log(`\n--- Deploying ${token.name} pools ---`);
    
    for (const [denomName, denomination] of Object.entries(token.denominations)) {
      const ERC20Pool = await ethers.getContractFactory("ERC20Pool");
      const pool = await ERC20Pool.deploy(
        verifierAddress,
        hasherAddress,
        denomination,
        MERKLE_TREE_HEIGHT,
        token.address,
        sanctionsOracleAddress,
        PROTOCOL_FEE_BPS,
        treasury,
        token.hasBlacklistCheck
      );
      await pool.waitForDeployment();
      const poolAddress = await pool.getAddress();
      deployedPools[token.name][denomName] = poolAddress;
      console.log(`${denomName}: ${poolAddress}`);
    }
  }

  // Output deployment summary
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  const summary = {
    network: network.chainId.toString(),
    deployer: deployer.address,
    sanctionsOracle: sanctionsOracleAddress,
    verifier: verifierAddress,
    hasher: hasherAddress,
    protocolFeeBps: PROTOCOL_FEE_BPS,
    treasury,
    pools: deployedPools,
  };
  console.log(JSON.stringify(summary, null, 2));

  // Write deployment addresses to a file for easy reference
  const outputFile = path.join(__dirname, "..", `deployment-${network.chainId}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));
  console.log(`\nDeployment info saved to: ${outputFile}`);
  console.log("\nIMPORTANT: Update packages/sdk/src/registry.ts with the pool addresses above.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
