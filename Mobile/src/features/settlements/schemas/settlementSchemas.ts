import { z } from 'zod';

export const createSettlementSchema = z.object({
  groupId: z.number({ required_error: 'Group ID is required' }),
  toUserId: z.number({ required_error: 'User to settle with is required' }),
  amount: z.number().positive('Settlement amount must be greater than zero'),
  note: z.string().optional(),
});

export type CreateSettlementFields = z.infer<typeof createSettlementSchema>;
