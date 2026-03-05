import { Contract, JsonRpcProvider, type Signer } from 'ethers';
import { generateProof } from './pool-worker.js';
import { formatProofForTornado } from './proof-formatter.js';
import type {
  PoolConfig,
  PoolNote,
  DepositResult,
  DepositForRelayResult,
  WithdrawResult,
  DepositEvent,
} from './types.js';

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

/** Minimal ABI for the ERC20Pool contract. */
const POOL_ABI = [
  'function deposit(bytes32 _commitment) external payable',
  'function withdraw(bytes calldata _proof, bytes32 _root, bytes32 _nullifierHash, address payable _recipient, address payable _relayer, uint256 _fee, uint256 _refund) external payable',
  'function denomination() external view returns (uint256)',
  'function nextIndex() external view returns (uint32)',
  'function getLastRoot() external view returns (bytes32)',
  'function isSpent(bytes32 _nullifierHash) external view returns (bool)',
  'function commitments(bytes32) external view returns (bool)',
  'event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp)',
  'event Withdrawal(address to, bytes32 nullifierHash, address indexed relayer, uint256 fee)',
];

/** Minimal ABI for ERC-20 token interactions. */
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
];

/**
 * High-level client for interacting with Arbitrum-based ERC20 shielded pools (Tornado Cash style).
 * Provides methods for depositing to and withdrawing from the ERC20Pool contract.
 *
 * Uses ethers.js v6 for all on-chain interactions.
 */
export class PoolClient {
  private readonly signer: Signer;
  private readonly contract: Contract;
  private readonly tokenContract: Contract;
  private readonly poolAddress: string;
  private readonly tokenAddress: string;
  private readonly denomination: bigint;
  private readonly circuitWasmUrl: string;
  private readonly circuitZkeyUrl: string;

  /**
   * Create a PoolClient.
   *
   * @param signer - ethers.js Signer (Wallet connected to a provider)
   * @param config - Pool configuration
   */
  constructor(signer: Signer, config: PoolConfig) {
    this.signer = signer;
    this.poolAddress = config.poolAddress;
    this.tokenAddress = config.tokenAddress;
    this.denomination = config.denomination;
    this.circuitWasmUrl = config.circuitWasmUrl;
    this.circuitZkeyUrl = config.circuitZkeyUrl;
    this.contract = new Contract(config.poolAddress, POOL_ABI, signer);
    this.tokenContract = new Contract(config.tokenAddress, ERC20_ABI, signer);
  }

  /**
   * Create a PoolClient from an RPC URL and a private key.
   * Convenience factory for walletless / server-side usage.
   *
   * @param privateKey - Hex-encoded private key (0x-prefixed)
   * @param config - Pool configuration (rpcUrl used for provider)
   * @returns A new PoolClient instance
   */
  static fromPrivateKey(privateKey: string, config: PoolConfig): PoolClient {
    const { Wallet: EthersWallet } = require('ethers') as typeof import('ethers');
    const provider = new JsonRpcProvider(config.rpcUrl);
    const wallet = new EthersWallet(privateKey, provider);
    return new PoolClient(wallet, config);
  }

  /**
   * Deposit a fixed denomination into the shielded pool.
   *
   * Generates a random nullifier + secret, computes a MiMCSponge commitment,
   * approves the ERC-20 token transfer, and calls ERC20Pool.deposit(bytes32) on-chain.
   *
   * @returns Deposit result containing transaction hash and the note for later withdrawal
   */
  async deposit(): Promise<DepositResult> {
    const nullifier = this.generateRandomBigInt();
    const secret = this.generateRandomBigInt();
    const commitment = await mimcHash(nullifier, secret);
    const commitmentHex = bigIntToBytes32Hex(commitment);

    // Ensure ERC-20 allowance covers the denomination
    await this.ensureAllowance();

    // Call deposit on the pool contract
    const tx = await this.contract.deposit(commitmentHex);
    const receipt = await tx.wait();

    // Extract leafIndex from Deposit event in the receipt
    const leafIndex = this.getLeafIndexFromReceipt(receipt);

    const note: PoolNote = {
      nullifier,
      secret,
      commitment,
      leafIndex,
    };

    return { txHash: receipt.hash as string, note };
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

    // Build unsigned transaction via populateTransaction
    const unsignedTx = await this.contract.deposit.populateTransaction(commitmentHex);

    const note: PoolNote = {
      nullifier,
      secret,
      commitment,
      leafIndex: -1, // Will be determined after the transaction is confirmed
    };

    return {
      unsignedTx: unsignedTx as unknown as Record<string, unknown>,
      note,
    };
  }

