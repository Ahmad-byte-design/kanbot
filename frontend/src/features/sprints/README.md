# Sprints and board

Sprint planning, the active sprint board and the sprint archive. This feature
owns `SPR-1`…`SPR-7`; the API lives in [`../../../../server`](../../../../server)
and is not modified here.

## Routes

| Path | Screen |
|---|---|
| `/projects/:projectId/backlog` | Backlog board **plus** the planned sprint shelf (SPR-1…SPR-3) |
| `/projects/:projectId/board` | Active sprint board (SPR-4…SPR-6) |
| `/projects/:projectId/sprints` | All sprints, active → planned → completed (SPR-7) |
| `/projects/:projectId/sprints/:sprintId` | One sprint's report, todos and summary (SPR-7) |

The sidebar's Board and Sprints entries are real `NavLink`s. The sprint report
route also highlights "Sprints", because it is part of the archive.

## Requirement map

| ID | Implementation |
|---|---|
| SPR-1 | `components/planned-sprints.tsx` + `planned-sprint-section.tsx`; `SprintFormDialog` creates a planned sprint |
| SPR-2 | `SprintFormDialog` (edit) and `DeleteSprintDialog` (confirm; todos return to the backlog) |
| SPR-3 | `StartSprintDialog`; `useStartSprint`; disabled start button with an explanation while another sprint runs |
| SPR-4 | `pages/project-board-page.tsx`, `SprintBoardHeader`, `SprintBoard`, `SprintBoardCard`, `SprintBoardEmptyState` |
| SPR-5 | `SprintBoard` drag handlers, `useMoveBoardTodo`, `moveBoardTodo`, `boardDropPosition`, `SprintBoardCardMenu` |
| SPR-6 | `CompleteSprintDialog`; `useCompleteSprint`; navigation to the report |
| SPR-7 | `pages/project-sprints-page.tsx`, `SprintHistoryCard`, `pages/sprint-detail-page.tsx` |

## Data flow

- **Planned shelf.** The backlog page issues one `GET /projects/:id/todos` and
  groups the result by `sprintId`. Each planned section receives its own slice,
  so N planned sprints do not become N requests. Header counts and point totals
  come from the sprint's `stats` on `GET /projects/:id/sprints`.
- **Board.** `GET /sprints/:id/todos` returns `{ sprint, columns }`. Columns are
  already ordered by the server. The header reads `sprint.stats` from the same
  response, so optimistic moves update progress immediately.
- **Move.** `POST /todos/:id/move` accepts `{ sprintId?, status?, position }`.
  Within a sprint, `order` is scoped to one status column: the dragged card is
  removed from its source column, the target column is inserted into at
  `position`, and both columns are renumbered `0..n-1`. `boardDropPosition`
  accounts for the removal when the drop stays in the same column.
- **Completion.** Unfinished todos move to the backlog (default) or a planned
  sprint. The server snapshots the final numbers into `completedStats`, which
  the report prefers over live stats; `carriedOver` records the unfinished
  count.
- **AI summary (AI-4).** The board header's **Summarize** action opens the AI
  feature's summary dialog for the running sprint. The completion dialog also
  offers an optional **Generate AI summary** checkbox that fires the same
  request after the sprint closes. The report renders the saved summary through
  `SprintSummaryPanel`, which can generate or regenerate it. The request and
  cache writes live in `features/ai`.
- **Cache.** `invalidateSprintDependents` refreshes the sprint list, project
  detail/list and the project's todo list. Completion and deletion also
  invalidate the backlog. Optimistic board moves keep the previous response in
  the mutation context and restore it on failure.

## Query keys

`query-keys.ts` is canonical:

```ts
['sprints', projectId, 'list']
['sprints', projectId, 'detail', sprintId]
['sprints', projectId, 'board', sprintId]
```

Every entry shares the `['sprints', projectId]` prefix, so one invalidate call
covers the shelf, history, report and board. The backlog re-exports `sprintKeys`
from `features/backlog/query-keys.ts` instead of defining its own.

## Server rules reflected in the UI

- Only one sprint can be active per project. Planned sections disable Start and
  explain which sprint is running; the server also returns `409`.
- Only planned sprints can be deleted or started. Active and completed sprints
  show no delete action.
- Completed sprints are immutable history: they are never offered as a
  destination for todos, and their board is read-only.
- Card clicks open the existing backlog `TodoFormDialog` (BL-3), so todo editing
  is not duplicated. Status changes from that dialog flow through the normal
  update path; the board menu uses the move endpoint instead.

## Files

```
features/sprints/
├── components/
│   ├── complete-sprint-dialog.tsx     # SPR-6
│   ├── delete-sprint-dialog.tsx       # SPR-2
│   ├── planned-sprint-section.tsx     # SPR-1…SPR-3
│   ├── planned-sprints.tsx            # shelf + dialog orchestration
│   ├── sprint-board.tsx               # SPR-4 / SPR-5 columns and drag
│   ├── sprint-board-card.tsx          # draggable card
│   ├── sprint-board-card-menu.tsx     # keyboard-accessible moves
│   ├── sprint-board-empty-state.tsx   # no active sprint
│   ├── sprint-board-header.tsx        # goal, dates, progress
│   ├── sprint-board-skeleton.tsx
│   ├── sprint-form-dialog.tsx         # create/edit
│   ├── sprint-history-card.tsx        # SPR-7 row
│   ├── sprint-status-badge.tsx
│   └── start-sprint-dialog.tsx        # SPR-3
├── constants/sprints.constants.ts     # limits, labels, copy
├── hooks/                             # list, detail, board, project todos, mutations
├── lib/
│   ├── sprint-meta.ts                 # dates, progress, stats, drop positions
│   └── sprint-cache.ts                # optimistic move + invalidators
├── pages/                             # board, list, report
├── query-keys.ts
├── schema/sprint.schema.ts            # form + start validation
├── tests/
│   ├── sprint.schema.test.ts          # dates, stats, drop positions, cache move
│   └── sprint-flow.test.tsx           # planned CRUD, start, board, rollback, complete, history
└── types/sprints.types.ts
```

## Tests

`sprint-flow.test.tsx` uses a stateful axios adapter that mirrors the Express
routes: sprint ordering, per-column moves, optimistic progress, rollback on a
failed move, completion destinations and the saved summary. The suite runs with
`npm test` from `frontend/`.

## AI integration

AI summaries are implemented by the [`ai` feature](../ai/README.md) and wired in
here at three points:

- `SprintBoardHeader` accepts `onSummarize`, and `ProjectBoardPage` owns the
  `SummarizeSprintDialog` state;
- `CompleteSprintDialog` offers an optional **Generate AI summary** checkbox
  that runs after a successful completion;
- `SprintDetailPage` renders `SprintSummaryPanel`, which prefers a freshly
  generated summary, then the one saved on the sprint, and offers
  **Regenerate**.

The summary is Markdown, persisted on the sprint by
`POST /sprints/:id/ai/summary`, and shown with its source badge and generated
time. The AI-1…AI-5 assistant itself is documented in
[`src/features/ai/README.md`](../ai/README.md).
