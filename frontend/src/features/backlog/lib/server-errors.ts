import { fieldErrors } from '../../../services/client';

const TODO_FIELDS = new Set([
  'title',
  'description',
  'type',
  'status',
  'priority',
  'storyPoints',
  'labels',
  'dueDate',
  'sprintId',
]);

/**
 * The API can return nested paths (`labels.0`, `storyPoints`). Reduce them to
 * the form field that owns them so the message lands under the right input.
 */
export function todoServerErrors(error: unknown): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [path, message] of Object.entries(fieldErrors(error))) {
    const field = path.split('.')[0] ?? '';
    if (TODO_FIELDS.has(field) && !errors[field]) errors[field] = message;
  }

  return errors;
}
