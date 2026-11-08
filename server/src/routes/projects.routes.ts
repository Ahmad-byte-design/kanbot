import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { db, type ProjectRecord } from '../db/store.js';
import { conflict, notFound } from '../lib/errors.js';
import { currentUser } from '../middleware/auth.js';
import { parse } from '../middleware/validate.js';
import { getProject, now, toProjectWithStats } from '../services/board.service.js';
import {
  DEFAULT_PROJECT_STATUSES,
  PROJECT_ICONS,
  STATUS_COLORS,
  type ProjectStatus,
} from '../types/api.js';

export const projectsRouter = Router();

const backgroundSchema = z
  .string()
  .trim()
  .regex(/^bg-[a-z0-9-]+$/, 'Unknown background')
  .nullable();

const iconSchema = z.enum(PROJECT_ICONS);

const statusColorSchema = z.enum(STATUS_COLORS);
const statusNameSchema = z.string().trim().min(1, 'Name is required').max(40);

const keySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2,6}$/, 'Key must be 2–6 letters');

const createSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  key: keySchema.optional(),
  description: z.string().trim().max(500).default(''),
  background: backgroundSchema.optional().default(null),
  icon: iconSchema.optional().default('layers'),
});

const updateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  key: keySchema,
  description: z.string().trim().max(500),
  background: backgroundSchema,
  icon: iconSchema,
}).partial();

/** "Mobile App Redesign" → "MAR", "Kanbot" → "KAN". */
function keyFromName(name: string): string {
  const words = name.toUpperCase().replace(/[^A-Z ]/g, ' ').split(/\s+/).filter(Boolean);
  const key = words.length > 1 ? words.map((w) => w[0]).join('').slice(0, 4) : (words[0] ?? '').slice(0, 3);
  return key.length >= 2 ? key : 'PRJ';
}

function assertUniqueKey(userId: string, key: string, exceptId?: string) {
  if (db.data.projects.some((p) => p.userId === userId && p.key === key && p.id !== exceptId)) {
    throw Object.assign(conflict(`You already have a project with the key "${key}".`), {
      details: [{ path: 'key', message: 'This key is already used by another project' }],
    });
  }
}

/** "In QA" → "in_qa"; the id is stable while the display name stays editable. */
function slugifyStatus(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  return base.length >= 2 ? base : `status_${base || 'new'}`;
}

function uniqueStatusId(project: ProjectRecord, name: string): string {
  const base = slugifyStatus(name);
  let id = base;
  for (let index = 2; project.statuses.some((status) => status.id === id); index += 1) {
    id = `${base}_${index}`;
  }
  return id;
}

function renumberStatuses(project: ProjectRecord) {
  project.statuses
    .sort((a, b) => a.order - b.order)
    .forEach((status, index) => {
      status.order = index;
    });
}

/** Moves a status to a position, so `order` means "index" rather than a raw rank. */
function moveStatusTo(project: ProjectRecord, status: ProjectStatus, position: number) {
  project.statuses.sort((a, b) => a.order - b.order);
  project.statuses = project.statuses.filter((item) => item.id !== status.id);
  const index = Math.max(0, Math.min(position, project.statuses.length));
  project.statuses.splice(index, 0, status);
  // Give the moved status the target rank before normalising. The sort in
  // `renumberStatuses` is stable, so the fresh position survives the tie.
  status.order = index;
  renumberStatuses(project);
}

function findStatus(project: ProjectRecord, statusId: string): ProjectStatus {
  const status = project.statuses.find((item) => item.id === statusId);
  if (!status) throw notFound('Status');
  return status;
}

function defaultStatuses(): ProjectStatus[] {
  return DEFAULT_PROJECT_STATUSES.map((status) => ({ ...status }));
}

