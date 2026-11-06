import { z } from 'zod';
import { PROJECT_LIMITS } from '../constants/projects.constants';

/**
 * Zod mirrors the server rules: name 1–80, description ≤ 500, key 2–6 letters
 * (uppercased). A blank key is allowed on create; the server generates one.
 */
export const projectKeySchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2,6}$/, 'Use 2–6 letters')
  .transform((value) => value.toUpperCase());

export const optionalProjectKeySchema = z
  .string()
  .trim()
  .refine((value) => value === '' || /^[A-Za-z]{2,6}$/.test(value), {
    message: 'Use 2–6 letters',
  })
  .transform((value) => value.toUpperCase());

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(PROJECT_LIMITS.nameMax, `Keep the name under ${PROJECT_LIMITS.nameMax} characters`);

const descriptionSchema = z
  .string()
  .trim()
  .max(
    PROJECT_LIMITS.descriptionMax,
    `Keep the description under ${PROJECT_LIMITS.descriptionMax} characters`,
  );

export const createProjectSchema = z.object({
  name: nameSchema,
  key: optionalProjectKeySchema,
  description: descriptionSchema,
});

export const updateProjectSchema = z.object({
  name: nameSchema,
  key: projectKeySchema,
  description: descriptionSchema,
});

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;
export type UpdateProjectSchema = z.infer<typeof updateProjectSchema>;
