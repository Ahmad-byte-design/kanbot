import { z } from 'zod';
import { SPRINT_LIMITS } from '../constants/sprints.constants';
import type { SprintFormValues } from '../types/sprints.types';

/**
 * `YYYY-MM-DD` that also exists on the calendar: the regex alone accepts
 * 2026-02-30, which the date input would then silently normalise.
 */
function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === '' || isCalendarDate(value), {
    message: 'Use the format YYYY-MM-DD',
  });

export const sprintFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(SPRINT_LIMITS.nameMax, `Keep the name under ${SPRINT_LIMITS.nameMax} characters`),
    goal: z
      .string()
      .trim()
      .max(SPRINT_LIMITS.goalMax, `Keep the goal under ${SPRINT_LIMITS.goalMax} characters`),
    startDate: optionalDate,
    endDate: optionalDate,
  })
  .superRefine((values, ctx) => {
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date must be on or after the start date',
      });
    }
  });

/** Form strings → the nullable date fields the API expects. */
export function sprintRequestFromValues(values: SprintFormValues) {
  return {
    name: values.name.trim(),
    goal: values.goal.trim(),
    startDate: values.startDate || null,
    endDate: values.endDate || null,
  };
}

const requiredDate = z
  .string()
  .trim()
  .refine(isCalendarDate, 'Use the format YYYY-MM-DD');

export const startSprintSchema = z
  .object({
    startDate: requiredDate,
    endDate: requiredDate,
  })
  .superRefine((values, ctx) => {
    if (values.endDate < values.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date must be on or after the start date',
      });
    }
  });
