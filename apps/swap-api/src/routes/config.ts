import { Hono } from 'hono';
import type { AppEnv } from '../app.js';
import type { ConfigsResponse } from '@zkira/swap-types';
import { RocketXClient } from '../services/rocketx-client.js';

const configRoutes = new Hono<AppEnv>();

configRoutes.get('/configs', async (c) => {
  const config = c.get('config');
  const client = new RocketXClient(config.rocketxBaseUrl, config.rocketxApiKey);

  const data = await client.getConfigs();

  const response: ConfigsResponse = {
    supported_exchanges: data.supported_exchanges,
    supported_networks: data.supported_network,
  };

  return c.json(response);
});

export default configRoutes;
