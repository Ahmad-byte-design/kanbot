import { describe, expect, it } from 'vitest';
import {
  createProjectSchema,
  optionalProjectKeySchema,
  projectKeySchema,
  updateProjectSchema,
} from '../schema/project.schema';
import { suggestProjectKey, PROJECT_TONES, projectTone, projectToneClass } from '../lib/project-tone';

describe('project schemas', () => {
  it('accepts a valid create payload and uppercases the key', () => {
    const result = createProjectSchema.parse({
      name: '  Mobile App Redesign  ',
      key: 'mar',
      description: '  A calmer way to plan.  ',
    });

    expect(result).toEqual({
      name: 'Mobile App Redesign',
      key: 'MAR',
      description: 'A calmer way to plan.',
    });
  });

  it('allows a blank key on create but not on edit', () => {
    expect(optionalProjectKeySchema.parse('')).toBe('');
    expect(createProjectSchema.safeParse({ name: 'Kanbot', key: '', description: '' }).success).toBe(
      true,
    );
    expect(updateProjectSchema.safeParse({ name: 'Kanbot', key: '', description: '' }).success).toBe(
      false,
    );
  });

  it('rejects keys outside 2–6 letters', () => {
    expect(projectKeySchema.safeParse('K').success).toBe(false);
    expect(projectKeySchema.safeParse('ABCDEFG').success).toBe(false);
    expect(projectKeySchema.safeParse('KA1').success).toBe(false);
    expect(projectKeySchema.parse('kan').toUpperCase()).toBe('KAN');
  });

  it('rejects an empty name and over-long fields', () => {
    const noName = createProjectSchema.safeParse({ name: '   ', key: '', description: '' });
    expect(noName.success).toBe(false);
    expect(noName.error?.issues[0]?.message).toBe('Name is required');

    expect(createProjectSchema.safeParse({ name: 'x'.repeat(81), key: '', description: '' }).success).toBe(
      false,
    );
    expect(
      createProjectSchema.safeParse({ name: 'Kanbot', key: '', description: 'x'.repeat(501) }).success,
    ).toBe(false);
  });
});

describe('suggestProjectKey', () => {
  it('mirrors the server key generation', () => {
    expect(suggestProjectKey('Mobile App Redesign')).toBe('MAR');
    expect(suggestProjectKey('Kanbot')).toBe('KAN');
    expect(suggestProjectKey('A')).toBe('PRJ');
    expect(suggestProjectKey('1234')).toBe('PRJ');
  });
});

describe('projectTone', () => {
  it('is deterministic and only returns known tones', () => {
    expect(projectTone('p-1')).toBe(projectTone('p-1'));
    expect(PROJECT_TONES).toContain(projectTone('p-1'));
    expect(projectTone('p-1')).not.toBe('');
  });

  it('maps ids to a stable CSS class', () => {
    expect(projectToneClass('p-1')).toBe(`project-tone-${projectTone('p-1')}`);
  });
});
