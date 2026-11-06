# Backlog feature

The project backlog: every todo that is not in a sprint, shown as a kanban
board grouped by status while keeping one global backlog order. It is wired to
the `/projects/:id/todos` and `/todos/:id` routes of the Kanbot API, is the
first screen of the project workspace and is the source of the counters shown
by the projects feature.

| Requirement | Where |
|---|---|
| BL-1 List the backlog | `pages/project-backlog-page.tsx`, `components/backlog-board.tsx`, `components/todo-card.tsx` |
| BL-2 Quick create | `components/backlog-quick-create.tsx` + `hooks/use-create-todo.ts` |
| BL-3 Edit details | `components/todo-form-dialog.tsx` + `hooks/use-update-todo.ts` |
| BL-4 Delete with confirmation | `components/delete-todo-dialog.tsx` + inline delete in the details dialog |
| BL-5 Reorder | `components/backlog-board.tsx` + `hooks/use-move-todo.ts`, keyboard/menu alternative in `components/todo-card-menu.tsx` |
| BL-6 Search and filters | `components/backlog-filters.tsx` + `lib/todo-meta.ts` |
| BL-7 Move between backlog and sprints | Sprint select in the details dialog, "Move to sprint" in the card menu, both via `PATCH /todos/:id` |

The board has four columns — To do, In progress, In review and Done — rendered
from `groupByStatus(todos)`. Grouping never re-sorts: each column is a filtered
view of the same global backlog order, so the server's `order` stays meaningful.

AI generation lives in the AI feature (AI-2). The empty backlog links to it
through a single **Generate with AI** action, which opens the shared
`GenerateTodosDialog`; drafts are reviewed there and nothing is saved until the
user confirms. See [`../ai/README.md`](../ai/README.md).

## Routes

| Path | Screen |
|---|---|
| `/projects/:projectId` | Redirects here (see `project-index-page.tsx`) |
| `/projects/:projectId/backlog` | This feature |

`App.tsx` imports `ProjectBacklogPage` from `features/backlog`. The page reads
`:projectId` with `useParams` and reuses the projects feature for everything
around the board: `ProjectShell`, `ProjectStats`, `ProjectMark`, the project
edit/create dialogs, the project delete dialog, `useProject`, `PROJECT_ROUTES`
and the project tone.

## Data flow

```ts
todoKeys.all; // ["todos"]
todoKeys.backlog(projectId); // ["todos", "backlog", projectId]

sprintKeys.all; // ["sprints"]
sprintKeys.list(projectId); // ["sprints", "list", projectId]
```

- `useBacklog(projectId)` → `GET /projects/:id/todos?sprintId=backlog`.
  The server returns the list already ordered by `order`; the client never
  sorts on first render.
- `useSprintOptions(projectId)` → `GET /projects/:id/sprints`. Used only for
  destinations (details form and card menu). Completed sprints are filtered out
  by `selectableSprints`, because the server rejects them with `409`.
- `useCreateTodo` → `POST /projects/:id/todos`.
- `useUpdateTodo` → `PATCH /todos/:id`, used for BL-3 field edits, BL-7 sprint
  moves and status changes (menu or cross-column drop).
- `useMoveTodo` → `POST /todos/:id/move` with `{ position }`.
- `useDeleteTodo` → `DELETE /todos/:id`.

All requests go through `services/todos.ts` / `services/sprints.ts`, which use
the shared axios instance and inherit the bearer token, `ApiError`
normalisation and the global 401 handler.

### Cache strategy

`lib/backlog-cache.ts` centralises the rules:

- **Create** replaces the card if it exists, otherwise appends it, then sorts by
  `order`. A todo created into a sprint never enters the backlog cache.
- **Update** does the same, so an edited card keeps its place and a todo moved
  to a sprint leaves the list immediately. A status-only change keeps `order`,
  so the card simply appears in its new column at the same global position.
- **Move** applies `reorderTodos` optimistically in `onMutate`, stores the
  previous list in the mutation context, and restores it in `onError`. On
  success it re-syncs the returned todo, because the server clamps the
  position and renumbers the list 0..n-1.
- **Delete** removes the card optimistically and restores the previous list on
  failure.
- Every successful mutation invalidates the project detail, the project list
  and the sprint list. Those own the counters shown on project cards, in the
  workspace header and in sprint stats, so they refresh without the backlog
  refetching on every keystroke.

## Board and reordering semantics

The backlog is one global list on the server; the board is a grouped view of
that list. `order` is shared across all status columns, so status changes never
invent a client-side position.

- **Same-column drag** starts from the grip handle and drops on a card in the
  same column. It posts `POST /todos/:id/move` with a global `position`, using
  `dropPosition` to insert before the card under the pointer. The server
  removes, clamps into `0..list.length`, inserts and renumbers the list; the
  client mirrors that in `reorderTodos` for the optimistic update.
