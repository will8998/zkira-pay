import { z } from 'zod';

export const swapBodySchema = z.object({
  fromTokenId: z.number().int().positive('fromTokenId is required'),
  toTokenId: z.number().int().positive('toTokenId is required'),
  fromNetwork: z.string().min(1, 'fromNetwork is required'),
  toNetwork: z.string().min(1, 'toNetwork is required'),
  amount: z.number().positive('Amount must be positive'),
  exchangeKeyword: z.string().min(1, 'exchangeKeyword is required'),
  toAddress: z.string().min(1, 'Destination address is required'),
  refundAddress: z.string().optional(),
  slippage: z.number().min(0).max(50).optional(),
});

export type SwapBody = z.infer<typeof swapBodySchema>;
