import type { ApiRequestOptions } from './api.types';

export async function apiRequest(path: string, options?: ApiRequestOptions): Promise<Response> {
  if (import.meta.env.VITE_API_MODE === 'browser') {
    const { browserRequest } = await import('./browserRequest');
    return browserRequest(path, options);
  }
  if (options) return fetch(path, options);
  return fetch(path);
}
