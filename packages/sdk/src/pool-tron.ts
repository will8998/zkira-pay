/**
 * TronPoolClient — High-level client for Tron-based USDT shielded pools (Tornado Cash style).
 * Mirrors the Arbitrum PoolClient but uses TronWeb for all on-chain interactions.
 */

import type { TronPoolConfig, PoolNote, DepositResult, DepositForRelayResult, WithdrawResult, DepositEvent, TornadoFormattedProof } from './types.js';
import { generateProof } from './pool-worker.js';
import { formatProofForTornado } from './proof-formatter.js';

/** Merkle tree depth matching the Tornado Cash circuit (20 levels). */
const MERKLE_TREE_DEPTH = 20;

/** Zero value for empty Merkle tree leaves. */
const ZERO_VALUE = 0n;

/**
 * MiMCSponge hasher wrapper around circomlibjs.
 * Lazily initialized on first use.
 */
let mimcSpongeInstance: {
  multiHash: (inputs: bigint[], key?: bigint, numOutputs?: number) => Uint8Array;
  F: { toObject: (val: Uint8Array) => bigint };
} | null = null;

async function getMimcSponge(): Promise<typeof mimcSpongeInstance & object> {
  if (!mimcSpongeInstance) {
    const { buildMimcSponge } = await import('circomlibjs' as string);
    mimcSpongeInstance = await buildMimcSponge();
  }
  return mimcSpongeInstance!;
}

/**
 * Compute MiMCSponge hash of two values (used for commitments and Merkle nodes).
 */
async function mimcHash(left: bigint, right: bigint): Promise<bigint> {
  const mimc = await getMimcSponge();
  const hash = mimc.multiHash([left, right]);
  return mimc.F.toObject(hash);
}

/**
 * Compute MiMCSponge hash of a single value (used for nullifierHash).
 */
async function mimcHashSingle(value: bigint): Promise<bigint> {
  const mimc = await getMimcSponge();
  const hash = mimc.multiHash([value]);
  return mimc.F.toObject(hash);
}

/**
 * In-memory MiMCSponge-based Merkle tree for Tornado Cash.
 * Fixed depth of 20 levels.
 */
class MiMCSpongeTree {
  private readonly depth: number;
  private readonly zeros: bigint[];
  private readonly layers: bigint[][];
  private leafCount: number;

  constructor(depth: number, zeros: bigint[]) {
    this.depth = depth;
    this.zeros = zeros;
    this.layers = Array.from({ length: depth + 1 }, () => []);
    this.leafCount = 0;
  }

  /**
   * Build a MiMCSpongeTree with pre-computed zero hashes.
   */
  static async create(): Promise<MiMCSpongeTree> {
    const zeros: bigint[] = [ZERO_VALUE];
    for (let i = 0; i < MERKLE_TREE_DEPTH; i++) {
      zeros.push(await mimcHash(zeros[i], zeros[i]));
    }
    return new MiMCSpongeTree(MERKLE_TREE_DEPTH, zeros);
  }

  /**
   * Insert a leaf and update the tree.
   */
  async insert(leaf: bigint): Promise<void> {
    const index = this.leafCount;
    this.layers[0][index] = leaf;

    let currentIndex = index;
    let currentHash = leaf;

    for (let level = 0; level < this.depth; level++) {
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;
      const sibling = this.layers[level][siblingIndex] ?? this.zeros[level];

      const left = isRight ? sibling : currentHash;
      const right = isRight ? currentHash : sibling;
      currentHash = await mimcHash(left, right);

      currentIndex = Math.floor(currentIndex / 2);
      this.layers[level + 1][currentIndex] = currentHash;
    }

    this.leafCount++;
  }

  /**
   * Get the current Merkle root.
   */
  getRoot(): bigint {
    if (this.leafCount === 0) {
      return this.zeros[this.depth];
    }
    return this.layers[this.depth][0];
  }

  /**
   * Get the Merkle proof (path elements and path indices) for a given leaf index.
   */
  getProof(leafIndex: number): { pathElements: bigint[]; pathIndices: number[] } {
    if (leafIndex < 0 || leafIndex >= this.leafCount) {
      throw new Error(`Leaf index ${leafIndex} out of range [0, ${this.leafCount})`);
    }

    const pathElements: bigint[] = [];
    const pathIndices: number[] = [];

    let currentIndex = leafIndex;

    for (let level = 0; level < this.depth; level++) {
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;
      const sibling = this.layers[level][siblingIndex] ?? this.zeros[level];

      pathElements.push(sibling);
      pathIndices.push(isRight ? 1 : 0);

      currentIndex = Math.floor(currentIndex / 2);
    }

    return { pathElements, pathIndices };
  }
}

