import { z } from 'zod';

export const tokensQuerySchema = z.object({
  chainId: z.string().optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
});

export type TokensQuery = z.infer<typeof tokensQuerySchema>;
