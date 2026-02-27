import { Context, Next } from 'hono';
import { Transaction } from '@solana/web3.js';
import { sha256 } from '@noble/hashes/sha256';
import { RelayClaimRequest, PAYMENT_ESCROW_PROGRAM_ID } from '../types.js';

export async function validateRelayClaimRequest(c: Context, next: Next) {
  try {
    const body = await c.req.json() as RelayClaimRequest;

    // Validate request body structure
    if (!body || typeof body !== 'object') {
      return c.json(
        {
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_REQUEST_BODY',
        },
        400
      );
    }

    if (!body.transaction || typeof body.transaction !== 'string') {
      return c.json(
        {
          success: false,
          error: 'Missing or invalid transaction field',
          code: 'INVALID_TRANSACTION_FIELD',
        },
        400
      );
    }

    // Validate base64 encoding
    let transactionBuffer: Buffer;
    try {
      transactionBuffer = Buffer.from(body.transaction, 'base64');
    } catch (error) {
      return c.json(
        {
          success: false,
          error: 'Invalid base64 encoding for transaction',
          code: 'INVALID_BASE64',
        },
        400
      );
    }

    // Validate transaction deserialization
    let transaction: Transaction;
    try {
      transaction = Transaction.from(transactionBuffer);
    } catch (error) {
      return c.json(
        {
          success: false,
          error: 'Invalid transaction format',
          code: 'INVALID_TRANSACTION_FORMAT',
        },
        400
      );
    }

    // Validate transaction has exactly one instruction
    if (transaction.instructions.length !== 1) {
      return c.json(
        {
          success: false,
          error: 'Transaction must contain exactly one instruction',
          code: 'INVALID_INSTRUCTION_COUNT',
        },
        400
      );
    }

    const instruction = transaction.instructions[0];

    // Validate instruction targets the payment escrow program
    if (!instruction.programId.equals(PAYMENT_ESCROW_PROGRAM_ID)) {
      return c.json(
        {
          success: false,
          error: 'Instruction must target the payment escrow program',
          code: 'INVALID_PROGRAM_ID',
        },
        400
      );
    }

    // Validate instruction discriminator matches claim_payment
    const expectedDiscriminator = sha256('global:claim_payment').slice(0, 8);
    const actualDiscriminator = instruction.data.slice(0, 8);

    if (!arraysEqual(expectedDiscriminator, actualDiscriminator)) {
      return c.json(
        {
          success: false,
          error: 'Invalid instruction discriminator',
          code: 'INVALID_DISCRIMINATOR',
        },
        400
      );
    }

    // Validate instruction has the expected number of accounts (11 accounts for claim_payment)
    if (instruction.keys.length !== 11) {
      return c.json(
        {
          success: false,
          error: 'Invalid number of accounts in instruction',
          code: 'INVALID_ACCOUNT_COUNT',
        },
        400
      );
    }

    // Store validated data in context for use in route handler
    c.set('validatedTransaction', transaction);
    c.set('validatedBody', body);

    await next();
  } catch (error) {
    console.error('Validation error:', error);
    return c.json(
      {
        success: false,
        error: 'Internal validation error',
        code: 'VALIDATION_ERROR',
      },
      500
    );
  }
}

export async function validateTransactionSignature(c: Context, next: Next) {
  try {
    const signature = c.req.param('signature');

    if (!signature) {
      return c.json(
        {
          success: false,
          error: 'Missing transaction signature',
          code: 'MISSING_SIGNATURE',
        },
        400
      );
    }

    // Validate signature format (base58, 64 characters)
    if (!/^[1-9A-HJ-NP-Za-km-z]{64}$/.test(signature)) {
      return c.json(
        {
          success: false,
          error: 'Invalid transaction signature format',
          code: 'INVALID_SIGNATURE_FORMAT',
        },
        400
      );
    }

    c.set('validatedSignature', signature);
    await next();
  } catch (error) {
    console.error('Signature validation error:', error);
    return c.json(
      {
        success: false,
        error: 'Internal validation error',
        code: 'VALIDATION_ERROR',
      },
      500
    );
  }
}

// Helper function to compare arrays
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}