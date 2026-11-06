import { Navigate, Route, Routes } from 'react-router';
import {
  AUTH_ROUTES,
  FullPageLoader,
  GuestRoute,
  LoginPage,
  ProtectedRoute,
  SignupPage,
  useAuthBootstrap,
  useAuthSession,
} from './features/auth';
import { SessionError } from './features/auth/components/session-error';
import { ProjectBacklogPage } from './features/backlog';
import {
  ProjectBoardPage,
  ProjectSprintsPage,
  SprintDetailPage,
} from './features/sprints';
import {
  PROJECT_ROUTES,
  PROJECT_ROUTE_PATTERNS,
  ProjectIndexPage,
  ProjectsPage,
} from './features/projects';
import { ApiError, errorMessage } from './services/client';
import { NotFoundPage } from './pages/not-found-page';

function App() {
  const { isReady, error, retry } = useAuthBootstrap();
  const { signOut } = useAuthSession();
  const sessionExpired = error instanceof ApiError && error.status === 401;

  if (error && !sessionExpired) {
    return <SessionError message={errorMessage(error)} onRetry={retry} onSignOut={signOut} />;
  }

  if (!isReady) {
    return <FullPageLoader label="Checking your session…" />;
  }

  return (
    <Routes>
      <Route path={AUTH_ROUTES.root} element={<Navigate to={PROJECT_ROUTES.list} replace />} />
      <Route
        path={AUTH_ROUTES.login}
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path={AUTH_ROUTES.register}
        element={
          <GuestRoute>
            <SignupPage />
          </GuestRoute>
        }
      />
      <Route
        path={PROJECT_ROUTES.list}
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={PROJECT_ROUTE_PATTERNS.project}
        element={
          <ProtectedRoute>
            <ProjectIndexPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={PROJECT_ROUTE_PATTERNS.backlog}
        element={
          <ProtectedRoute>
            <ProjectBacklogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={PROJECT_ROUTE_PATTERNS.board}
        element={
          <ProtectedRoute>
            <ProjectBoardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={PROJECT_ROUTE_PATTERNS.sprints}
        element={
          <ProtectedRoute>
            <ProjectSprintsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={PROJECT_ROUTE_PATTERNS.sprint}
        element={
          <ProtectedRoute>
            <SprintDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
