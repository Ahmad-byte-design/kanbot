import { create } from 'zustand';
import type { ChatEntry, AssistantDialog } from '../types/ai.types';
import { localId } from '../lib/ai-meta';

interface AssistantState {
  /** The project the current conversation belongs to. */
  projectId: string | null;
  open: boolean;
  messages: ChatEntry[];
  dialog: AssistantDialog;
  /**
   * Resets the conversation when the URL moves to another project. Closing the
   * panel keeps the messages, which is the behaviour AI-1 asks for.
   */
  syncProject: (projectId: string) => void;
  openPanel: () => void;
  closePanel: () => void;
  appendMessage: (message: Omit<ChatEntry, 'id'>) => void;
  clearMessages: () => void;
  openDialog: (dialog: Exclude<AssistantDialog, null>) => void;
  closeDialog: () => void;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  projectId: null,
  open: false,
  messages: [],
  dialog: null,

  syncProject: (projectId) =>
    set((state) =>
      state.projectId === projectId
        ? state
        : { projectId, open: false, messages: [], dialog: null },
    ),

  openPanel: () => set({ open: true }),
  closePanel: () => set({ open: false }),

  appendMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, id: localId('message') }],
    })),

  clearMessages: () => set({ messages: [] }),

  openDialog: (dialog) => set({ dialog, open: false }),
  closeDialog: () => set({ dialog: null }),
}));
