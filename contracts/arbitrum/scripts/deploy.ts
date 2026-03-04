import { ethers } from "hardhat";

// Arbitrum addresses
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // Native USDC on Arbitrum
const DAI_ADDRESS = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"; // DAI on Arbitrum
const USDT_ADDRESS = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT (USDT0) on Arbitrum
const CHAINALYSIS_ORACLE = "0x40C57923924B5c5c5455c48D93317139ADDaC8fb";
const MERKLE_TREE_HEIGHT = 20;

// Fee configuration
const PROTOCOL_FEE_BPS = 100; // 1%
const POOLS_PER_DENOMINATION = 3;

interface TokenConfig {
  name: string;
  address: string;
  decimals: number;
  hasBlacklistCheck: boolean;
  denominations: Record<string, bigint>;
}

const TOKENS: TokenConfig[] = [
  {
    name: "USDC",
    address: USDC_ADDRESS,
    decimals: 6,
    hasBlacklistCheck: true, // Circle's isBlacklisted()
    denominations: {
      "10_USDC": 10_000_000n,
      "100_USDC": 100_000_000n,
      "1000_USDC": 1_000_000_000n,
    },
  },
  {
    name: "USDT",
    address: USDT_ADDRESS,
    decimals: 6,
    hasBlacklistCheck: false, // USDT0 uses isBlocked(), different interface - skip
    denominations: {
      "10_USDT": 10_000_000n,
      "100_USDT": 100_000_000n,
      "1000_USDT": 1_000_000_000n,
    },
  },
  {
    name: "DAI",
    address: DAI_ADDRESS,
    decimals: 18,
    hasBlacklistCheck: false, // No blacklist
    denominations: {
      "10_DAI": 10_000_000_000_000_000_000n,      // 10e18
      "100_DAI": 100_000_000_000_000_000_000n,     // 100e18
      "1000_DAI": 1_000_000_000_000_000_000_000n,  // 1000e18
    },
  },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  const treasury = deployer.address; // Owner is treasury initially

  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // 1. Deploy SanctionsOracle (or use Chainalysis on mainnet)
  const network = await ethers.provider.getNetwork();
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

  // 2. Deploy Verifier
  const Verifier = await ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("Verifier deployed:", verifierAddress);

  // 3. Deploy Hasher via HasherFactory
  const HasherFactory = await ethers.getContractFactory("HasherFactory");
  const hasherFactory = await HasherFactory.deploy();
  await hasherFactory.waitForDeployment();
  console.log("HasherFactory deployed:", await hasherFactory.getAddress());

  const deployHasherTx = await hasherFactory.deployHasher();
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
  console.log("Hasher deployed:", hasherAddress);

  // 4. Deploy ERC20Pool for each token and denomination
  const deployedPools: Record<string, Record<string, string[]>> = {};

  for (const token of TOKENS) {
    deployedPools[token.name] = {};
    console.log(`\n--- Deploying ${token.name} pools ---`);
    
    for (const [denomName, denomination] of Object.entries(token.denominations)) {
      deployedPools[token.name][denomName] = [];
      for (let i = 0; i < POOLS_PER_DENOMINATION; i++) {
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
        deployedPools[token.name][denomName].push(poolAddress);
        console.log(`${denomName} pool #${i + 1}: ${poolAddress}`);
      }
    }
  }

  // Output deployment summary
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(JSON.stringify({
    network: network.chainId.toString(),
    deployer: deployer.address,
    sanctionsOracle: sanctionsOracleAddress,
    verifier: verifierAddress,
    hasher: hasherAddress,
    pools: deployedPools,
    protocolFeeBps: PROTOCOL_FEE_BPS,
    treasury,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
