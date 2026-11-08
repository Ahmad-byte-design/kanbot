import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assetsService } from '../../../services/assets';
import { assetUrl } from '../../../services/client';
import type { ProjectBackground } from '../../../types/api';

export function useBackgrounds() {
  return useQuery<ProjectBackground[]>({
    queryKey: ['assets', 'backgrounds'],
    queryFn: async () => (await assetsService.backgrounds()).backgrounds,
    staleTime: 30 * 60_000,
    retry: false,
  });
}

/** Resolves a stored background id (`bg-6`) to an absolute image URL. */
export function useBackgroundUrl(id: string | null | undefined): string | null {
  const { data } = useBackgrounds();
  return useMemo(() => {
    if (!id) return null;
    const match = data?.find((background) => background.id === id);
    return assetUrl(match?.url);
  }, [data, id]);
}
