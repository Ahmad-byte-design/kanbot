# Projects feature

Project list, create, edit, delete and the URL-based project switcher, wired to
`/projects` in the Kanbot API. A project owns one backlog, its sprints and the
todos inside them; this feature is the workspace index and the frame the backlog
feature renders into.

| Requirement | Where |
|---|---|
| PRJ-1 List projects | `pages/projects-page.tsx`, `components/project-card.tsx` |
| PRJ-2 Create project | `components/project-form-dialog.tsx` + `hooks/use-create-project.ts` |
| PRJ-3 Edit project | same dialog in `edit` mode + `hooks/use-update-project.ts` |
| PRJ-4 Delete project | `components/delete-project-dialog.tsx` + `hooks/use-delete-project.ts` |
| PRJ-5 Switch project | `components/project-switcher.tsx`, `hooks/use-project.ts` |

## Routes

| Path | Screen |
|---|---|
| `/projects` | Project list, create, edit and delete |
| `/projects/:projectId` | Redirects to the project's backlog |
| `/projects/:projectId/backlog` | Project workspace; the backlog page is owned by the backlog feature |

Route helpers live in `constants/projects.constants.ts`:

```ts
PROJECT_ROUTES.list; // "/projects"
PROJECT_ROUTES.project(id); // "/projects/<id>"
PROJECT_ROUTES.backlog(id); // "/projects/<id>/backlog"
PROJECT_ROUTE_PATTERNS.backlog; // "/projects/:projectId/backlog"
```

`ProjectIndexPage` redirects `/projects/:projectId` to the backlog route. The
backlog page (in `features/backlog`) reads `:projectId` with `useParams` and
renders `ProjectShell`, so switching projects and reloading the page resolve to
the same project. The project is never copied into component state.

## Public API

```ts
import {
  PROJECT_ROUTES,
  PROJECT_ROUTE_PATTERNS,
  ProjectIndexPage,
  ProjectsPage,
  projectKeys,
  useProjects,
  useProject,
} from '../features/projects';
```

The barrel (`index.ts`) also exports the dialog, shell, card and switcher
components, the five hooks, the Zod schemas and the tone helpers. The backlog
page lives in `features/backlog` and imports these shared pieces; it is not
re-exported here.

## Data flow

```ts
projectKeys.all; // ["projects"]
projectKeys.list(); // ["projects", "list"]
projectKeys.detail(id); // ["projects", "detail", id]
```

- `useProjects()` → `GET /projects` for the list, the switcher and the summary
  counters.
- `useProject(id)` → `GET /projects/:id` for the workspace. A `404` is not
  retried: it means the project was deleted or belongs to another account, so
  the page shows a "no longer here" state with a route back.
- Create/update write the returned project into its detail key and invalidate the
  list, so counters stay accurate without a manual refetch.
- Delete invalidates the list. The server cascades todos and sprints; the UI
  warns about that before confirming. The cached detail is left alone (it is
  stale immediately), so revisiting the deleted URL refetches and shows the
  not-found state instead of refetching while the workspace is still mounted.

Queries are `staleTime`-free on purpose: the list is cheap and switching tabs
should show fresh counters. `refetchOnWindowFocus` is disabled globally.

## API contract

| Endpoint | Request | Response |
|---|---|---|
| `GET /projects` | — | `{ projects: ProjectWithStats[] }` |
| `GET /projects/:id` | — | `{ project: ProjectWithStats }` |
| `POST /projects` | `CreateProjectRequest` | `201 { project }` |
| `PATCH /projects/:id` | `UpdateProjectRequest` | `{ project }` |
| `DELETE /projects/:id` | — | `204`, cascades todos and sprints |

`ProjectWithStats.stats` carries `backlogCount`, `totalTodos` and
`activeSprint: { id, name } | null`. There is no client-side counter maths; every
number on screen comes from the API.

All requests go through `services/projects.ts`, which uses the shared axios
instance and therefore inherits the bearer token, `ApiError` normalisation and
the global 401 handler.

## Key rules and errors

Server rules, mirrored in `schema/project.schema.ts`:

- Name: 1–80 characters, required.
- Key: 2–6 letters, uppercased by the server.
- Description: up to 500 characters, optional.
- A blank key on create lets the server generate one from the name
  (`Mobile App Redesign` → `MAR`). The form shows the same suggestion.

