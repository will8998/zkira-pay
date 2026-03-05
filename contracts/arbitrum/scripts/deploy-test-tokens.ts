import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy 3 mintable test tokens + 3 ERC20Pool contracts for E2E testing.
 * Reuses the already-deployed Verifier, Hasher, and SanctionsOracle from the
 * original deployment (deployment-421614.json).
 *
 * Usage:
 *   PRIVATE_KEY=<hex> npx hardhat run scripts/deploy-test-tokens.ts --network arbitrumSepolia
 */

const MERKLE_TREE_HEIGHT = 20;
const PROTOCOL_FEE_BPS = 100; // 1%

// Already deployed infrastructure from deployment-421614.json
const EXISTING = {
  verifier: "0xa2aA5F74AD18A5d0EAF89B551d27060Ea08a2EEB",
  hasher: "0xB2f940f7facE51076F823EFfb19C6B615cCBDA16",
  sanctionsOracle: "0xAd18BFABA4f6D6c0137559fCa5ff62A21fc3Fd27",
  treasury: "0x292B6763E4b26708E1d643AC4F1658e3Ba8636cB",
};

interface TokenSpec {
  name: string;
  symbol: string;
  decimals: number;
  // $1 denomination in native units
  denomination: bigint;
  mintAmount: bigint; // How much to mint to deployer
}

const TOKENS: TokenSpec[] = [
  {
    name: "Test USDC",
    symbol: "tUSDC",
    decimals: 6,
    denomination: 1_000_000n, // $1
    mintAmount: 100_000_000_000n, // 100,000 USDC
  },
  {
    name: "Test USDT",
    symbol: "tUSDT",
    decimals: 6,
    denomination: 1_000_000n, // $1
    mintAmount: 100_000_000_000n, // 100,000 USDT
  },
  {
    name: "Test DAI",
    symbol: "tDAI",
    decimals: 18,
    denomination: 1_000_000_000_000_000_000n, // $1
    mintAmount: 100_000_000_000_000_000_000_000n, // 100,000 DAI
  },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  const network = await ethers.provider.getNetwork();
  console.log(`Chain ID: ${network.chainId}`);

  const results: Record<
    string,
    { token: string; pool: string; denomination: string; decimals: number }
  > = {};

  for (const spec of TOKENS) {
    console.log(`\n=== Deploying ${spec.symbol} ===`);

    // Deploy TestToken
    const TestToken = await ethers.getContractFactory("TestToken");
    const token = await TestToken.deploy(spec.name, spec.symbol, spec.decimals);
    await token.waitForDeployment();
    const tokenAddr = await token.getAddress();
    console.log(`  Token: ${tokenAddr}`);

    // Mint tokens to deployer
    const mintTx = await token.mint(deployer.address, spec.mintAmount);
    await mintTx.wait();
    console.log(
      `  Minted: ${ethers.formatUnits(spec.mintAmount, spec.decimals)} ${spec.symbol}`
    );

    // Deploy ERC20Pool with $1 denomination
    const ERC20Pool = await ethers.getContractFactory("ERC20Pool");
    const pool = await ERC20Pool.deploy(
      EXISTING.verifier,
      EXISTING.hasher,
      spec.denomination,
      MERKLE_TREE_HEIGHT,
      tokenAddr,
      EXISTING.sanctionsOracle,
      PROTOCOL_FEE_BPS,
      EXISTING.treasury,
      false // hasBlacklistCheck
    );
    await pool.waitForDeployment();
    const poolAddr = await pool.getAddress();
    console.log(`  Pool ($1): ${poolAddr}`);

    results[spec.symbol] = {
      token: tokenAddr,
      pool: poolAddr,
      denomination: spec.denomination.toString(),
      decimals: spec.decimals,
    };
  }

  // Save deployment info
  const output = {
    network: network.chainId.toString(),
    deployer: deployer.address,
    infrastructure: EXISTING,
    testTokens: results,
    deployedAt: new Date().toISOString(),
  };

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(JSON.stringify(output, null, 2));

  const outFile = path.join(
    __dirname,
    "..",
    `test-deployment-${network.chainId}.json`
  );
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
