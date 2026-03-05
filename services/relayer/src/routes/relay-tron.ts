import { Hono } from 'hono';
import type { TronRelayerWallet } from '../services/wallet-tron.js';
import type { RelayerConfig } from '../config.js';
import type {
  TronWithdrawRelayRequest,
  TronRelayResponse,
  ErrorResponse,
} from '../types.js';

// TronWeb interface types (mirroring wallet-tron.ts for consistency)
interface TronWebInstance {
  trx: {
    getTransactionInfo(txId: string): Promise<{ 
      receipt?: { 
        result: string; 
        energy_usage_total: number; 
      }; 
      blockNumber?: number; 
    } | null>;
  };
  contract(): { at(address: string): Promise<TronContract> };
}

interface TronContract {
  withdraw(
    proof: string, 
    root: string, 
    nullifierHash: string, 
    recipient: string, 
    relayer: string, 
    fee: string, 
    refund: string
  ): { send(opts: { feeLimit: number; callValue?: number }): Promise<string> };
  isSpent(nullifierHash: string): { call(): Promise<boolean> };
  paused(): { call(): Promise<boolean> };
}

export function createTronRelayRoutes(wallet: TronRelayerWallet, config: RelayerConfig): Hono {
  const relay = new Hono();

  // POST /withdraw — Tron withdraw relay
  relay.post('/withdraw', async (c) => {
    try {
      const body = await c.req.json<TronWithdrawRelayRequest>();

      // Validate required fields
      if (!body.proof || !body.root || !body.nullifierHash || !body.recipient || !body.poolAddress) {
        const error: ErrorResponse = {
          success: false,
          error: 'Missing required fields',
          code: 'INVALID_REQUEST',
        };
        return c.json(error, 400);
      }

      // Verify pool address is in our allowed list
      if (!config.tronPoolAddresses.includes(body.poolAddress)) {
        const error: ErrorResponse = {
          success: false,
          error: 'Pool address not recognized',
          code: 'INVALID_POOL',
        };
        return c.json(error, 400);
      }

      // Verify the relayer address matches ours
      if (body.relayer !== wallet.address) {
        const error: ErrorResponse = {
          success: false,
          error: 'Relayer address does not match',
          code: 'RELAYER_MISMATCH',
        };
        return c.json(error, 400);
      }

      // Get pool contract via TronWeb
      const tronWeb = wallet.tronWeb as TronWebInstance;
      const poolContract = await tronWeb.contract().at(body.poolAddress);

      // Check pool is not paused
      const isPaused = await poolContract.paused().call();
      if (isPaused) {
        const error: ErrorResponse = {
          success: false,
          error: 'Pool is paused',
          code: 'POOL_PAUSED',
        };
        return c.json(error, 503);
      }

      // Check nullifier not already spent
      const isSpent = await poolContract.isSpent(body.nullifierHash).call();
      if (isSpent) {
        const error: ErrorResponse = {
          success: false,
          error: 'Note already spent',
          code: 'ALREADY_SPENT',
        };
        return c.json(error, 400);
      }

      // Normalize hex values (ensure 0x prefix for consistency with existing patterns)
      const proof = body.proof.startsWith('0x') ? body.proof : `0x${body.proof}`;
      const root = body.root.startsWith('0x') ? body.root : `0x${body.root}`;
      const nullifierHash = body.nullifierHash.startsWith('0x') ? body.nullifierHash : `0x${body.nullifierHash}`;

      // Send withdraw transaction
      const txId = await poolContract.withdraw(
        proof,
        root,
        nullifierHash,
        body.recipient,
        body.relayer,
        body.fee,
        body.refund
      ).send({
        feeLimit: 200_000_000, // 200 TRX max energy fee
        callValue: parseInt(body.refund, 10) || 0,
      });

      const response: TronRelayResponse = {
        success: true,
        txId,
      };

      // Fire-and-forget: report withdrawal volume to API for partner tracking
      if (body.partnerId) {
        fetch(`${config.apiUrl}/api/relayer/withdrawal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Relayer-Secret': config.apiSecret },
          body: JSON.stringify({
            partnerId: body.partnerId,
            poolAddress: body.poolAddress,
            txHash: txId,
            recipient: body.recipient,
            chain: 'tron',
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
        code: 'RELAY_FAILED',
      };
      return c.json(error, 500);
    }
  });

  // GET /status/:txId — Check Tron transaction status
  relay.get('/status/:txId', async (c) => {
    try {
      const txId = c.req.param('txId');

      // Validate txId format (64 hex chars, no 0x prefix for Tron)
      const cleanTxId = txId.startsWith('0x') ? txId.slice(2) : txId;
      if (!/^[0-9a-fA-F]{64}$/.test(cleanTxId)) {
        const error: ErrorResponse = {
          success: false,
          error: 'Invalid transaction ID format',
          code: 'INVALID_TX_ID',
        };
        return c.json(error, 400);
      }

      const tronWeb = wallet.tronWeb as TronWebInstance;
      const txInfo = await tronWeb.trx.getTransactionInfo(cleanTxId);

      if (!txInfo || !txInfo.receipt) {
        return c.json({
          confirmed: false,
          error: 'Transaction not found or still pending',
        });
      }

      const confirmed = txInfo.receipt.result === 'SUCCESS';
      return c.json({
        confirmed,
        receipt: {
          result: txInfo.receipt.result,
          energyUsed: txInfo.receipt.energy_usage_total,
          blockNumber: txInfo.blockNumber,
        },
        error: confirmed ? undefined : 'Transaction failed',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({
        confirmed: false,
        error: message,
      }, 500);
    }
  });

  return relay;
}