/**
 * Convert a bigint to a 32-byte big-endian hex string (bytes32 for Solidity).
 */
function bigIntToBytes32Hex(value: bigint): string {
  return '0x' + value.toString(16).padStart(64, '0');
}

/** Pool ABI for TronWeb (compatible with ethers ABI format). */
const POOL_ABI = [
  {
    "type": "function",
    "name": "deposit",
    "inputs": [{"name": "_commitment", "type": "bytes32"}],
    "outputs": []
  },
  {
    "type": "function", 
    "name": "withdraw",
    "inputs": [
      {"name": "_proof", "type": "bytes"},
      {"name": "_root", "type": "bytes32"},
      {"name": "_nullifierHash", "type": "bytes32"},
      {"name": "_recipient", "type": "address"},
      {"name": "_relayer", "type": "address"},
      {"name": "_fee", "type": "uint256"},
      {"name": "_refund", "type": "uint256"}
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "denomination",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}]
  },
  {
    "type": "function",
    "name": "nextIndex", 
    "inputs": [],
    "outputs": [{"name": "", "type": "uint32"}]
  },
  {
    "type": "function",
    "name": "getLastRoot",
    "inputs": [],
    "outputs": [{"name": "", "type": "bytes32"}]
  },
  {
    "type": "function",
    "name": "isSpent",
    "inputs": [{"name": "_nullifierHash", "type": "bytes32"}],
    "outputs": [{"name": "", "type": "bool"}]
  },
  {
    "type": "function",
    "name": "commitments",
    "inputs": [{"name": "", "type": "bytes32"}],
    "outputs": [{"name": "", "type": "bool"}]
  },
  {
    "type": "event",
    "name": "Deposit",
    "inputs": [
      {"name": "commitment", "type": "bytes32", "indexed": true},
      {"name": "leafIndex", "type": "uint32", "indexed": false},
      {"name": "timestamp", "type": "uint256", "indexed": false}
    ]
  },
  {
    "type": "event",
    "name": "Withdrawal",
    "inputs": [
      {"name": "to", "type": "address", "indexed": false},
      {"name": "nullifierHash", "type": "bytes32", "indexed": false},
      {"name": "relayer", "type": "address", "indexed": true},
      {"name": "fee", "type": "uint256", "indexed": false}
    ]
  }
];

/** USDT ABI for TronWeb. */
const USDT_ABI = [
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool"}]
  },
  {
    "type": "function",
    "name": "allowance",
    "inputs": [
      {"name": "owner", "type": "address"},
      {"name": "spender", "type": "address"}
    ],
    "outputs": [{"name": "", "type": "uint256"}]
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{"name": "account", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}]
  }
];

/**
 * High-level client for interacting with Tron-based USDT shielded pools (Tornado Cash style).
 * Mirrors the Arbitrum PoolClient but uses TronWeb for all on-chain interactions.
 */
export class TronPoolClient {
  private readonly privateKey: string;
  private readonly poolAddress: string;
  private readonly tokenAddress: string;
  private readonly denomination: bigint;
  private readonly circuitWasmUrl: string;
  private readonly circuitZkeyUrl: string;
  private readonly tronFullHost: string;
  private tronWebInstance: any = null;

  /**
   * Create a TronPoolClient.
   *
   * @param privateKey - Hex-encoded private key (with or without 0x prefix)
   * @param config - Tron pool configuration
   */
  constructor(privateKey: string, config: TronPoolConfig) {
    this.privateKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    this.poolAddress = config.poolAddress;
    this.tokenAddress = config.tokenAddress;
    this.denomination = config.denomination;
    this.circuitWasmUrl = config.circuitWasmUrl;
    this.circuitZkeyUrl = config.circuitZkeyUrl;
    this.tronFullHost = config.tronFullHost;
  }

  /**
   * Get TronWeb instance (lazy initialization with caching).
   * Uses dynamic import for SSR safety.
   */
  private async getTronWeb(): Promise<any> {
    if (!this.tronWebInstance) {
      const TronWebModule = await import('tronweb');
      const TronWeb = TronWebModule.default || TronWebModule;
      const TronWebConstructor = TronWeb as unknown as new (opts: { fullHost: string; privateKey: string }) => unknown;

      this.tronWebInstance = new TronWebConstructor({
        fullHost: this.tronFullHost,
        privateKey: this.privateKey,
      });
    }
    return this.tronWebInstance;
  }

