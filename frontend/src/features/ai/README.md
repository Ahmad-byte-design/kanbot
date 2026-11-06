# AI assistant

The project-aware AI assistant: a chat drawer available from every project
page, AI-drafted todos, capacity-aware sprint planning, and sprint summaries.
This feature owns `AI-1`…`AI-5`; the Express API in
[`../../../../server`](../../../../server) is not modified here.

## Requirement map

| ID | Implementation |
|---|---|
| AI-1 Ask AI | `components/assistant-trigger.tsx` (header button), `components/assistant-panel.tsx` (drawer), `store/assistant.store.ts` (conversation), `hooks/use-ai-chat.ts` |
| AI-2 Generate todos | `components/generate-todos-dialog.tsx`, `hooks/use-generate-todos.ts`, `hooks/use-bulk-create-todos.ts` |
| AI-3 Plan sprint | `components/plan-sprint-dialog.tsx`, `hooks/use-plan-sprint.ts` |
| AI-4 Summarize sprint | `components/summarize-sprint-dialog.tsx`, `components/sprint-summary-panel.tsx`, `hooks/use-summarize-sprint.ts` |
| AI-5 Loading / errors / status | `components/ai-bits.tsx`, `hooks/use-ai-status.ts`, `Markdown` in `components/markdown.tsx` |

`AssistantHost` is mounted once by `ProjectShell`, so the assistant exists on
the backlog, board, sprint list and sprint report. `AssistantTrigger` is part
of `ProjectWorkspaceHeader`, which puts **Ask AI** in the top bar of every
project page. The backlog's empty state also opens AI-2 directly.

## Routes and entry points

The feature adds no routes; it layers onto the existing project workspace.

| Entry point | Opens |
|---|---|
| **Ask AI** in the workspace header | The assistant drawer (AI-1) |
| **Create todos** quick action, or the empty backlog's **Generate with AI** | `GenerateTodosDialog` (AI-2) |
| **Plan sprint** quick action | `PlanSprintDialog` (AI-3) |
| **Summarize sprint** quick action | `SummarizeSprintDialog` (AI-4) |
| **Summarize** on the active board header | The same summary dialog, preselected to the running sprint |
| **Generate AI summary** checkbox in `CompleteSprintDialog` | Fires AI-4 after the sprint closes |
| **AI summary** panel on a sprint report | `SprintSummaryPanel`: saved summary, or generate/regenerate (AI-4) |

The dialogs are orchestrated by `store/assistant.store.ts` so a quick action can
close the drawer and open a dialog without stacked focus traps.

## Assistant drawer (AI-1)

- The conversation lives in a Zustand store, not in component state. Closing
  the drawer keeps it; changing project or clicking **New chat** clears it.
- `AssistantPanel` posts the *whole* conversation to
  `POST /projects/:id/ai/chat` on every send (the endpoint is stateless), capped
  at the server's 30-message history limit.
- Replies render as Markdown through a small safe renderer
  (`components/markdown.tsx`) — no `dangerouslySetInnerHTML`. It supports
  headings, paragraphs, lists, blockquotes, code fences and inline
  bold/italic/code/links.
- `Enter` sends, `Shift + Enter` inserts a newline. The composer disables while
  a reply is in flight and shows a three-dot **Thinking…** status.
- A failed turn stays visible in the transcript. **Try again** re-sends the
  history without duplicating the user message.
- `GET /ai/status` is requested only when the drawer opens, with
  `staleTime: Infinity` and `gcTime: Infinity`, so the **Mock AI** badge is
  stable and the endpoint is called at most once per session.
- Messages and dialogs are reset on project switch by `syncProject`.

## Generate todos (AI-2)

1. The user describes a feature and optionally asks for `1`–`10` drafts
   (default `5`).
2. **Generate** calls `POST /projects/:id/ai/generate-todos`; nothing is saved.
3. Drafts appear checked by default with an editable title, type, priority and
   story points. Each can be unchecked or removed.
4. **Add N todos to backlog** sends only the checked drafts to
   `POST /projects/:id/todos/bulk` as `{ todos: CreateTodoRequest[] }`, closes
   the dialog and refreshes the backlog and project counters.

Closing or cancelling before that final click leaves the server untouched.

## Plan sprint (AI-3)

1. Capacity is required (`1`–`200` story points); focus is optional.
2. **Suggest plan** calls `POST /projects/:id/ai/plan-sprint` and shows the
   suggested goal (editable), the matching backlog todos (checked checkboxes),
   a running `selected / capacity` total with an over-capacity warning, and the
   assistant's reasoning.
3. **Create sprint with N todos** calls `POST /projects/:id/sprints` with
   `{ goal, todoIds }`. The server moves those backlog todos into the new
   planned sprint; the page navigates back to the backlog where the sprint
   appears on the planned shelf.

The selected points are recomputed from the live backlog cache, so unchecking a
todo updates the total immediately.

## Sprint summaries (AI-4)

