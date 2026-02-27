import { Hono } from 'hono';
import { AccountIndexer } from '../services/indexer.js';

const escrows = new Hono();

// Inject indexer instance - will be set in main app
let indexer: AccountIndexer;

export function setIndexer(indexerInstance: AccountIndexer) {
  indexer = indexerInstance;
}

// GET /api/escrows/:address - get escrow by PDA address (base58)
escrows.get('/api/escrows/:address', (c) => {
  if (!indexer) {
    return c.json({ error: 'Indexer not initialized' }, 500);
  }

  const address = c.req.param('address');
  if (!address) {
    return c.json({ error: 'Address parameter is required' }, 400);
  }

  const escrow = indexer.getEscrow(address);
  if (!escrow) {
    return c.json({ error: 'Escrow not found' }, 404);
  }

  return c.json({ escrow });
});

// GET /api/escrows/creator/:pubkey - list escrows by creator
escrows.get('/api/escrows/creator/:pubkey', (c) => {
  if (!indexer) {
    return c.json({ error: 'Indexer not initialized' }, 500);
  }

  const creator = c.req.param('pubkey');
  if (!creator) {
    return c.json({ error: 'Creator pubkey parameter is required' }, 400);
  }

  const creatorEscrows = indexer.getEscrowsByCreator(creator);
  return c.json({
    escrows: creatorEscrows,
    count: creatorEscrows.length,
  });
});

export default escrows;