  /**
   * Deposit a fixed denomination into the shielded pool.
   *
   * Generates a random nullifier + secret, computes a MiMCSponge commitment,
   * approves the USDT token transfer, and calls Pool.deposit(bytes32) on-chain.
   *
   * @returns Deposit result containing transaction hash and the note for later withdrawal
   */
  async deposit(): Promise<DepositResult> {
    const nullifier = this.generateRandomBigInt();
    const secret = this.generateRandomBigInt();
    const commitment = await mimcHash(nullifier, secret);
    const commitmentHex = bigIntToBytes32Hex(commitment);

    // Ensure USDT allowance covers the denomination
    await this.ensureAllowance();

    // Get TronWeb and pool contract
    const tronWeb = await this.getTronWeb();
    const contract = await tronWeb.contract().at(this.poolAddress);

    // Call deposit on the pool contract
    const result = await contract.deposit(commitmentHex).send({ feeLimit: 150_000_000 });

    // Extract leafIndex from transaction events
    const leafIndex = await this.getLeafIndexFromTxId(result);

    const note: PoolNote = {
      nullifier,
      secret,
      commitment,
      leafIndex,
    };

    return { txHash: result, note };
  }

  /**
   * Build an unsigned deposit transaction for relay-based submission.
   *
   * The transaction is NOT signed — the relayer will sign and broadcast it.
   * Use this for walletless flows where a relayer pays gas.
   *
   * @returns Unsigned transaction and the note for later withdrawal
   */
  async depositForRelay(): Promise<DepositForRelayResult> {
    const nullifier = this.generateRandomBigInt();
    const secret = this.generateRandomBigInt();
    const commitment = await mimcHash(nullifier, secret);
    const commitmentHex = bigIntToBytes32Hex(commitment);

    // For Tron, return the commitment data the relayer needs
    const unsignedTx = {
      to: this.poolAddress,
      data: commitmentHex,
      method: 'deposit'
    };

    const note: PoolNote = {
      nullifier,
      secret,
      commitment,
      leafIndex: -1, // Will be determined after the transaction is confirmed
    };

    return {
      unsignedTx,
      note,
    };
  }

  /**
   * Withdraw from the shielded pool using a saved note.
   *
   * Rebuilds the Merkle tree from on-chain Deposit events, generates a
   * Groth16 proof matching the Tornado Cash circuit, and calls
   * Pool.withdraw(proof, root, nullifierHash, recipient, relayer, fee, refund).
   *
   * @param note - The pool note from a previous deposit
   * @param recipientAddress - Tron address (base58) to receive the withdrawal
   * @param relayerAddress - Tron address of the relayer (or recipient if self-relay)
   * @param fee - Fee amount for the relayer (0n if self-relay)
   * @param refund - Refund amount (typically 0n)
   * @returns Withdrawal result containing transaction hash and nullifier hash
   */
  async withdraw(
    note: PoolNote,
    recipientAddress: string,
    relayerAddress: string,
    fee: bigint,
    refund: bigint
  ): Promise<WithdrawResult> {
    // Rebuild the Merkle tree from on-chain deposit events
    const tree = await this.rebuildTree();

    // Get current Merkle root
    const root = tree.getRoot();

    // Generate Merkle proof for the note's leaf
    const { pathElements, pathIndices } = tree.getProof(note.leafIndex);

    // Compute nullifier hash using MiMCSponge
    const nullifierHash = await mimcHashSingle(note.nullifier);

    // Get TronWeb for address conversion
    const tronWeb = await this.getTronWeb();

    // Convert Tron base58 addresses to hex for the ZK circuit
    // TronWeb.address.toHex returns '41' + 40hex. We need just the 20-byte part.
    const recipientHexRaw = tronWeb.address.toHex(recipientAddress);
    const recipientBigInt = BigInt('0x' + recipientHexRaw.slice(2)); // skip '41' prefix
    
    const relayerHexRaw = tronWeb.address.toHex(relayerAddress);
    const relayerBigInt = BigInt('0x' + relayerHexRaw.slice(2)); // skip '41' prefix

    // Prepare circuit inputs matching Tornado Cash withdraw circuit
    const circuitInputs = {
      // Private inputs
      nullifier: note.nullifier.toString(),
      secret: note.secret.toString(),
      pathElements: pathElements.map(x => x.toString()),
      pathIndices,
      // Public inputs
      root: root.toString(),
      nullifierHash: nullifierHash.toString(),
      recipient: recipientBigInt.toString(),
      relayer: relayerBigInt.toString(),
      fee: fee.toString(),
      refund: refund.toString(),
    };

    // Generate Groth16 proof via snarkjs (may run in Web Worker)
    const { proof: snarkjsProof, publicSignals } = await generateProof({
      signals: circuitInputs,
      wasmUrl: this.circuitWasmUrl,
      zkeyUrl: this.circuitZkeyUrl,
    });

    // Format proof for Tornado Cash Verifier.sol
    const formatted = formatProofForTornado(snarkjsProof, publicSignals);

    // Encode proof as hex for contract call
    const proofHex = '0x' + Array.from(formatted.proof)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Get pool contract
    const contract = await tronWeb.contract().at(this.poolAddress);

    // Call contract withdraw function (7 params)
    const result = await contract.withdraw(
      proofHex,
      bigIntToBytes32Hex(root),
      bigIntToBytes32Hex(nullifierHash),
      recipientAddress,
      relayerAddress,
      fee,
      refund
    ).send({ feeLimit: 200_000_000 });

    return { txHash: result, nullifierHash };
  }

