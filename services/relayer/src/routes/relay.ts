import { Hono } from 'hono';
import { Connection, Transaction } from '@solana/web3.js';
import { sha256 } from '@noble/hashes/sha256';
import { RelayerWallet } from '../services/wallet.js';
import { TransactionBuilder } from '../services/transaction.js';
import { PAYMENT_ESCROW_PROGRAM_ID } from '../types.js';
import type { RelayClaimRequest, ErrorResponse } from '../types.js';

const CLAIM_DISCRIMINATOR = sha256('global:claim_payment').slice(0, 8);

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function createRelayRoutes(connection: Connection, wallet: RelayerWallet) {
  const relay = new Hono();
  const txBuilder = new TransactionBuilder(connection, wallet);

  relay.post('/claim', async (c) => {
    try {
      const body = await c.req.json<RelayClaimRequest>();

      // Validate request
      if (!body.transaction || typeof body.transaction !== 'string') {
        const error: ErrorResponse = {
          success: false,
          error: 'Missing or invalid transaction field',
          code: 'INVALID_REQUEST',
        };
        return c.json(error, 400);
      }

      // Decode base64 transaction
      let txBytes: Buffer;
      try {
        txBytes = Buffer.from(body.transaction, 'base64');
      } catch {
        const error: ErrorResponse = {
          success: false,
          error: 'Invalid base64-encoded transaction',
          code: 'INVALID_TRANSACTION',
        };
        return c.json(error, 400);
      }

      // Deserialize transaction
      let transaction: Transaction;
      try {
        transaction = Transaction.from(txBytes);
      } catch {
        const error: ErrorResponse = {
          success: false,
          error: 'Failed to deserialize transaction',
          code: 'INVALID_TRANSACTION',
        };
        return c.json(error, 400);
      }

      // Verify the transaction contains exactly one instruction targeting payment-escrow
      if (transaction.instructions.length === 0) {
        const error: ErrorResponse = {
          success: false,
          error: 'Transaction contains no instructions',
          code: 'INVALID_TRANSACTION',
        };
        return c.json(error, 400);
      }

      // Find the claim instruction
      const claimIx = transaction.instructions.find(
        (ix) => ix.programId.equals(PAYMENT_ESCROW_PROGRAM_ID)
      );

      if (!claimIx) {
        const error: ErrorResponse = {
          success: false,
          error: 'No payment-escrow instruction found',
          code: 'INVALID_TRANSACTION',
        };
        return c.json(error, 400);
      }

      // Verify it's a claim_payment instruction (check discriminator)
      if (claimIx.data.length < 8 || !arraysEqual(claimIx.data.slice(0, 8), CLAIM_DISCRIMINATOR)) {
        const error: ErrorResponse = {
          success: false,
          error: 'Transaction does not contain a claim_payment instruction',
          code: 'INVALID_INSTRUCTION',
        };
        return c.json(error, 400);
      }

      // Set relayer as fee payer
      transaction.feePayer = wallet.publicKey;

      // Get fresh blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // Sign with relayer keypair (as fee payer)
      wallet.sign(transaction);

      // Send raw transaction
      const rawTx = transaction.serialize({ requireAllSignatures: false });
      const txSignature = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      // Wait for confirmation
      await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      return c.json({
        success: true,
        txSignature,
      });
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

  relay.get('/status/:signature', async (c) => {
    const signature = c.req.param('signature');

    try {
      const status = await connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      });

      if (!status.value) {
        return c.json({
          confirmed: false,
          error: 'Transaction not found',
        });
      }

      const confirmed = status.value.confirmationStatus === 'confirmed' ||
                        status.value.confirmationStatus === 'finalized';

      return c.json({
        confirmed,
        slot: status.value.slot,
        error: status.value.err ? JSON.stringify(status.value.err) : undefined,
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
