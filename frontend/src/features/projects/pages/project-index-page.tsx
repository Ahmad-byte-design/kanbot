import { Navigate, useParams } from 'react-router';
import { PROJECT_ROUTES } from '../constants/projects.constants';

/** `/projects/:projectId` → `/projects/:projectId/backlog`. */
export function ProjectIndexPage() {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) return <Navigate to={PROJECT_ROUTES.list} replace />;

  return <Navigate to={PROJECT_ROUTES.backlog(projectId)} replace />;
}