The key field keeps the typed value as-is and uppercases visually with CSS;
Zod uppercases before submit. This avoids losing keystrokes to a controlled
re-render.

A duplicate key returns `409` with
`details: [{ path: "key", message: "This key is already used by another project" }]`.
`fieldErrors(error)` maps that detail onto the key field, so the message appears
under the input and the dialog stays open. Errors without a field path are shown
in an alert above the form.

## UX decisions

- **Tone per project.** `projectTone(project.id)` hashes the id to one of
  `indigo`, `teal`, `amber`, `rose`; `.project-tone-*` in `index.css` overrides
  `--tone` / `--tone-soft`. A project keeps the same accent on the list, in the
  switcher, in its monogram and in the workspace header.
- **A card grid, not a table.** Projects render as responsive cards (one column,
  two from `sm`, three from `xl`). Each card carries a tone accent bar, the
  monogram, key, name, two-line description, backlog/todo counters, the active
  sprint and an "Open backlog" cue. The whole card is the backlog link; edit and
  delete sit above that link so they stay independently clickable. Cards lift on
  hover and keep a visible focus ring for keyboard navigation.
- **Deleting names the project.** The confirmation title includes the project
  name and the copy spells out that every todo and sprint is deleted too.
- **Editing explains the key.** The edit dialog says changing the key only
  affects new todos; existing todos keep the key they were created with.
- **Creating opens the backlog.** After a successful create the dialog closes and
  the app navigates to the new project's backlog, as PRJ-2 requires.
- **Switcher is a menu.** Escape closes it and returns focus to the trigger;
  clicking outside closes it; the current project is checked; "All projects" and
  "New project" are available at the bottom so the switcher doubles as quick
  navigation.
- **Responsive shell.** Below `lg` the dark rail becomes a compact header
  (brand, "All projects", sign out, switcher, horizontal nav). Above `lg` it is
  a sticky full-height 272 px sidebar. Board and Sprints are real `NavLink`s,
  and the workspace header carries the **Ask AI** trigger on every page.
- **The shell is shared.** `ProjectShell` owns the rail, switcher, project
  navigation and the mounted AI assistant (`AssistantHost`), so every project
  page renders inside it without duplicating navigation or conversation state.

## Structure

```
features/projects/
├── components/
│   ├── delete-project-dialog.tsx   # PRJ-4 confirmation
│   ├── project-empty-state.tsx     # first-run invitation
│   ├── project-card.tsx            # PRJ-1 grid card
│   ├── project-form-dialog.tsx     # PRJ-2 / PRJ-3 form
│   ├── project-mark.tsx            # tinted monogram
│   ├── project-shell.tsx           # workspace rail + switcher + nav
│   ├── project-stats.tsx           # live counters
│   ├── project-switcher.tsx        # PRJ-5 menu
│   └── projects-skeleton.tsx       # grid and workspace loading states
├── constants/projects.constants.ts # routes, limits, copy
├── hooks/                          # one hook per query/mutation
├── lib/
│   └── project-tone.ts             # tone hash, key suggestion, initials
├── pages/
│   ├── projects-page.tsx           # PRJ-1 / 2 / 3 / 4
│   └── project-index-page.tsx      # /projects/:id → /backlog redirect
├── query-keys.ts
├── schema/project.schema.ts
├── tests/
│   ├── project.schema.test.ts
│   └── projects-flow.test.tsx
├── types/projects.types.ts
└── index.ts
```

Shared UI primitives (`Button`, `TextField`, `TextareaField`, `SelectField`,
`Alert`, `Modal`, `ConfirmDialog`) live in `src/components/ui/` and are used by
auth, projects and the backlog. Zod issues become field errors through the
shared `src/lib/zod-field-errors.ts` helper.

## Tests

```bash
npm test
```

`project.schema.test.ts` covers the Zod rules and the key-suggestion helper.
`projects-flow.test.tsx` runs a stateful axios-adapter backend covering list
counters, create → new backlog, the `409` key error under the field, edit with
the existing-todo-keys hint, named delete with cascade warning, switcher
navigation and the unknown-project screen.

The dialog tests also guard the modal focus behaviour: typing into a later field
must not jump focus back to the first one. `Modal` keeps `onClose` in a ref so an
inline callback cannot re-run the focus effect on every keystroke.
