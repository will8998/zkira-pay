import { Hono } from 'hono';
import { Contract } from 'ethers';
import { RelayerWallet } from '../services/wallet.js';
import { SessionService } from '../services/session.js';
import { TransactionValidator } from '../services/transaction.js';
import type { RelayerConfig } from '../config.js';
import type {
  SessionCreateRequest,
  SessionCreateResponse,
  DepositBroadcastRequest,
  WithdrawRelayRequest,
  RelayResponse,
  BalanceResponse,
  ErrorResponse,
} from '../types.js';

const POOL_ABI = [
  'function withdraw(bytes calldata _proof, bytes32 _root, bytes32 _nullifierHash, address payable _recipient, address payable _relayer, uint256 _fee, uint256 _refund) external payable',
  'function denomination() external view returns (uint256)',
  'function nextIndex() external view returns (uint32)',
  'function isSpent(bytes32 _nullifierHash) external view returns (bool)',
  'function paused() external view returns (bool)',
  'event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp)',
];

export function createSessionRoutes(wallet: RelayerWallet, config: RelayerConfig): Hono {
  const session = new Hono();
  const sessionService = new SessionService(wallet, config);
  const txValidator = new TransactionValidator(config);

  // POST /create — Register session (validate address, return assigned pool)
  session.post('/create', async (c) => {
    try {
      const body = await c.req.json<SessionCreateRequest>();

      if (!body.address || typeof body.address !== 'string') {
        const error: ErrorResponse = {
          success: false,
          error: 'Missing or invalid address field',
          code: 'INVALID_REQUEST',
        };
        return c.json(error, 400);
      }

      if (!sessionService.isValidAddress(body.address)) {
        const error: ErrorResponse = {
          success: false,
          error: 'Invalid EVM address format',
          code: 'INVALID_ADDRESS',
        };
        return c.json(error, 400);
      }

      // Pick a healthy pool
      const poolAddress = await sessionService.pickHealthyPool();
      if (!poolAddress) {
        const error: ErrorResponse = {
          success: false,
          error: 'No healthy pools available',
          code: 'NO_POOLS_AVAILABLE',
        };
        return c.json(error, 503);
      }

      const response: SessionCreateResponse = {
        success: true,
        address: wallet.address,
        poolAddress,
      };

      return c.json(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const error: ErrorResponse = {
        success: false,
        error: message,
        code: 'SESSION_CREATE_FAILED',
      };
      return c.json(error, 500);
    }
  });

  // POST /deposit — Broadcast a user-signed deposit transaction
  session.post('/deposit', async (c) => {
    try {
      const body = await c.req.json<DepositBroadcastRequest>();

      if (!body.signedTransaction || typeof body.signedTransaction !== 'string') {
        const error: ErrorResponse = {
          success: false,
          error: 'Missing or invalid signedTransaction field',
          code: 'INVALID_REQUEST',
        };
        return c.json(error, 400);
      }

      // Ensure 0x prefix
      const txHex = body.signedTransaction.startsWith('0x')
        ? body.signedTransaction
        : `0x${body.signedTransaction}`;

      // Broadcast the user-signed transaction
      const txResponse = await wallet.wallet.provider!.broadcastTransaction(txHex);

      // Wait for 1 confirmation
      const receipt = await txResponse.wait(1);

      if (!receipt) {
        const error: ErrorResponse = {
          success: false,
          error: 'Transaction was not confirmed',
          code: 'TX_NOT_CONFIRMED',
        };
        return c.json(error, 500);
      }

      const response: RelayResponse = {
        success: true,
        txHash: receipt.hash,
      };

      return c.json(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const error: ErrorResponse = {
        success: false,
        error: message,
        code: 'DEPOSIT_FAILED',
      };
      return c.json(error, 500);
    }
  });

  // POST /withdraw — Relayer-submitted withdrawal (pays ETH for gas)
  session.post('/withdraw', async (c) => {
    try {
      const body = await c.req.json<WithdrawRelayRequest>();

      // Normalize values BEFORE validation: proof is already hex, but root/nullifierHash may be
      // decimal strings (from snarkjs publicSignals) or hex strings.
      body.proof = body.proof.startsWith('0x') ? body.proof : `0x${body.proof}`;
      body.root = body.root.startsWith('0x')
        ? body.root
        : '0x' + BigInt(body.root).toString(16).padStart(64, '0');
      body.nullifierHash = body.nullifierHash.startsWith('0x')
        ? body.nullifierHash
        : '0x' + BigInt(body.nullifierHash).toString(16).padStart(64, '0');

      // Validate all fields (now with normalized hex values)
      const validation = txValidator.validateWithdrawRequest(body);
      if (!validation.valid) {
        const error: ErrorResponse = {
          success: false,
          error: validation.error ?? 'Validation failed',
          code: 'INVALID_REQUEST',
        };
        return c.json(error, 400);
      }

      // Allow relayer=0x0 when fee=0 (standard Tornado Cash pattern — no relayer fee)
      const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
      if (
        body.relayer.toLowerCase() !== ZERO_ADDRESS &&
        body.relayer.toLowerCase() !== wallet.address.toLowerCase()
      ) {
        const error: ErrorResponse = {
          success: false,
          error: 'Relayer address does not match this relayer',
          code: 'RELAYER_MISMATCH',
        };
        return c.json(error, 400);
      }

      // Check gas price safety cap
      const feeData = await wallet.provider.getFeeData();
      if (feeData.gasPrice && feeData.gasPrice > config.maxGasPrice) {
        const error: ErrorResponse = {
          success: false,
          error: 'Current gas price exceeds safety cap',
          code: 'GAS_PRICE_TOO_HIGH',
        };
        return c.json(error, 503);
      }

      // Values already normalized above — use them directly
      const proof = body.proof;
      const root = body.root;
      const nullifierHash = body.nullifierHash;

      // Pre-broadcast safety checks to avoid wasting gas
      const poolContract = new Contract(body.poolAddress, POOL_ABI, wallet.wallet);

      // Check if nullifier is already spent
      const isSpent = await poolContract.isSpent(nullifierHash);
      if (isSpent) {
        const error: ErrorResponse = {
          success: false,
          error: 'Note has already been spent',
          code: 'ALREADY_SPENT',
        };
        return c.json(error, 400);
      }

      // Check if root is known on-chain
      const isKnown = await poolContract.isKnownRoot(root);
      if (!isKnown) {
        const error: ErrorResponse = {
          success: false,
          error: 'Merkle root is not known on-chain (may be expired or invalid)',
          code: 'UNKNOWN_ROOT',
        };
        return c.json(error, 400);
      }

      // Build and send withdraw transaction
      const tx = await poolContract.withdraw(
        proof,
        root,
        nullifierHash,
        body.recipient,
        body.relayer,
        body.fee,
        body.refund,
        { value: body.refund },
      );

      // Wait for 1 confirmation
      const receipt = await tx.wait(1);

      if (!receipt) {
        const error: ErrorResponse = {
          success: false,
          error: 'Withdraw transaction was not confirmed',
          code: 'TX_NOT_CONFIRMED',
        };
        return c.json(error, 500);
      }

      const response: RelayResponse = {
        success: true,
        txHash: receipt.hash,
      };

      // Fire-and-forget: report withdrawal volume to API for partner tracking
      if (body.partnerId) {
        fetch(`${config.apiUrl}/api/relayer/withdrawal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Relayer-Secret': config.apiSecret },
          body: JSON.stringify({
            partnerId: body.partnerId,
            poolAddress: body.poolAddress,
            txHash: receipt.hash,
            recipient: body.recipient,
            chain: 'arbitrum',
          }),
        }).catch((err) => {
          console.error('Failed to report withdrawal volume:', err);
        });
      }

      return c.json(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const error: ErrorResponse = {
        success: false,
        error: message,
        code: 'WITHDRAW_FAILED',
      };
      return c.json(error, 500);
    }
  });

  // GET /balance/:address — Check USDC balance
  session.get('/balance/:address', async (c) => {
    try {
      const address = c.req.param('address');

      if (!sessionService.isValidAddress(address)) {
        const error: ErrorResponse = {
          success: false,
          error: 'Invalid EVM address format',
          code: 'INVALID_ADDRESS',
        };
        return c.json(error, 400);
      }

      const result = await sessionService.getUsdcBalance(address);

      const response: BalanceResponse = {
        balance: result.balance,
        uiAmount: result.uiAmount,
      };

      return c.json(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const error: ErrorResponse = {
        success: false,
        error: message,
        code: 'BALANCE_CHECK_FAILED',
      };
      return c.json(error, 500);
    }
  });

  // GET /pools — List available pools with status
  session.get('/pools', async (c) => {
    try {
      const statuses = await sessionService.getAllPoolStatuses();
      return c.json({ success: true, pools: statuses });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const error: ErrorResponse = {
        success: false,
        error: message,
        code: 'POOLS_CHECK_FAILED',
      };
      return c.json(error, 500);
    }
  });

  return session;
}