- **Cross-column drag** only changes status: dropping on a card or column in
  another status sends `PATCH /todos/:id` with `{ status }`. No combined
  status-and-position request is made, because the API treats the backlog as a
  single list.
- Dropping on empty column space puts the card at the bottom of that column;
  dropping on a card inserts before it. The column header keeps the count and
  the story-point total in view.
- **Menu parity.** `TodoCardMenu` offers all four statuses as radio actions,
  plus "Move to top" and "Move to bottom" relative to the card's own column.
  `columnEdgePosition` converts a column edge into a global backlog index; the
  actions are disabled at the edges, and focus returns to the trigger after
  acting. Escape closes the menu. Drag is a pointer convenience, never the only
  way to change status or order.
- **Filters pause dragging, not status.** While a search or filter is active,
  card positions are ambiguous, so the grips and order actions are disabled and
  the menu explains why. Status radio actions stay available.
  `canReorder={!filtered}` is the single switch for both drag paths.
- A failed move shows one dismissible error above the board and the cards snap
  back to the previous order.

## Search and filters

Search and filters are client-side for instant feedback (BL-6):

- Search matches key, title, description and labels, case-insensitively.
- Priority and type are dropdowns; "Clear" appears only when something is
  active, and the summary switches from totals to "Showing X of Y" /
  "Points in view".
- Escape in the search box clears the query; the clear button does the same.
- Zero matches shows a dedicated empty state with "Clear filters" rather than
  pretending the backlog is empty.
- Creating a todo while filters are active clears the filters on success, so
  the new card is visible immediately.

## Quick create

One field, Enter (or "Add") to submit:

- The title is trimmed and validated with `quickTodoSchema` (1–200 chars).
- The input clears *before* the request so the next title can be typed
  immediately; on failure the submitted text is restored.
- Field errors from the server (`details[].path`) land under the input; other
  errors appear in an alert. Focus returns to the input either way.
- Escape clears the field.
- The empty state's "Create a todo" focuses this input using
  `QUICK_CREATE_INPUT_ID`; the page itself owns no input ref.

## Details dialog

`todo.key · Edit todo` opens as a large modal (`Modal size="lg"`) with every
editable field:

- Title (1–200), description (≤5000), type, status, priority, story points
  (`1, 2, 3, 5, 8, 13` or none), due date (`YYYY-MM-DD`), labels (comma
  separated, ≤10 × 30 chars, case-insensitively deduplicated) and sprint.
- Labels and empty option values are normalised by `todoFormSchema` before
  submit; the request body contains arrays and `null`s, not form strings.
- **Discard protection:** closing with unsaved changes shows an inline
  "Discard changes?" panel with "Keep editing" and "Discard changes". It is
  inline rather than a second modal so dialogs never stack.
- **Inline delete:** the footer's Delete action swaps in a destructive
  confirmation panel inside the same dialog. Deleting closes the dialog on
  success.
- The sprint select lists only planned and active sprints and always includes
  "Backlog (no sprint)", which covers BL-7 in both directions.
- Server field errors are reduced to their owning field by
  `todoServerErrors`, so `labels.0` still lands on Labels.

## Card menu

The card menu is the secondary-action surface:

- Open details
- Status → To do, In progress, In review, Done as `menuitemradio` options; the
  current status is checked and status changes work even while filters pause
  dragging
- Move to top / Move to bottom within the current column (with an explanation
  when filters disable them)
- Move to sprint → planned and active sprints only; the active sprint is
  labelled `Sprint N · Active`
- Delete todo → always routes through a single `ConfirmDialog` naming the key
  and title and warning that it cannot be undone

The menu renders in a portal so the board's horizontal scroll container cannot
clip it, flips above the trigger when viewport space is tight, and closes on
outside pointer-down, Escape, scroll or resize. Choosing an action that keeps
the card on screen returns focus to the trigger.

## API contract

| Endpoint | Request | Response |
|---|---|---|
| `GET /projects/:id/todos?sprintId=backlog` | — | `{ todos: Todo[] }`, ordered |
| `POST /projects/:id/todos` | `CreateTodoRequest` | `201 { todo }`, appended at `order = n` |
| `PATCH /todos/:id` | `UpdateTodoRequest` | `{ todo }`; changing `sprintId` moves lists |
| `POST /todos/:id/move` | `{ position: number }` | `{ todo }`; index clamped, list renumbered |
| `DELETE /todos/:id` | — | `204` |
| `GET /projects/:id/sprints` | — | `{ sprints: Sprint[] }`, active → planned → completed |

Server rules mirrored in the UI:

