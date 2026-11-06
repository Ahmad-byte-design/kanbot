import { z } from 'zod';

export const emailSchema = z.string().trim().email('Enter a valid email address');

/** Mirrors the server rule: 8–200 characters. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(200, 'Password must be at most 200 characters');

export const registerPayloadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name must be at most 80 characters'),
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = registerPayloadSchema
  .extend({
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});
