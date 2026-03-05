// Re-export relevant types from @zkira/common
export type {
  MetaAddress,
  Announcement,
  PaymentEscrow,
  MilestoneEscrow,
  ProtocolConfig,
  ZkiraError,
  InvalidMetaAddressError,
  PaymentNotFoundError,
  PaymentExpiredError,
  PaymentAlreadyClaimedError,
  InvalidClaimSecretError,
  ProtocolPausedError,
} from '@zkira/common';

// Re-export relevant types from @zkira/crypto
export type {
  StealthAddressResult,
  MatchedAnnouncement,
} from '@zkira/crypto';

/**
 * Wallet adapter interface for EVM wallets.
 */
export interface EVMWalletAdapter {
  /** EVM address (0x...) */
  address: string;
  /** Returns the hex-encoded private key */
  getPrivateKey(): string;
}

/**
 * Configuration for an Arbitrum ERC20 shielded pool (Tornado Cash style).
 */
export interface PoolConfig {
  /** EVM contract address for the ERC20Pool (0x...) */
  poolAddress: string;
  /** ERC-20 token address (e.g., USDC on Arbitrum) */
  tokenAddress: string;
  /** Fixed denomination in raw token units (e.g., 100_000_000n for 100 USDC) */
  denomination: bigint;
  /** URL to the withdraw circuit WASM file */
  circuitWasmUrl: string;
  /** URL to the withdraw circuit zkey file */
  circuitZkeyUrl: string;
  /** Arbitrum JSON-RPC URL */
  rpcUrl: string;
}

/**
 * A note representing a deposit in the shielded pool.
 * Contains the private data needed to later withdraw.
 */
export interface PoolNote {
  nullifier: bigint;
  secret: bigint;
  commitment: bigint;
  leafIndex: number;
}

/**
 * Result of depositing to the shielded pool.
 */
export interface DepositResult {
  txHash: string;
  note: PoolNote;
}

/**
 * Result of building an unsigned deposit transaction for relay submission.
 */
export interface DepositForRelayResult {
  /** Unsigned transaction object (ethers.js TransactionRequest format) */
  unsignedTx: Record<string, unknown>;
  note: PoolNote;
}

/**
 * Result of withdrawing from the shielded pool.
 */
export interface WithdrawResult {
  txHash: string;
  nullifierHash: bigint;
}

/**
 * Encrypted receipt for shielded pool notes.
 * Contains encrypted note data that can be decrypted with a password.
 */
export interface EncryptedReceipt {
  /** Receipt format version */
  v: 1;
  /** Pool address (0x... EVM address) */
  pool: string;
  /** Denomination as string (bigint serialized) */
  denomination: string;
  /** AES-256-GCM encrypted payload (base64) */
  encrypted: string;
  /** PBKDF2 salt (base64) */
  salt: string;
  /** AES-GCM IV (base64) */
  iv: string;
}

/**
 * Tornado Cash formatted proof for EVM/Solidity verification.
 */
export interface TornadoFormattedProof {
  /** ABI-encoded proof bytes: abi.encode(uint256[2] a, uint256[2][2] b, uint256[2] c) */
  proof: Uint8Array;
  /** Public inputs: [root, nullifierHash, recipient, relayer, fee, refund] */
  publicInputs: bigint[];
}

/**
 * Deposit event data from the ERC20Pool contract.
 */
export interface DepositEvent {
  commitment: bigint;
  leafIndex: number;
  timestamp: number;
}

// === Multi-chain types ===

export type { Chain, TokenId, NetworkMode, ChainConfig, TokenInfo, PoolEntry } from './registry.js';

export interface TronPoolConfig {
  /** Tron full host (e.g., https://api.trongrid.io) */
  tronFullHost: string;
  /** Pool contract address (base58 Tron address) */
  poolAddress: string;
  /** USDT token address (base58 Tron address) */
  tokenAddress: string;
  /** Denomination in raw units */
  denomination: bigint;
  /** Path to withdraw circuit WASM */
  circuitWasmUrl: string;
  /** Path to withdraw circuit zkey */
  circuitZkeyUrl: string;
}
