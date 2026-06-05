import { z } from 'zod';

export const PERSONAL_EXPENSE_CATEGORIES = [
  'FOOD',
  'TRANSPORT',
  'SHOPPING',
  'ENTERTAINMENT',
  'HEALTH',
  'EDUCATION',
  'BILLS',
  'TRAVEL',
  'OTHER',
] as const;

export const personalExpenseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  category: z.enum(PERSONAL_EXPENSE_CATEGORIES, {
    required_error: 'Please select a category',
  }),
  description: z.string().optional(),
  expenseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export type PersonalExpenseFields = z.infer<typeof personalExpenseSchema>;
