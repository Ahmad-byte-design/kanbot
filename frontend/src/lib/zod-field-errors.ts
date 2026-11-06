import type { z } from 'zod';

/** Flattens a Zod error into `{ field: firstMessage }` for form inputs. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !errors[field]) {
      errors[field] = issue.message;
    }
  }

  return errors;
}
