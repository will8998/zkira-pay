import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Redeploy all 48 production ERC20Pool contracts using the fixed Verifier.
 * Reuses existing hasher and sanctions oracle from the original deployment.
 * 
 * Fixes applied:
 * 1. IHasher.sol: MiMCSponge now takes 3 params (in_xL, in_xR, in_k) to match deployed bytecode
 * 2. MerkleTreeWithHistory.sol: hashLeftRight passes k=0 as third arg
 * 3. Verifier.sol: G2 point components swapped to (imaginary, real) for EVM ecPairing precompile
 *
 * Usage:
 *   PRIVATE_KEY=<hex> npx hardhat run scripts/redeploy-pools.ts --network arbitrumSepolia
 */

const MERKLE_TREE_HEIGHT = 20;
const PROTOCOL_FEE_BPS = 100; // 1%

// Existing infrastructure (hasher & sanctions oracle remain valid)
const EXISTING = {
  hasher: "0xB2f940f7facE51076F823EFfb19C6B615cCBDA16",
  sanctionsOracle: "0xAd18BFABA4f6D6c0137559fCa5ff62A21fc3Fd27",
};

// Testnet token addresses (Aave faucet)
const TOKENS = {
  USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  DAI: "0x9bc8388dd439fa3365b1f78a81242adbb4677759",
  USDT: "0x93d67359a0f6f117150a70fdde6bb96782497248",
};

interface TokenConfig {
  name: string;
  address: string;
  decimals: number;
  hasBlacklistCheck: boolean;
  denominations: Record<string, bigint>;
}

function getTokenConfigs(): TokenConfig[] {
  return [
    {
      name: "USDC",
      address: TOKENS.USDC,
      decimals: 6,
      hasBlacklistCheck: false,
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
      address: TOKENS.USDT,
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
      address: TOKENS.DAI,
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
  const treasury = deployer.address;

  console.log("Deployer:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  const network = await ethers.provider.getNetwork();
  console.log(`Chain ID: ${network.chainId}`);

  // Step 1: Deploy new fixed Verifier
  console.log("\n=== Deploying Fixed Verifier ===");
  const Verifier = await ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("New Verifier:", verifierAddress);

  // Step 2: Deploy all 48 pools
  const tokens = getTokenConfigs();
  const deployedPools: Record<string, Record<string, string>> = {};
  let poolCount = 0;

  for (const token of tokens) {
    deployedPools[token.name] = {};
    console.log(`\n--- Deploying ${token.name} pools (16 denominations) ---`);

    for (const [denomName, denomination] of Object.entries(
      token.denominations
    )) {
      const ERC20Pool = await ethers.getContractFactory("ERC20Pool");
      const pool = await ERC20Pool.deploy(
        verifierAddress,
        EXISTING.hasher,
        denomination,
        MERKLE_TREE_HEIGHT,
        token.address,
        EXISTING.sanctionsOracle,
        PROTOCOL_FEE_BPS,
        treasury,
        token.hasBlacklistCheck
      );
      await pool.waitForDeployment();
      const poolAddress = await pool.getAddress();
      deployedPools[token.name][denomName] = poolAddress;
      poolCount++;
      console.log(`  [${poolCount}/48] ${denomName}: ${poolAddress}`);
    }
  }

  // Output deployment summary
  const summary = {
    network: network.chainId.toString(),
    deployer: deployer.address,
    sanctionsOracle: EXISTING.sanctionsOracle,
    verifier: verifierAddress,
    hasher: EXISTING.hasher,
    protocolFeeBps: PROTOCOL_FEE_BPS,
    treasury,
    pools: deployedPools,
  };

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));

  const outputFile = path.join(
    __dirname,
    "..",
    `deployment-${network.chainId}.json`
  );
  fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));
  console.log(`\nSaved to: ${outputFile}`);
  console.log(`Total pools deployed: ${poolCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
