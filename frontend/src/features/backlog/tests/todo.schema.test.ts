import { describe, expect, it } from 'vitest';
import { quickTodoSchema, todoFormSchema } from '../schema/todo.schema';

const validValues = {
  title: 'Map the onboarding flow',
  description: '',
  type: 'story',
  status: 'todo',
  priority: 'high',
  storyPoints: '3',
  labels: 'design, research',
  dueDate: '',
  sprintId: '',
};

describe('todoFormSchema', () => {
  it('normalises labels, story points, due date and sprint', () => {
    const parsed = todoFormSchema.parse({
      ...validValues,
      labels: ' design , Research, design ,, ',
      dueDate: '2026-11-12',
      sprintId: 's-1',
    });

    expect(parsed).toMatchObject({
      title: 'Map the onboarding flow',
      labels: ['design', 'Research'],
      storyPoints: 3,
      dueDate: '2026-11-12',
      sprintId: 's-1',
    });
  });

  it('maps the empty option values to null', () => {
    const parsed = todoFormSchema.parse({ ...validValues, storyPoints: '', sprintId: '' });
    expect(parsed.storyPoints).toBeNull();
    expect(parsed.sprintId).toBeNull();
  });

  it('rejects an unsupported story point value', () => {
    const parsed = todoFormSchema.safeParse({ ...validValues, storyPoints: '4' });
    expect(parsed.success).toBe(false);
  });

  it('rejects too many labels and a malformed date', () => {
    const tooMany = todoFormSchema.safeParse({
      ...validValues,
      labels: Array.from({ length: 11 }, (_, index) => `label-${index}`).join(','),
    });
    expect(tooMany.success).toBe(false);

    const badDate = todoFormSchema.safeParse({ ...validValues, dueDate: '12/11/2026' });
    expect(badDate.success).toBe(false);
  });

  it('trims the title and rejects an empty one', () => {
    expect(todoFormSchema.parse({ ...validValues, title: '  Ship it  ' }).title).toBe('Ship it');
    expect(todoFormSchema.safeParse({ ...validValues, title: '   ' }).success).toBe(false);
  });
});

describe('quickTodoSchema', () => {
  it('trims and validates the title', () => {
    expect(quickTodoSchema.parse({ title: '  Draft release notes  ' }).title).toBe('Draft release notes');
    expect(quickTodoSchema.safeParse({ title: ' ' }).success).toBe(false);
    expect(quickTodoSchema.safeParse({ title: 'x'.repeat(201) }).success).toBe(false);
  });
});
