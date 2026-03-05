// ZKIRA SDK - TypeScript client for multi-chain shielded pools (Arbitrum + Tron)

export const SDK_VERSION = '0.1.0';

// Pool client and wallet
export { PoolClient } from './pool.js';
export { BrowserWallet } from './browser-wallet.js';
export { formatProofForTornado } from './proof-formatter.js';
// Tron pool client and wallet
export { TronPoolClient } from './pool-tron.js';
export { TronBrowserWallet, type TronWalletAdapter } from './browser-wallet-tron.js';
export type { SnarkjsProof } from './proof-formatter.js';

// Receipt management (chain-agnostic)
export { ReceiptManager } from './receipt.js';
// Pool registry (chain/token/denomination mappings)
export {
  CHAIN_CONFIGS,
  CHAIN_CONFIGS_TESTNET,
  POOL_REGISTRY,
  POOL_REGISTRY_TESTNET,
  getChainConfig,
  getAvailableChains,
  getTokensForChain,
  getPoolsForChainAndToken,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from './registry.js';

// Types and interfaces
export type {
  EVMWalletAdapter,
  PoolConfig,
  PoolNote,
  DepositResult,
  DepositForRelayResult,
  WithdrawResult,
  DepositEvent,
  EncryptedReceipt,
  TornadoFormattedProof,
  // Multi-chain types
  Chain,
  TokenId,
  NetworkMode,
  ChainConfig,
  TokenInfo,
  PoolEntry,
  // Re-exported from @zkira/common
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
  // Re-exported from @zkira/crypto
  StealthAddressResult,
  MatchedAnnouncement,
} from './types.js';
