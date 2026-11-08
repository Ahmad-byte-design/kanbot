import type { ProjectBackground } from '../types/api';
import { request } from './client';

interface BackgroundsResponse {
  backgrounds: ProjectBackground[];
}

/** Public endpoints for the images shipped with the server. */
export const assetsService = {
  backgrounds(): Promise<BackgroundsResponse> {
    return request<BackgroundsResponse>('GET', '/assets/backgrounds');
  },
};
