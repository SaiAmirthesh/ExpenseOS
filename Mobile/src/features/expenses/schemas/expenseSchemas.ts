import { z } from 'zod';

export const expenseCategorySchema = z.enum([
  'FOOD',
  'TRAVEL',
  'SHOPPING',
  'RENT',
  'ENTERTAINMENT',
  'UTILITIES',
  'HEALTH',
  'OTHER',
]);

export const splitTypeSchema = z.enum(['EQUAL', 'EXACT', 'PERCENTAGE']);

export const splitRequestSchema = z.object({
  userId: z.number({ required_error: 'User is required' }),
  amount: z.number().positive('Amount must be positive').optional(),
  percentage: z.number().positive('Percentage must be positive').optional(),
});

export const createExpenseSchema = z.object({
  groupId: z.number(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be greater than zero'),
  category: expenseCategorySchema,
  splitType: splitTypeSchema,
  splits: z.array(splitRequestSchema).optional(),
});

export type CreateExpenseFields = z.infer<typeof createExpenseSchema>;
export type SplitRequestFields = z.infer<typeof splitRequestSchema>;
export type ExpenseCategoryType = z.infer<typeof expenseCategorySchema>;
export type SplitTypeType = z.infer<typeof splitTypeSchema>;
