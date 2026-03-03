import { z } from 'zod';

export const quotationQuerySchema = z.object({
  fromToken: z.string().optional(),
  toToken: z.string().optional(),
  fromNetwork: z.string().min(1, 'fromNetwork is required'),
  toNetwork: z.string().min(1, 'toNetwork is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
});

export type QuotationQuery = z.infer<typeof quotationQuerySchema>;
