# Kanbot frontend

React 19 + TypeScript + Vite frontend for Kanbot. Authentication, projects,
the project backlog, sprint planning, the active sprint board and the AI
assistant are implemented against the Express API in [`../server`](../server).

## Run

```bash
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:4000/api
npm run dev                # http://localhost:5173
```

Start the API first:

```bash
cd ../server
npm install
npm run seed               # demo@kanbot.dev / password123
npm run dev                # http://localhost:4000/api
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check and production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest (schemas, store, auth, project, backlog, sprint and AI flows) |
| `npm run typecheck` | TypeScript only |

## Stack choices

| Concern | Choice |
|---|---|
| Routing | React Router 8 |
| HTTP client | Axios (one instance, request/response interceptors) |
| Server state | TanStack Query 5 (keys in feature `query-keys.ts` files) |
| Session state | Zustand 5 (persisted token only) |
| Forms/validation | Small controlled forms + Zod schemas |
| Styling | Tailwind CSS 4 with CSS-variable design tokens |
| Tests | Vitest + Testing Library + jsdom (axios adapter mock) |

## Auth implemented

| Requirement | Where |
|---|---|
| AUTH-1 Register | `/register`, `features/auth/pages/signup-page.tsx` |
| AUTH-2 Log in | `/login`, `features/auth/pages/login-page.tsx` |
| AUTH-3 Stay logged in | `useAuthBootstrap` validates the persisted token with `GET /auth/me` |
| AUTH-4 Log out | `useLogout` clears the session and TanStack cache |
| AUTH-5 Guards | `GuestRoute`, `ProtectedRoute` |
| AUTH-6 Expired session | `401` handler in `services/client.ts` + `main.tsx` |

Details:

- The API token is the only value persisted (`localStorage` key `auth-storage`).
- On startup the app shows a full-page loader while `GET /auth/me` validates it.
- Login/register `401`/`409`/validation messages are shown next to the relevant
  field or above the form.
- A `401` on any other request clears the session and returns to
  `/login?redirect=<current page>&expired=1`.
- The login page has a one-click demo credential filler.

## Projects implemented

| Requirement | Where |
|---|---|
| PRJ-1 List projects | `/projects`, responsive card grid in `features/projects/pages/projects-page.tsx` |
| PRJ-2 Create project | Create dialog; `409` key errors show under the key field |
| PRJ-3 Edit project | Edit dialog; hints that existing todo keys do not change |
| PRJ-4 Delete project | Named confirmation that todos and sprints are deleted too |
| PRJ-5 Switch project | Sidebar switcher; current project comes from the URL |

Routes:

| Path | Screen |
|---|---|
| `/projects` | Project card grid and management |
| `/projects/:projectId` | Redirect to the project's backlog |
| `/projects/:projectId/backlog` | Kanban backlog board plus planned sprint shelf (BL-1…BL-7, SPR-1…SPR-3) |
| `/projects/:projectId/board` | Active sprint board (SPR-4…SPR-6) |
| `/projects/:projectId/sprints` | All sprints, newest first (SPR-7) |
| `/projects/:projectId/sprints/:sprintId` | Sprint report, todos and AI summary (SPR-7) |

Notes:

- A create succeeds into the new project's backlog, as PRJ-2 requires.
- The project list and workspace show live counters from
  `ProjectWithStats.stats`; nothing is counted client-side.
- Each project gets a deterministic accent (`indigo`, `teal`, `amber`, `rose`)
  from `projectTone(project.id)`, so it looks the same everywhere.
- The workspace uses a dark sticky rail on desktop, collapsing to a compact
  header with a horizontal nav on mobile.

Full details: [`src/features/projects/README.md`](src/features/projects/README.md).

## Backlog implemented

| Requirement | Where |
|---|---|
| BL-1 List the backlog | `/projects/:projectId/backlog`, four-column board in `features/backlog/pages/project-backlog-page.tsx` |
| BL-2 Quick create | One-field create above the board; Enter to add |
| BL-3 Edit details | Large details dialog for title, description, type, status, priority, points, due date and labels |
| BL-4 Delete | Card menu → confirmation, or inline delete in the details dialog |
| BL-5 Reorder | Drag from the grip, plus "Move to top/bottom" within a column from the card menu |
| BL-6 Search and filters | Instant client-side search plus priority/type dropdowns |
| BL-7 Move to sprint | Sprint select in the details dialog and "Move to sprint" in the card menu |

Notes:

- The backlog is a kanban board grouped into To do, In progress, In review and
  Done. The server still owns one global order; columns are a grouped view, so
  grouping never re-sorts.
- Same-column drag posts a new global position. Cross-column drag only changes
  status via `PATCH /todos/:id`; the card menu offers the same status choices.
  The client updates optimistically and rolls back if a move fails.
- Search and filters are local for instant feedback. While they are active,
  dragging and order actions are disabled (with an explanation) because card
  positions become ambiguous; status changes from the menu stay available.
- Only planned and active sprints are offered as destinations; completed
  sprints are history and the API rejects additions to them with `409`.
- Create, edit, reorder, status changes and delete keep the backlog cache and
  the project counters in step; sprint moves use the same `PATCH /todos/:id`
  path.
- The empty backlog offers **Generate with AI**, which opens the AI-2 dialog
  without leaving the page. Nothing is saved until the drafts are confirmed.

Full details: [`src/features/backlog/README.md`](src/features/backlog/README.md).

## Sprints and board implemented

| Requirement | Where |
|---|---|
| SPR-1 Create a sprint | Planned shelf above the backlog; one `GET /projects/:id/todos` feeds every section |
| SPR-2 Edit / delete | Dialogs on each planned section; delete confirms and returns todos to the backlog |
| SPR-3 Start a sprint | Start dialog defaults to today and +14 days; disabled while another sprint runs; opens the board |
| SPR-4 Active board | `/projects/:id/board`: goal, dates, days left, dual progress bar, four counted columns |
| SPR-5 Drag and drop | `POST /todos/:id/move` with `status` + `position`, optimistic with rollback; card menu offers the same moves |
| SPR-6 Complete a sprint | Done/not-done counts, destination select (backlog by default or a planned sprint); opens the report |
| SPR-7 History and report | `/projects/:id/sprints` and per-sprint stats, todos and saved AI summary |

Notes:

- A sprint's `order` is scoped to each status column, unlike the backlog's one
  global list. Every board move therefore posts both the target status and a
  position inside that column.
- The board header reads its numbers from the board response, so an optimistic
  move updates the progress bar before the request finishes. A rejected move
  restores the exact previous columns and stats.
- The card menu ("Actions for KAN-3") mirrors dragging: change status or move to
  the top/bottom of the current column, so the board is keyboard accessible.
- Planned sections are grouped client-side from the project's single todo list;
  creating, editing, deleting or starting a sprint invalidates the sprint,
  project and planned-todo caches together.
- Completed sprints are history: their saved `completedStats` snapshot drives
  the report, and no todo can be added or moved inside them.
- Card clicks open the existing BL-3 details dialog rather than duplicating the
  todo form.
- The board header has a **Summarize** action, the completion dialog can
  optionally generate a summary, and the report renders the saved AI summary
  with a **Regenerate** action (AI-4).

Full details: [`src/features/sprints/README.md`](src/features/sprints/README.md).

## AI assistant implemented

| Requirement | Where |
|---|---|
| AI-1 Ask AI | **Ask AI** in the workspace header opens `features/ai/components/assistant-panel.tsx` on every project page |
| AI-2 Generate todos | **Create todos** quick action or the empty backlog's **Generate with AI**; drafts are editable and only checked ones are bulk-saved |
| AI-3 Plan sprint | **Plan sprint** dialog: capacity, optional focus, editable goal and todo selection against a running total |
| AI-4 Summarize sprint | **Summarize** on the board, the report panel, or after completing a sprint; the summary is saved on the sprint and can be regenerated |
| AI-5 States | Spinners/skeletons, server-message errors with **Try again**, the review disclaimer, and a **Mock AI** badge from `GET /ai/status` |

Notes:

- The conversation is held in a Zustand store, so closing the drawer keeps it;
  switching projects or **New chat** resets it.
- Each send posts the entire conversation to the stateless
  `POST /projects/:id/ai/chat` endpoint. Replies render through a small safe
  Markdown component, never `dangerouslySetInnerHTML`.
- The AI dialogs reuse the existing `Modal`, form fields, sprint-creation hook
  and backlog cache helpers instead of duplicating them.
- AI responses carry their `source` (`mock`/`ai`); the drawer and generated
  content show a matching badge.
- `502 AI_ERROR` and `429 RATE_LIMITED` surface the server message and a retry;
  nothing is saved automatically.

Full details: [`src/features/ai/README.md`](src/features/ai/README.md).

## API layer

`src/services/client.ts` exports a single axios instance:

- `baseURL` from `VITE_API_URL` (defaults to `http://localhost:4000/api`).
- A request interceptor attaches `Authorization: Bearer <token>`.
- A response interceptor converts every failure into `ApiError` (status, code,
  `details[]`) and fires the global 401 handler for protected requests.
