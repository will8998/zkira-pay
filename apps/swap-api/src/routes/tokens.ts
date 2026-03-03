import { Hono } from 'hono';
import type { AppEnv } from '../app.js';
import { RocketXClient } from '../services/rocketx-client.js';
import { tokensQuerySchema } from '../schemas/tokens.js';

const tokenRoutes = new Hono<AppEnv>();

tokenRoutes.get('/tokens', async (c) => {
  const config = c.get('config');
  const client = new RocketXClient(config.rocketxBaseUrl, config.rocketxApiKey);

  const parsed = tokensQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors, status: 400 }, 400);
  }

  const allTokens = await client.getTokens(parsed.data);

  // Filter out scam/meme tokens — RocketX returns ALL DEX tokens including junk.
  // Legit tokens have score >= 1 (major coins, stablecoins, well-known alts).
  // Tokens with score < 1 are random ERC20s using fake tickers (e.g. "BTC" = HarryPotterObamaSonic10Inu).
  const MIN_TOKEN_SCORE = 1;
  const tokens = allTokens.filter(t => (t.score ?? 0) >= MIN_TOKEN_SCORE);

  return c.json({ tokens });
});

export default tokenRoutes;
