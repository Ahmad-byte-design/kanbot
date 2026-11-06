import { useEffect } from 'react';
import { useAssistantStore } from '../store/assistant.store';
import { AssistantPanel } from './assistant-panel';
import { GenerateTodosDialog } from './generate-todos-dialog';
import { PlanSprintDialog } from './plan-sprint-dialog';
import { SummarizeSprintDialog } from './summarize-sprint-dialog';

interface AssistantHostProps {
  projectId: string;
}

/**
 * Mounts the assistant for a project workspace. Keeping the conversation in a
 * store (not in this component) means navigating between backlog, board and
 * sprint pages does not lose it; changing project resets it.
 */
export function AssistantHost({ projectId }: AssistantHostProps) {
  const syncProject = useAssistantStore((state) => state.syncProject);
  const dialog = useAssistantStore((state) => state.dialog);
  const closeDialog = useAssistantStore((state) => state.closeDialog);

  useEffect(() => {
    syncProject(projectId);
  }, [projectId, syncProject]);

  return (
    <>
      <AssistantPanel projectId={projectId} />

      {dialog === 'generate-todos' ? (
        <GenerateTodosDialog projectId={projectId} onClose={closeDialog} />
      ) : null}

      {dialog === 'plan-sprint' ? (
        <PlanSprintDialog projectId={projectId} onClose={closeDialog} />
      ) : null}

      {dialog === 'summarize' ? (
        <SummarizeSprintDialog projectId={projectId} onClose={closeDialog} />
      ) : null}
    </>
  );
}
