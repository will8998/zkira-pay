import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { deadDropNotes, invoicesV2, invoiceNotes } from '../db/schema-dead-drop.js';

const deadDrop = new Hono();

// ═══════════════════════════════════════════════════════════
// DEAD DROP ENDPOINTS (Send flow)
// ═══════════════════════════════════════════════════════════

/** Create a dead drop with encrypted deposit bundle. */
deadDrop.post('/api/dead-drop', async (c) => {
  try {
    const body = await c.req.json();
    const { dropId, payload } = body as {
      dropId: string;
      payload: { ciphertext: string; nonce: string; version: number };
    };

    if (!dropId || !payload?.ciphertext || !payload?.nonce) {
      return c.json({ error: 'Missing required fields: dropId, payload.ciphertext, payload.nonce' }, 400);
    }

    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    await db.insert(deadDropNotes).values({
      dropId,
      payload,
      expiresAt,
    });

    return c.json({ ok: true, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    // Duplicate dropId → 409
    if (message.includes('unique') || message.includes('duplicate')) {
      return c.json({ error: 'Dead drop already exists' }, 409);
    }
    return c.json({ error: message }, 500);
  }
});

/** Retrieve a dead drop by its hashed ID. */
deadDrop.get('/api/dead-drop/:dropId', async (c) => {
  try {
    const dropId = c.req.param('dropId');
    const rows = await db
      .select()
      .from(deadDropNotes)
      .where(eq(deadDropNotes.dropId, dropId))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return c.json({ error: 'Dead drop not found' }, 404);
    }

    // Check expiry
    if (new Date(row.expiresAt) < new Date()) {
      return c.json({ error: 'Dead drop expired' }, 410);
    }

    return c.json({
      payload: row.payload,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      claimed: row.claimed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return c.json({ error: message }, 500);
  }
});

/** Mark a dead drop as claimed. */
deadDrop.patch('/api/dead-drop/:dropId/claim', async (c) => {
  try {
    const dropId = c.req.param('dropId');
    const result = await db
      .update(deadDropNotes)
      .set({ claimed: true })
      .where(eq(deadDropNotes.dropId, dropId));

    return c.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return c.json({ error: message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
// INVOICE V2 ENDPOINTS (Request/Invoice flow)
// ═══════════════════════════════════════════════════════════

/** Create a new invoice. */
deadDrop.post('/api/invoices/v2', async (c) => {
  try {
    const body = await c.req.json();
    const {
      invoiceId, chain, token, denominations, totalRaw, totalLabel,
      recipientPubkey, memo, expiresAt,
    } = body as {
      invoiceId: string;
      chain: string;
      token: string;
      denominations: unknown;
      totalRaw: string;
      totalLabel: string;
      recipientPubkey: string;
      memo?: string;
      expiresAt?: string;
    };

    if (!invoiceId || !chain || !token || !denominations || !totalRaw || !recipientPubkey) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const expires = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

    await db.insert(invoicesV2).values({
      invoiceId,
      chain,
      token,
      denominations,
      totalRaw,
      totalLabel,
      recipientPubkey,
      memo: memo ?? null,
      expiresAt: expires,
    });

    return c.json({ ok: true, invoiceId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('unique') || message.includes('duplicate')) {
      return c.json({ error: 'Invoice already exists' }, 409);
    }
    return c.json({ error: message }, 500);
  }
});

/** Get invoice details. */
deadDrop.get('/api/invoices/v2/:invoiceId', async (c) => {
  try {
    const invoiceId = c.req.param('invoiceId');
    const rows = await db
      .select()
      .from(invoicesV2)
      .where(eq(invoicesV2.invoiceId, invoiceId))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    return c.json({
      invoiceId: row.invoiceId,
      chain: row.chain,
      token: row.token,
      denominations: row.denominations,
      totalRaw: row.totalRaw,
      totalLabel: row.totalLabel,
      recipientPubkey: row.recipientPubkey,
      memo: row.memo,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return c.json({ error: message }, 500);
  }
});

/** Add an encrypted note to an invoice (payer deposits and encrypts). */
deadDrop.post('/api/invoices/v2/:invoiceId/notes', async (c) => {
  try {
    const invoiceId = c.req.param('invoiceId');
    const body = await c.req.json();
    const { ciphertext, nonce, ephemeralPubkey } = body as {
      ciphertext: string;
      nonce: string;
      ephemeralPubkey: string;
    };

    if (!ciphertext || !nonce || !ephemeralPubkey) {
      return c.json({ error: 'Missing required fields: ciphertext, nonce, ephemeralPubkey' }, 400);
    }

    // Verify invoice exists
    const invoiceRows = await db
      .select()
      .from(invoicesV2)
      .where(eq(invoicesV2.invoiceId, invoiceId))
      .limit(1);

    if (invoiceRows.length === 0) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    await db.insert(invoiceNotes).values({
      invoiceId,
      ciphertext,
      nonce,
      ephemeralPubkey,
    });

    return c.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return c.json({ error: message }, 500);
  }
});

/** Get all encrypted notes for an invoice. */
deadDrop.get('/api/invoices/v2/:invoiceId/notes', async (c) => {
  try {
    const invoiceId = c.req.param('invoiceId');
    const rows = await db
      .select()
      .from(invoiceNotes)
      .where(eq(invoiceNotes.invoiceId, invoiceId));

    return c.json({
      notes: rows.map((r) => ({
        ciphertext: r.ciphertext,
        nonce: r.nonce,
        ephemeralPubkey: r.ephemeralPubkey,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return c.json({ error: message }, 500);
  }
});

/** Update invoice status. */
deadDrop.patch('/api/invoices/v2/:invoiceId/status', async (c) => {
  try {
    const invoiceId = c.req.param('invoiceId');
    const body = await c.req.json();
    const { status } = body as { status: string };

    const validStatuses = ['pending', 'funded', 'withdrawn', 'expired'];
    if (!status || !validStatuses.includes(status)) {
      return c.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, 400);
    }

    await db
      .update(invoicesV2)
      .set({ status })
      .where(eq(invoicesV2.invoiceId, invoiceId));

    return c.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return c.json({ error: message }, 500);
  }
});

export default deadDrop;