- `request<T>()` is the only helper services use, so future endpoints get the
  same behaviour for free.

Services are grouped per resource: `auth.ts`, `projects.ts`, `todos.ts`,
`sprints.ts` and `ai.ts`.

TanStack Query keys live next to the feature that owns them, e.g.
`features/auth/query-keys.ts`. Add a `query-keys.ts` per feature so keys and
invalidations never drift apart. Sprint keys are canonical in
`features/sprints/query-keys.ts`; the backlog re-exports them so both features
share one sprint cache entry.

## Design tokens

`src/index.css` defines primitives → semantic tokens (`--background`,
`--primary`, `--border`, `--sidebar`, …) and maps them into Tailwind with
`@theme inline`. Components use utilities such as `bg-background`,
`text-muted-foreground` and `ring-ring`; no component hard-codes brand colours.
Project accents are token overrides: `.project-tone-*` sets `--tone` and
`--tone-soft`, which components read through `bg-tone-soft` / `text-tone`. Type,
priority and status tags have their own token families (`--type-*`,
`--priority-*`, `--status-*`, each with a `-soft` background) in both light and
dark themes; components use utilities such as `bg-priority-urgent-soft` and
`text-priority-urgent`. The `.dark` class is ready for a theme toggle.

## Structure

```
src/
├── App.tsx                 # route table + session bootstrap gate
├── main.tsx                # providers, API token wiring, 401 redirect
├── index.css               # design tokens + Tailwind theme + tone classes
├── assets/icons/           # one file per inline SVG icon, re-exported by index.ts
├── components/ui/          # Button, SelectField, TextField, TextareaField, Alert, Modal, Drawer…
├── lib/                    # shared helpers (Zod issues → field errors)
├── pages/                  # 404
├── services/               # axios instance + auth, project, todo, sprint and AI APIs
├── test/                   # vitest setup + axios adapter mock
├── types/api.ts            # copied from the server contract
├── features/auth/
│   ├── components/         # AuthLayout, PasswordField, SessionError…
│   ├── guards/             # GuestRoute, ProtectedRoute
│   ├── hooks/              # login, signup, session, logout
│   ├── lib/                # safe redirect helper
│   ├── pages/              # Login, Register
│   ├── query-keys.ts       # TanStack Query keys
│   ├── schema/             # Zod schemas
│   ├── store/              # Zustand session store
│   └── tests/              # schema, store, auth flow
├── features/projects/
│   ├── components/         # card grid, mark, dialogs, switcher, shell, skeletons
│   ├── constants/          # routes, limits, copy
│   ├── hooks/              # list, detail, create, update, delete
│   ├── lib/                # tone/key suggestions
│   ├── pages/              # list, redirect
│   ├── query-keys.ts       # TanStack Query keys
│   ├── schema/             # Zod schemas
│   ├── tests/              # schema + project flows
│   └── types/              # feature types
└── features/backlog/
    ├── components/         # kanban board, cards, filters, dialogs, menus, empty states
    ├── constants/          # limits, filter defaults, copy, tag styles
    ├── hooks/              # backlog, sprint options, create, update, move, delete
    ├── lib/                # cache sync, todo helpers, server field errors
    ├── pages/              # project backlog page (includes the planned shelf)
    ├── query-keys.ts       # todoKeys + re-exported sprintKeys
    ├── schema/             # todo form and quick-create schemas
    ├── tests/              # schema + backlog flow
    └── types/              # feature types

features/sprints/
├── components/             # planned shelf, dialogs, board, cards, menus, history
├── constants/              # limits, status labels/styles, copy
├── hooks/                  # sprints, board, project todos, create/update/delete/start/complete/move
├── lib/                    # dates, stats, progress, optimistic move, cache invalidation
├── pages/                  # board, sprint list, sprint report
├── query-keys.ts           # canonical sprintKeys shared with the backlog
├── schema/                 # sprint form + start schemas
├── tests/                  # schema/helpers + sprint flow
└── types/                  # feature types

features/ai/
├── components/             # drawer, trigger, Markdown, dialogs, summary panel, AI bits
├── constants/              # limits and copy
├── hooks/                  # status, chat, generate, plan, bulk save, summarize
├── lib/                    # cache writes, draft helpers, date/source formatting
├── query-keys.ts           # aiKeys (status cached for the session)
├── schema/                 # AI-2 / AI-3 form validation
├── store/                  # conversation + dialog state
├── tests/                  # AI flow with chat, drafts, planning and summaries
└── types/                  # feature types
```
