import { z } from 'zod';
import { AI_LIMITS } from '../constants/ai.constants';
import type { GenerateTodosFormValues, PlanSprintFormValues } from '../types/ai.types';

/** AI-2: the prompt and an optional count, kept as strings for the form. */
export const generateTodosSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(AI_LIMITS.promptMin, 'Describe what you want the assistant to draft')
    .max(AI_LIMITS.promptMax, `Keep the description under ${AI_LIMITS.promptMax} characters`),
  count: z
    .string()
    .trim()
    .min(1, 'Choose how many todos to draft')
    .refine((value) => /^\d+$/.test(value), 'Use a whole number')
    .refine(
      (value) => Number(value) >= AI_LIMITS.countMin && Number(value) <= AI_LIMITS.countMax,
      `Choose between ${AI_LIMITS.countMin} and ${AI_LIMITS.countMax} todos`,
    ),
});

export function generateTodosRequest(values: GenerateTodosFormValues) {
  return {
    prompt: values.prompt.trim(),
    count: Number(values.count),
  };
}

/** AI-3: capacity is required, whole and in range; focus is optional. */
export const planSprintSchema = z.object({
  capacity: z
    .string()
    .trim()
    .min(1, 'Enter your capacity in story points')
    .refine((value) => /^\d+$/.test(value), 'Use a whole number')
    .refine(
      (value) =>
        Number(value) >= AI_LIMITS.capacityMin && Number(value) <= AI_LIMITS.capacityMax,
      `Capacity must be between ${AI_LIMITS.capacityMin} and ${AI_LIMITS.capacityMax} points`,
    ),
  focus: z
    .string()
    .trim()
    .max(AI_LIMITS.focusMax, `Keep the focus under ${AI_LIMITS.focusMax} characters`),
});

export function planSprintRequest(values: PlanSprintFormValues) {
  const focus = values.focus.trim();
  return {
    capacity: Number(values.capacity),
    ...(focus ? { focus } : {}),
  };
}
