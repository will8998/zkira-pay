import { z } from 'zod';

export const quotationQuerySchema = z.object({
  fromTokenId: z.coerce.number().int().positive('fromTokenId is required'),
  toTokenId: z.coerce.number().int().positive('toTokenId is required'),
  fromNetwork: z.string().min(1, 'fromNetwork is required'),
  toNetwork: z.string().min(1, 'toNetwork is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
});

export type QuotationQuery = z.infer<typeof quotationQuerySchema>;
