import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { db, type ProjectRecord, type TodoRecord } from '../db/store.js';
import { currentUser } from '../middleware/auth.js';
import { parse } from '../middleware/validate.js';
import {
  applyStatus,
  assertMovable,
  assertOpenSprint,
  byOrder,
  defaultStatusId,
  getProject,
  getTodo,
  hasStatus,
  listOf,
  moveTodo,
  nextOrder,
  now,
  renumber,
  statusRanks,
  toTodo,
} from '../services/board.service.js';
import { badRequest } from '../lib/errors.js';
import type { BulkCreateTodosResponse, TodoListResponse } from '../types/api.js';
import { createTodoSchema, priority, status, todoType, updateTodoSchema } from './schemas.js';

/** Mounted at /api. */
export const todosRouter = Router();

type CreateInput = z.infer<typeof createTodoSchema>;

function assertKnownStatus(project: ProjectRecord, statusId: string | undefined) {
  if (statusId && !hasStatus(project, statusId)) {
    throw badRequest('Choose a status that exists in this project.', 'status');
  }
}

/** Builds a record appended at the end of its list. Call inside db.write. */
function buildTodo(project: ProjectRecord, input: CreateInput): TodoRecord {
  const statusId = input.status ?? defaultStatusId(project);
  const todo: TodoRecord = {
    id: randomUUID(),
    projectId: project.id,
    sprintId: input.sprintId,
    key: `${project.key}-${project.nextTodoNumber++}`,
    title: input.title,
    description: input.description,
    type: input.type,
    status: statusId,
    priority: input.priority,
    storyPoints: input.storyPoints,
    labels: input.labels,
    dueDate: input.dueDate,
    order: 0,
    createdAt: now(),
    updatedAt: now(),
    completedAt: null,
  };
  applyStatus(todo, statusId);
  todo.order = nextOrder(todo);
  return todo;
}

const listQuery = z.object({
  sprintId: z.string().optional(),
  status: status.optional(),
  priority: priority.optional(),
  type: todoType.optional(),
  search: z.string().trim().max(100).optional(),
});

todosRouter.get('/projects/:projectId/todos', (req, res) => {
  const project = getProject(currentUser(req).id, req.params.projectId);
  const q = parse(listQuery, req.query);
  const search = q.search?.toLowerCase();
  const STATUS_RANK = statusRanks(project);
  const todos = db.data.todos
    .filter((t) => t.projectId === project.id)
    .filter((t) => q.sprintId === undefined || t.sprintId === (q.sprintId === 'backlog' ? null : q.sprintId))
    .filter((t) => !q.status || t.status === q.status)
    .filter((t) => !q.priority || t.priority === q.priority)
    .filter((t) => !q.type || t.type === q.type)
    .filter(
      (t) =>
        !search ||
        [t.key, t.title, t.description, ...t.labels].some((field) => field.toLowerCase().includes(search)),
    )
    .sort((a, b) =>
      a.sprintId === b.sprintId
        ? (a.sprintId === null ? 0 : (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99)) || byOrder(a, b)
        : (a.sprintId ?? '').localeCompare(b.sprintId ?? ''),
    );
  res.json({ todos: todos.map(toTodo) } satisfies TodoListResponse);
});

todosRouter.post('/projects/:projectId/todos', (req, res) => {
  const project = getProject(currentUser(req).id, req.params.projectId);
  const body = parse(createTodoSchema, req.body);
  assertOpenSprint(project.id, body.sprintId);
  assertKnownStatus(project, body.status);
  const todo = db.write((d) => {
    const t = buildTodo(project, body);
    d.todos.push(t);
    project.updatedAt = now();
    return t;
  });
  res.status(201).json({ todo: toTodo(todo) });
});

todosRouter.post('/projects/:projectId/todos/bulk', (req, res) => {
  const project = getProject(currentUser(req).id, req.params.projectId);
  const body = parse(z.object({ todos: z.array(createTodoSchema).min(1).max(50) }), req.body);
  body.todos.forEach((t, i) => {
    assertOpenSprint(project.id, t.sprintId, `todos.${i}.sprintId`);
    assertKnownStatus(project, t.status);
  });
  const todos = db.write((d) => {
    const created = body.todos.map((input) => {
      const t = buildTodo(project, input);
      d.todos.push(t); // push one by one so nextOrder sees the previous ones
      return t;
    });
    project.updatedAt = now();
    return created;
  });
  res.status(201).json({ todos: todos.map(toTodo) } satisfies BulkCreateTodosResponse);
});

todosRouter.get('/todos/:todoId', (req, res) => {
  const { todo } = getTodo(currentUser(req).id, req.params.todoId);
  res.json({ todo: toTodo(todo) });
});

todosRouter.patch('/todos/:todoId', (req, res) => {
  const { todo, project } = getTodo(currentUser(req).id, req.params.todoId);
  const { sprintId, status: newStatus, ...fields } = parse(updateTodoSchema, req.body);
  const sprintChanges = sprintId !== undefined && sprintId !== todo.sprintId;
  if (sprintChanges || (newStatus && newStatus !== todo.status)) assertMovable(todo);
  if (sprintChanges) assertOpenSprint(project.id, sprintId);
  assertKnownStatus(project, newStatus);

  db.write(() => {
    Object.assign(todo, fields, { updatedAt: now() });
    const targetSprint = sprintId === undefined ? todo.sprintId : sprintId;
    const targetStatus = newStatus ?? todo.status;
    const listChanges = targetSprint !== todo.sprintId || (targetSprint !== null && targetStatus !== todo.status);
    if (listChanges) {
      // Moving to another list: append at the end of it.
      moveTodo(todo, { sprintId: targetSprint, status: targetStatus, position: Number.MAX_SAFE_INTEGER });
    } else {
      applyStatus(todo, targetStatus); // backlog todos can change status without moving
    }
    project.updatedAt = now();
  });
  res.json({ todo: toTodo(todo) });
});

todosRouter.post('/todos/:todoId/move', (req, res) => {
  const { todo, project } = getTodo(currentUser(req).id, req.params.todoId);
  const body = parse(
    z.object({
      sprintId: z.string().nullable().optional(),
      status: status.optional(),
      position: z.number().int().min(0, 'Position must be 0 or more'),
    }),
    req.body,
  );
  assertMovable(todo);
  const sprintId = body.sprintId === undefined ? todo.sprintId : body.sprintId;
  if (sprintId !== todo.sprintId) assertOpenSprint(project.id, sprintId);
  assertKnownStatus(project, body.status);
  db.write(() => {
    moveTodo(todo, { sprintId, status: body.status ?? todo.status, position: body.position });
    project.updatedAt = now();
  });
  res.json({ todo: toTodo(todo) });
});

todosRouter.delete('/todos/:todoId', (req, res) => {
  const { todo } = getTodo(currentUser(req).id, req.params.todoId);
  db.write((d) => {
    d.todos = d.todos.filter((t) => t.id !== todo.id);
    renumber(listOf(todo));
  });
  res.status(204).end();
});
