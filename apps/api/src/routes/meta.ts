import { Hono } from 'hono';
import { AccountIndexer } from '../services/indexer.js';

const meta = new Hono();

// Inject indexer instance - will be set in main app
let indexer: AccountIndexer;

export function setIndexer(indexerInstance: AccountIndexer) {
  indexer = indexerInstance;
}

// GET /api/meta/:owner - get meta-address for owner wallet (base58)
meta.get('/api/meta/:owner', (c) => {
  if (!indexer) {
    return c.json({ error: 'Indexer not initialized' }, 500);
  }

  const owner = c.req.param('owner');
  if (!owner) {
    return c.json({ error: 'Owner parameter is required' }, 400);
  }

  const metaAddress = indexer.getMetaAddress(owner);
  if (!metaAddress) {
    return c.json({ error: 'Meta-address not found' }, 404);
  }

  return c.json({ metaAddress });
});

export default meta;