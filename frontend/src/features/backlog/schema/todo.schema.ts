import { z } from 'zod';
import { STORY_POINTS, TODO_PRIORITIES, TODO_STATUSES, TODO_TYPES } from '../../../types/api';
import { TODO_LIMITS } from '../constants/backlog.constants';

function splitLabels(value: string): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const part of value.split(',')) {
    const label = part.trim();
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    labels.push(label);
  }

  return labels;
}

const labelsField = z
  .string()
  .superRefine((value, ctx) => {
    const labels = splitLabels(value);
    if (labels.length > TODO_LIMITS.labelsMax) {
      ctx.addIssue({ code: 'custom', message: `Use at most ${TODO_LIMITS.labelsMax} labels` });
    }
    if (labels.some((label) => label.length > TODO_LIMITS.labelMax)) {
      ctx.addIssue({
        code: 'custom',
        message: `Keep each label under ${TODO_LIMITS.labelMax} characters`,
      });
    }
  })
  .transform(splitLabels);

const dueDateField = z
  .string()
  .refine((value) => value === '' || z.iso.date().safeParse(value).success, {
    message: 'Enter a valid date',
  })
  .transform((value) => (value === '' ? null : value));

const storyPointsField = z
  .enum(STORY_POINTS.map((points) => String(points)) as [string, ...string[]])
  .or(z.literal(''))
  .transform((value) => (value === '' ? null : (Number(value) as (typeof STORY_POINTS)[number])));

export const todoFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(TODO_LIMITS.titleMax, `Keep the title under ${TODO_LIMITS.titleMax} characters`),
  description: z
    .string()
    .max(
      TODO_LIMITS.descriptionMax,
      `Keep the description under ${TODO_LIMITS.descriptionMax} characters`,
    ),
  type: z.enum(TODO_TYPES),
  status: z.enum(TODO_STATUSES),
  priority: z.enum(TODO_PRIORITIES),
  storyPoints: storyPointsField,
  labels: labelsField,
  dueDate: dueDateField,
  sprintId: z.string().transform((value) => (value === '' ? null : value)),
});

export const quickTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(TODO_LIMITS.titleMax, `Keep the title under ${TODO_LIMITS.titleMax} characters`),
});

export type TodoFormSchema = z.infer<typeof todoFormSchema>;
export type QuickTodoSchema = z.infer<typeof quickTodoSchema>;
