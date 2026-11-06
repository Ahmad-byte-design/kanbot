import { useQuery } from '@tanstack/react-query';
import { aiService } from '../../../services/ai';
import { aiKeys } from '../query-keys';

/**
 * AI-5: read the provider mode once per session. Only fetch when something
 * that shows the badge is actually open, so ordinary page loads stay quiet.
 */
export function useAiStatus(enabled = true) {
  return useQuery({
    queryKey: aiKeys.status(),
    queryFn: () => aiService.status(),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}