  /**
   * Withdraw from the shielded pool using a saved note.
   *
   * Rebuilds the Merkle tree from on-chain Deposit events, generates a
   * Groth16 proof matching the Tornado Cash circuit, and calls
   * ERC20Pool.withdraw(proof, root, nullifierHash, recipient, relayer, fee, refund).
   *
   * @param note - The pool note from a previous deposit
   * @param recipientAddress - EVM address (0x...) to receive the withdrawal
   * @param relayerAddress - EVM address of the relayer (or recipient if self-relay)
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

    // Convert addresses to uint160 bigint for circuit inputs
    const recipientBigInt = BigInt(recipientAddress);
    const relayerBigInt = BigInt(relayerAddress);

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

    // Call contract withdraw function (7 params)
    const tx = await this.contract.withdraw(
      proofHex,
      bigIntToBytes32Hex(root),
      bigIntToBytes32Hex(nullifierHash),
      recipientAddress,
      relayerAddress,
      fee,
      refund
    );
    const receipt = await tx.wait();

    return { txHash: receipt.hash as string, nullifierHash };
  }

  /**
   * Rebuild the MiMCSponge Merkle tree from on-chain Deposit events.
   *
   * Queries all Deposit events from the ERC20Pool contract and inserts
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
    const [nextIndex, root, denomination] = await Promise.all([
      this.contract.nextIndex() as Promise<bigint>,
      this.contract.getLastRoot() as Promise<string>,
      this.contract.denomination() as Promise<bigint>,
    ]);

    return {
      nextIndex: Number(nextIndex),
      root,
      denomination,
    };
  }

  /**
   * Query all Deposit events from the ERC20Pool contract.
   *
   * Uses ethers.js v6 queryFilter to fetch historical deposit events.
   */
  private async queryDepositEvents(): Promise<DepositEvent[]> {
    const filter = this.contract.filters.Deposit();
    const rawEvents = await this.contract.queryFilter(filter);

    const events: DepositEvent[] = [];
    for (const raw of rawEvents) {
      // ethers v6: EventLog has args property
      const eventLog = raw as unknown as {
        args: { commitment: string; leafIndex: bigint; timestamp: bigint };
      };
      events.push({
        commitment: BigInt(eventLog.args.commitment),
        leafIndex: Number(eventLog.args.leafIndex),
        timestamp: Number(eventLog.args.timestamp),
      });
    }

    return events;
  }

  /**
   * Extract the leaf index from a transaction receipt's Deposit event.
   */
  private getLeafIndexFromReceipt(receipt: { logs: readonly unknown[] }): number {
    const iface = this.contract.interface;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log as { topics: string[]; data: string });
        if (parsed && parsed.name === 'Deposit') {
          return Number(parsed.args[1]); // leafIndex is the 2nd arg
        }
      } catch {
        // Not a matching event, skip
      }
    }
    throw new Error('Deposit event not found in transaction receipt');
  }

  /**
   * Ensure the ERC-20 token allowance covers the pool denomination.
   * Approves the exact denomination if current allowance is insufficient.
   */
  private async ensureAllowance(): Promise<void> {
    const signerAddress = await this.signer.getAddress();
    const currentAllowance = await this.tokenContract.allowance(
      signerAddress,
      this.poolAddress
    ) as bigint;

    if (currentAllowance < this.denomination) {
      const approveTx = await this.tokenContract.approve(
        this.poolAddress,
        this.denomination
      );
      await approveTx.wait();
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