- Title 1–200; description ≤5000; labels ≤10, each ≤30 chars.
- Story points are one of `1, 2, 3, 5, 8, 13` or `null`.
- Due date is `YYYY-MM-DD` or `null`.
- Completed sprints reject additions/moves with `409`; they are never offered.
- A move to another sprint appends the todo to that sprint's list; a move back
  to the backlog appends it at the end.

## UX decisions

- **A real board, honestly grouped.** Four status columns, each with a status
  ribbon, dot, count and story-point total. Cards carry key, type, priority,
  due date, title, a two-line description, up to three labels and points.
  Status is conveyed by the column, so the card does not repeat a status tag.
- **The grip is the affordance.** Cards stay buttons for details, so drag is
  opt-in from a dedicated handle with an accessible label (`Reorder KAN-14`)
  and a title explaining when it is disabled.
- **Tags are tokens.** Type, priority and status colours live in `index.css`
  as light/dark token families (`--type-*`, `--priority-*`, `--status-*`) and
  are mapped with `@theme inline`; components use `bg-priority-urgent-soft`
  style utilities, never raw hex.
- **Overdue dates are visible.** A due date before today (UTC) is red and
  labelled "Overdue"; others stay muted so the board is not noisy.
- **Counter honesty.** The summary shows totals normally and
  "showing / total" only while filtered. Column counts and points are derived
  from the visible cards; no client-invented project counters.
- **Empty states differ.** An empty backlog invites a first todo or an AI
  draft; a filtered empty result offers to clear filters. Individual empty
  columns keep a dashed drop zone so cross-column dragging still has a target.
- **Responsive shell.** On mobile the four columns scroll horizontally as
  `16rem`-minimum tracks; from `lg` they become a four-column grid inside the
  workspace shell. Filters stack and cards keep key and title visible at narrow
  widths.

## Structure

```
features/backlog/
├── components/
│   ├── backlog-board.tsx         # four status columns, drag/drop, error surface
│   ├── backlog-empty-state.tsx   # BL-1 / BL-6 empty states + AI-2 entry point
│   ├── backlog-filters.tsx       # BL-6 search + priority/type
│   ├── backlog-quick-create.tsx  # BL-2 one-field create
│   ├── backlog-skeleton.tsx      # loading shape for the four-column board
│   ├── backlog-summary.tsx       # totals vs. filtered totals
│   ├── delete-todo-dialog.tsx    # BL-4 confirmation
│   ├── todo-card.tsx             # one board card
│   ├── todo-card-menu.tsx        # status + keyboard/menu reorder + sprint + delete
│   ├── todo-form-dialog.tsx      # BL-3 + BL-7 details, discard/delete
│   └── todo-tags.tsx             # type, priority, status, points, labels
├── constants/backlog.constants.ts # limits, filters, copy, tag styles
├── hooks/                         # one hook per query/mutation
├── lib/
│   ├── backlog-cache.ts           # optimistic insert/reorder/remove + invalidation
│   ├── server-errors.ts           # API details[] → todo field errors
│   └── todo-meta.ts               # filters, grouping, reorder maths, formatting
├── pages/project-backlog-page.tsx # composition, filters, dialogs, mutations
├── query-keys.ts                  # todoKeys + sprintKeys
├── schema/todo.schema.ts          # form + quick-create Zod schemas
├── tests/
│   ├── backlog-flow.test.tsx      # stateful API mock, 12 end-to-end tests
│   └── todo.schema.test.ts        # normalisation and validation
├── types/todo.types.ts
├── README.md
└── index.ts
```

Shared primitives used here: `Button`, `Alert`, `Modal`, `ConfirmDialog`,
`TextField`, `TextareaField`, `SelectField` (added for this feature) and
`src/lib/zod-field-errors.ts` (moved out of the projects feature so both can
use it).

## Tests

```bash
npm test
```

`backlog-flow.test.tsx` drives the real app through a stateful axios-adapter
backend and covers:

1. ordered board, per-column keys, column points, search, priority filter,
   filtered empty state and clearing;
2. quick create with filter clearing and focus retention;
3. server field errors under the quick-create input;
4. editing fields in the details dialog and the exact PATCH body;
5. discard protection and no request on discard;
6. delete only after the confirmation dialog;
7. menu reorder, request body and rollback on failure;
8. drag-and-drop from the grip onto a later card in the same column;
9. status change from the menu while filters pause dragging;
10. cross-column drag sending a status-only PATCH, never a move;
11. sprint move with active/planned options and no completed sprints;
12. the empty state, including the AI-2 dialog entry point.

`todo.schema.test.ts` covers label normalisation/deduplication, `'' → null`
mapping, unsupported story points, label count and date validation, title
trimming, and quick-create limits.