- `POST /sprints/:id/ai/summary` works for active and completed sprints. The
  server persists the Markdown on the sprint as `summary`.
- The dialog lists every non-planned sprint, preselects the active one (or the
  sprint that opened it), and shows an existing summary before offering
  **Regenerate**.
- Generated content is cached in place for the board (`sprintKeys.board`) and
  the sprint list/project caches are invalidated, so the report and board agree
  without a refetch flicker.
- The report page renders the saved summary with its source badge and generated
  time. **Regenerate** replaces it on the server.

## Errors, loading and honesty (AI-5)

- Every mutation has a pending state: disabled buttons, a spinner on the action,
  and skeletons or a **Thinking…** bubble where content is expected.
- `AiErrorAlert` shows the server's own message and a **Try again** action.
  This covers the two contract errors explicitly:
  - `502 AI_ERROR` — the provider failed or returned unusable output;
  - `429 RATE_LIMITED` — too many AI requests.
- Every surface that can save something carries the disclaimer
  *"AI can make mistakes. Review before saving."*
- Responses expose their `source` (`mock` or `ai`); the drawer shows a
  **Mock AI** badge when `GET /ai/status` reports `mode === "mock"`, and each
  draft/summary carries its own source badge.

## API contract

| Endpoint | Request | Response |
|---|---|---|
| `GET /ai/status` | — | `{ mode: 'mock' \| 'ai', model: string \| null }` |
| `POST /projects/:id/ai/chat` | `{ messages: ChatMessage[] }` | `{ message, source }` |
| `POST /projects/:id/ai/generate-todos` | `{ prompt, count }` | `{ todos: DraftTodo[], source }` |
| `POST /projects/:id/ai/plan-sprint` | `{ capacity, focus? }` | `{ goal, todoIds, totalPoints, reasoning, source }` |
| `POST /projects/:id/todos/bulk` | `{ todos: CreateTodoRequest[] }` | `201 { todos }` |
| `POST /sprints/:id/ai/summary` | — | `{ sprint, summary }` |

All requests use `src/services/ai.ts`, which goes through the shared axios
instance and inherits the bearer token, `ApiError` normalisation and the global
401 handler. `todosService.bulkCreate` adds the one non-AI endpoint used here.

## Cache strategy

`lib/ai-cache.ts` centralises the writes:

- **Created todos** invalidate the backlog, the project todo list, and the
  project detail/list counters.
- **Sprint summaries** are written into `sprintKeys.board(projectId, sprintId)`
  in place, then the sprint list and project caches are invalidated.
- **Sprint creation** (AI-3) reuses `useCreateSprint`; the dialog additionally
  invalidates the backlog because checking todos moved them out of it.

Keys live in `query-keys.ts`:

```ts
['ai']
['ai', 'status']
```

## Structure

```
features/ai/
├── components/
│   ├── ai-bits.tsx               # source badge, disclaimer, skeleton, retry error
│   ├── assistant-host.tsx        # mount point + dialog orchestration
│   ├── assistant-panel.tsx       # AI-1 drawer, quick actions, composer
│   ├── assistant-trigger.tsx     # "Ask AI" header button
│   ├── generate-todos-dialog.tsx # AI-2 draft review + bulk save
│   ├── markdown.tsx              # safe Markdown → React renderer
│   ├── plan-sprint-dialog.tsx    # AI-3 capacity, preview, create
│   ├── sprint-summary-panel.tsx  # AI-4 report-page panel
│   ├── summarize-sprint-dialog.tsx
│   └── summary-content.tsx       # shared Markdown + generated-at header
├── constants/ai.constants.ts     # limits and copy
├── hooks/                        # status, chat, generate, plan, bulk, summarize
├── lib/
│   ├── ai-cache.ts               # cache writes + date/source formatting
│   └── ai-meta.ts                # draft rows, selections, choices, local ids
├── query-keys.ts
├── schema/ai.schema.ts           # Zod form validation → request bodies
├── store/assistant.store.ts      # conversation + open/dialog state
├── tests/ai-flow.test.tsx
└── types/ai.types.ts
```

Shared primitives used here: `Drawer` (focus trap, Escape/backdrop close,
scroll lock), `Modal`, `Button`, `Alert`, `TextField`, `TextareaField` and
`SelectField`.

## Tests

`tests/ai-flow.test.tsx` drives the real app through a stateful axios-adapter
backend and covers:

1. chat history sent on every turn, Markdown rendering, conversation retention
   across close/open, **New chat**, and `Shift + Enter`;
2. generated drafts, editing/checking, and the exact bulk-save body;
3. a capacity-aware plan, running total, unchecking, and the created sprint
   request;
4. summarizing the active sprint, the saved summary on the report, and
   regeneration;
5. a `502 AI_ERROR` retry in the generate dialog;
6. a `429 RATE_LIMITED` retry that does not duplicate the chat message.

Run the suite from `frontend/`:

```bash
npm test
```
