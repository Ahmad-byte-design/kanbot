import { useMutation } from '@tanstack/react-query';
import { aiService } from '../../../services/ai';
import type { ChatMessage, ChatResponse } from '../../../types/api';

/** AI-1: stateless chat. The whole conversation goes up on every send. */
export function useAiChat(projectId: string) {
  return useMutation<ChatResponse, unknown, ChatMessage[]>({
    mutationFn: (messages) => aiService.chat(projectId, { messages }),
  });
}
