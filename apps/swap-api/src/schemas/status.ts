import { z } from 'zod';

export const statusParamsSchema = z.object({
  requestId: z.string().min(1, 'requestId is required'),
});

export type StatusParams = z.infer<typeof statusParamsSchema>;
