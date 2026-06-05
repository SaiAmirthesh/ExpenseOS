import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

export type CreateGroupFields = z.infer<typeof createGroupSchema>;
export type InviteMemberFields = z.infer<typeof inviteMemberSchema>;