projectsRouter.get('/', (req, res) => {
  const user = currentUser(req);
  const projects = db.data.projects
    .filter((p) => p.userId === user.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(toProjectWithStats);
  res.json({ projects });
});

projectsRouter.post('/', (req, res) => {
  const user = currentUser(req);
  const body = parse(createSchema, req.body);
  let key = body.key ?? keyFromName(body.name);
  if (!body.key) {
    // If the generated key is taken, try KANA, KANB, ...
    const base = key;
    for (let i = 0; db.data.projects.some((p) => p.userId === user.id && p.key === key); i++) {
      key = (base + String.fromCharCode(65 + i)).slice(0, 6);
    }
  }
  assertUniqueKey(user.id, key);
  const project: ProjectRecord = {
    id: randomUUID(),
    userId: user.id,
    name: body.name,
    key,
    description: body.description,
    background: body.background,
    icon: body.icon,
    statuses: defaultStatuses(),
    nextTodoNumber: 1,
    nextSprintNumber: 1,
    createdAt: now(),
    updatedAt: now(),
  };
  db.write((d) => d.projects.push(project));
  res.status(201).json({ project: toProjectWithStats(project) });
});

projectsRouter.get('/:projectId', (req, res) => {
  const project = getProject(currentUser(req).id, req.params.projectId);
  res.json({ project: toProjectWithStats(project) });
});

projectsRouter.patch('/:projectId', (req, res) => {
  const user = currentUser(req);
  const project = getProject(user.id, req.params.projectId);
  const body = parse(updateSchema, req.body);
  if (body.key) assertUniqueKey(user.id, body.key, project.id);
  db.write(() => {
    Object.assign(project, body, { updatedAt: now() });
    // Note: existing todo keys keep their old prefix — keys never change.
  });
  res.json({ project: toProjectWithStats(project) });
});

// ───────────────────────────── Statuses (board columns) ─────────────────────────────

/** Adds a column, e.g. "Testing" or "Blocked". */
projectsRouter.post('/:projectId/statuses', (req, res) => {
  const project = getProject(currentUser(req).id, req.params.projectId);
  const body = parse(
    z.object({
      name: statusNameSchema,
      color: statusColorSchema.default('slate'),
      done: z.boolean().default(false),
      order: z.number().int().min(0).optional(),
    }),
    req.body,
  );
  db.write(() => {
    const status: ProjectStatus = {
      id: uniqueStatusId(project, body.name),
      name: body.name,
      color: body.color,
      done: body.done,
      order: body.order ?? project.statuses.length,
    };
    project.statuses.push(status);
    if (body.order === undefined) renumberStatuses(project);
    else moveStatusTo(project, status, body.order);
    project.updatedAt = now();
  });
  res.status(201).json({ project: toProjectWithStats(project) });
});

/** Renames, recolours, marks a column as done, or moves it in the order. */
projectsRouter.patch('/:projectId/statuses/:statusId', (req, res) => {
  const project = getProject(currentUser(req).id, req.params.projectId);
  const status = findStatus(project, req.params.statusId);
  const body = parse(
    z.object({
      name: statusNameSchema,
      color: statusColorSchema,
      done: z.boolean(),
      order: z.number().int().min(0),
    }).partial(),
    req.body,
  );

  db.write(() => {
    if (body.name !== undefined) status.name = body.name;
    if (body.color !== undefined) status.color = body.color;

    if (body.done !== undefined && body.done !== status.done) {
      status.done = body.done;
      // Keep todo completion timestamps in step with the column's meaning.
      for (const todo of db.data.todos) {
        if (todo.projectId !== project.id || todo.status !== status.id) continue;
        todo.completedAt = status.done ? (todo.completedAt ?? now()) : null;
        todo.updatedAt = now();
      }
    }

    if (body.order === undefined) renumberStatuses(project);
    else moveStatusTo(project, status, body.order);
    project.updatedAt = now();
  });
  res.json({ project: toProjectWithStats(project) });
});

/** Deletes a column only when no todo uses it, so work can never be orphaned. */
projectsRouter.delete('/:projectId/statuses/:statusId', (req, res) => {
  const project = getProject(currentUser(req).id, req.params.projectId);
  const status = findStatus(project, req.params.statusId);
  if (project.statuses.length <= 1) throw conflict('A project needs at least one status.');
  const inUse = db.data.todos.filter((todo) => todo.projectId === project.id && todo.status === status.id);
  if (inUse.length > 0) {
    throw conflict(
      `"${status.name}" still holds ${inUse.length} todo${inUse.length === 1 ? '' : 's'}. Move or delete them first.`,
    );
  }
  db.write(() => {
    project.statuses = project.statuses.filter((item) => item.id !== status.id);
    renumberStatuses(project);
    project.updatedAt = now();
  });
  res.json({ project: toProjectWithStats(project) });
});

projectsRouter.delete('/:projectId', (req, res) => {
  const project = getProject(currentUser(req).id, req.params.projectId);
  db.write((d) => {
    d.projects = d.projects.filter((p) => p.id !== project.id);
    d.sprints = d.sprints.filter((s) => s.projectId !== project.id);
    d.todos = d.todos.filter((t) => t.projectId !== project.id);
  });
  res.status(204).end();
});
