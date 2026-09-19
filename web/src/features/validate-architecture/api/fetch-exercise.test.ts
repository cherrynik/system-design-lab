import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Exercise } from '@/entities/exercise';
import { fetchExercise } from './fetch-exercise';

const exercise: Exercise = {
  id: 'exercise-1',
  title: 'Route a request',
  description: 'Create a valid request path.',
  requirement: {
    id: 'REQ-001',
    title: 'Request reaches a service',
    description: 'A client request must reach a request handler.',
  },
};

afterEach(() => vi.unstubAllGlobals());

describe('fetchExercise', () => {
  it('loads the current exercise', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => exercise,
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchExercise()).resolves.toEqual(exercise);
    expect(fetchMock).toHaveBeenCalledWith('/api/exercise');
  });

  it('uses a domain-specific error when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
      })),
    );

    await expect(fetchExercise()).rejects.toThrow('The exercise could not be loaded.');
  });
});
