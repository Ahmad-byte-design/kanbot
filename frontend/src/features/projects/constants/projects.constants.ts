export const PROJECT_ROUTES = {
  list: '/projects',
  project: (projectId: string) => `/projects/${projectId}`,
  backlog: (projectId: string) => `/projects/${projectId}/backlog`,
  board: (projectId: string) => `/projects/${projectId}/board`,
  sprints: (projectId: string) => `/projects/${projectId}/sprints`,
  sprint: (projectId: string, sprintId: string) =>
    `/projects/${projectId}/sprints/${sprintId}`,
} as const;

/** Route patterns for the router (params stay placeholders). */
export const PROJECT_ROUTE_PATTERNS = {
  project: '/projects/:projectId',
  backlog: '/projects/:projectId/backlog',
  board: '/projects/:projectId/board',
  sprints: '/projects/:projectId/sprints',
  sprint: '/projects/:projectId/sprints/:sprintId',
} as const;

export const PROJECT_LIMITS = {
  nameMax: 80,
  descriptionMax: 500,
  keyMin: 2,
  keyMax: 6,
} as const;

export const PROJECT_MESSAGES = {
  listTitle: 'Projects',
  listDescription:
    'Every project holds one backlog, its sprints and the todos inside them. Pick up where you left off, or start something new.',
  emptyTitle: 'Your first board is one project away',
  emptyDescription:
    'A project keeps the backlog, sprints and todos for one piece of work together. Create one and Kanbot opens its backlog.',
  keyHintCreate: 'Optional — 2 to 6 letters. Leave it blank and Kanbot suggests one from the name.',
  keyHintEdit:
    'Changing the key only affects new todos. Existing todos keep the key they were created with.',
  deleteWarning: 'This also deletes every todo and sprint inside it. This cannot be undone.',
} as const;
