import { z } from 'zod';

export const swapBodySchema = z.object({
  fromTokenId: z.number().int().positive('fromTokenId is required'),
  toTokenId: z.number().int().positive('toTokenId is required'),
  amount: z.number().positive('Amount must be positive'),
  destinationAddress: z.string().min(1, 'Destination address is required'),
  slippage: z.number().min(0).max(50).optional(),
  refundAddress: z.string().min(1).optional(),
 });

export type SwapBody = z.infer<typeof swapBodySchema>;
