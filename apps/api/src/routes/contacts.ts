import { Hono } from 'hono';
import { db } from '../db/index.js';
import { contacts } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const contactRoutes = new Hono();

// GET /api/contacts/:walletAddress - List contacts for wallet
contactRoutes.get('/api/contacts/:walletAddress', async (c) => {
  const walletAddress = c.req.param('walletAddress');

  if (!walletAddress) {
    return c.json({ error: 'Wallet address parameter is required' }, 400);
  }

  try {
    const userContacts = await db.select().from(contacts).where(eq(contacts.walletAddress, walletAddress));
    return c.json({ contacts: userContacts });
  } catch (error) {
    console.error('Failed to get contacts:', error);
    return c.json({ error: 'Failed to get contacts' }, 500);
  }
});

// POST /api/contacts - Create contact
contactRoutes.post('/api/contacts', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, contactName, contactAddress } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return c.json({ error: 'Valid wallet address is required' }, 400);
    }

    if (!contactName || typeof contactName !== 'string') {
      return c.json({ error: 'Valid contact name is required' }, 400);
    }

    if (!contactAddress || typeof contactAddress !== 'string') {
      return c.json({ error: 'Valid contact address is required' }, 400);
    }

    const result = await db.insert(contacts).values({
      walletAddress,
      contactName,
      contactAddress,
    }).returning();

    return c.json({ contact: result[0] });
  } catch (error) {
    console.error('Failed to create contact:', error);
    return c.json({ error: 'Failed to create contact' }, 500);
  }
});

// DELETE /api/contacts/:id - Delete contact by id
contactRoutes.delete('/api/contacts/:id', async (c) => {
  const contactId = c.req.param('id');

  if (!contactId) {
    return c.json({ error: 'Contact ID parameter is required' }, 400);
  }

  try {
    const result = await db.delete(contacts).where(eq(contacts.id, contactId)).returning();

    if (result.length === 0) {
      return c.json({ error: 'Contact not found' }, 404);
    }

    return c.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Failed to delete contact:', error);
    return c.json({ error: 'Failed to delete contact' }, 500);
  }
});

export default contactRoutes;