import { Hono } from 'hono';
import { AccountIndexer } from '../services/indexer.js';

const announcements = new Hono();

// Inject indexer instance - will be set in main app
let indexer: AccountIndexer;

export function setIndexer(indexerInstance: AccountIndexer) {
  indexer = indexerInstance;
}

// GET /api/announcements - list all indexed announcements
announcements.get('/api/announcements', (c) => {
  if (!indexer) {
    return c.json({ error: 'Indexer not initialized' }, 500);
  }

  const allAnnouncements = indexer.getAnnouncements();
  return c.json({
    announcements: allAnnouncements,
    count: allAnnouncements.length,
  });
});

// GET /api/announcements/:stealthAddress - get announcement by stealth address (hex encoded)
announcements.get('/api/announcements/:stealthAddress', (c) => {
  if (!indexer) {
    return c.json({ error: 'Indexer not initialized' }, 500);
  }

  const stealthAddress = c.req.param('stealthAddress');
  if (!stealthAddress) {
    return c.json({ error: 'Stealth address parameter is required' }, 400);
  }

  const announcement = indexer.getAnnouncementByStealthAddress(stealthAddress);
  if (!announcement) {
    return c.json({ error: 'Announcement not found' }, 404);
  }

  return c.json({ announcement });
});

export default announcements;