  /**
   * Rebuild the MiMCSponge Merkle tree from on-chain Deposit events.
   *
   * Queries all Deposit events from the Pool contract and inserts
   * commitments in order to reconstruct the tree state.
   *
   * @returns Reconstructed MiMCSponge Merkle tree
   */
  async rebuildTree(): Promise<MiMCSpongeTree> {
    const tree = await MiMCSpongeTree.create();

    // Query Deposit events from the contract
    const events = await this.queryDepositEvents();

    // Sort by leaf index to ensure correct tree construction
    events.sort((a, b) => a.leafIndex - b.leafIndex);

    // Insert all commitments into the tree
    for (const event of events) {
      await tree.insert(event.commitment);
    }

    return tree;
  }

  /**
   * Get pool state information.
   *
   * @returns Current pool state (nextIndex, root, denomination)
   */
  async getPoolInfo(): Promise<{ nextIndex: number; root: string; denomination: bigint }> {
    const tronWeb = await this.getTronWeb();
    const contract = await tronWeb.contract().at(this.poolAddress);

    const [nextIndex, root, denomination] = await Promise.all([
      contract.nextIndex().call(),
      contract.getLastRoot().call(),
      contract.denomination().call(),
    ]);

    return {
      nextIndex: parseInt(nextIndex, 10),
      root,
      denomination: BigInt(denomination),
    };
  }

  /**
   * Query all Deposit events from the Pool contract.
   * Uses TronWeb's getEventResult API with pagination.
   */
  private async queryDepositEvents(): Promise<DepositEvent[]> {
    const tronWeb = await this.getTronWeb();
    const events: DepositEvent[] = [];
    let hasMore = true;
    let minBlockTimestamp = 0;

    while (hasMore) {
      const result = await tronWeb.getEventResult(this.poolAddress, {
        eventName: 'Deposit',
        size: 200,
        sort: 'block_timestamp',
        minBlockTimestamp,
      });

      if (!result || result.length === 0) {
        hasMore = false;
        break;
      }

      for (const event of result) {
        events.push({
          commitment: BigInt(event.result.commitment),
          leafIndex: parseInt(event.result.leafIndex, 10),
          timestamp: parseInt(event.block_timestamp, 10),
        });
      }

      if (result.length < 200) {
        hasMore = false;
      } else {
        // Update minBlockTimestamp for next page
        minBlockTimestamp = result[result.length - 1].block_timestamp + 1;
      }
    }

    return events;
  }

  /**
   * Extract the leaf index from a transaction ID by querying recent Deposit events.
   */
  private async getLeafIndexFromTxId(txId: string): Promise<number> {
    const tronWeb = await this.getTronWeb();
    
    // Query recent Deposit events and find the one matching our transaction
    const events = await tronWeb.getEventResult(this.poolAddress, {
      eventName: 'Deposit',
      size: 1,
      sort: '-block_timestamp'
    });

    if (events && events.length > 0) {
      return parseInt(events[0].result.leafIndex, 10);
    }

    throw new Error('Deposit event not found for transaction');
  }

  /**
   * Ensure the USDT token allowance covers the pool denomination.
   * Approves the exact denomination if current allowance is insufficient.
   */
  private async ensureAllowance(): Promise<void> {
    const tronWeb = await this.getTronWeb();
    const usdtContract = await tronWeb.contract().at(this.tokenAddress);
    
    const signerAddress = tronWeb.address.fromPrivateKey(this.privateKey);
    const currentAllowance = await usdtContract.allowance(
      signerAddress,
      this.poolAddress
    ).call();

    if (BigInt(currentAllowance) < this.denomination) {
      await usdtContract.approve(
        this.poolAddress,
        this.denomination
      ).send({ feeLimit: 100_000_000 });
    }
  }

  /**
   * Generate a random 31-byte bigint (< BN254 field prime) using crypto.getRandomValues.
   * Uses 31 bytes to ensure the value fits within the BN254 scalar field.
   */
  private generateRandomBigInt(): bigint {
    const bytes = new Uint8Array(31);
    crypto.getRandomValues(bytes);
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) + BigInt(bytes[i]);
    }
    return result;
  }
}