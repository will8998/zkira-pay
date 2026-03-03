import { Hono } from 'hono';
import type { AppEnv } from '../app.js';
import type { QuotationResponse, RouteQuote, RouteType } from '@zkira/swap-types';
import type { RocketXQuote } from '@zkira/swap-types';
import { RocketXClient } from '../services/rocketx-client.js';
import { quotationQuerySchema } from '../schemas/quote.js';

const quoteRoutes = new Hono<AppEnv>();

function mapQuoteToRouteQuote(quote: RocketXQuote): RouteQuote {
  const isPrivate = quote.exchangeInfo.private === true;

  return {
    fromTokenId: quote.fromTokenInfo.id,
    exchangeId: quote.exchangeInfo.id,
    toTokenId: quote.toTokenInfo.id,
    exchangeKeyword: quote.exchangeInfo.keyword,
    exchangeTitle: quote.exchangeInfo.title,
    exchangeLogo: quote.exchangeInfo.logo,
    exchangeType: quote.exchangeInfo.exchange_type,
    isPrivate,
    walletLess: quote.exchangeInfo.walletLess,
    allowDiffWallet: quote.exchangeInfo.allow_diff_wallet,
    refundAddressRequired: quote.exchangeInfo.refundAddressRequired ?? false,
    fromAmount: quote.fromAmount ?? 0,
    toAmount: quote.toAmount ?? 0,
    fromTokenSymbol: quote.fromTokenInfo.token_symbol,
    toTokenSymbol: quote.toTokenInfo.token_symbol,
    fromNetwork: quote.fromTokenInfo.network_id,
    toNetwork: quote.toTokenInfo.network_id,
    estimatedTimeSeconds: quote.estTimeInSeconds?.avg ?? 0,
    gasFeeUsd: quote.gasFeeUsd ?? 0,
    platformFeeUsd: quote.platformFeeUsd ?? 0,
    platformFeePercent: quote.platformFeeInPercent ?? 0,
    priceImpact: quote.additionalInfo?.priceImpact ?? 0,
    minReceived: quote.additionalInfo?.minRecieved ?? 0,
    depositAddress: quote.depositAddress,
    allowanceAddress: quote.allowanceAddress,
    isTxnAllowed: quote.isTxnAllowed ?? false,
    routeType: isPrivate ? 'private' as RouteType : 'standard' as RouteType,
  };
}

quoteRoutes.get('/quote', async (c) => {
  const config = c.get('config');
  const client = new RocketXClient(config.rocketxBaseUrl, config.rocketxApiKey);

  const parsed = quotationQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors, status: 400 }, 400);
  }

  const data = await client.getQuotation(parsed.data);

  // Exchanges known to consistently fail at swap creation
  const EXCHANGE_BLACKLIST = ['PRIVATESWAP14'];

  const quotes: RouteQuote[] = data.quotes
    .filter((q) => q.exchangeInfo.walletLess)
    .filter((q) => q.exchangeInfo.private === true) // Privacy-only: ZKIRA is a private swap platform
    .filter((q) => !q.err && q.toAmount != null)
    .filter((q) => !EXCHANGE_BLACKLIST.includes(q.exchangeInfo.keyword))
    .map(mapQuoteToRouteQuote);

  const response: QuotationResponse = { quotes };

  return c.json(response);
});

export default quoteRoutes;
