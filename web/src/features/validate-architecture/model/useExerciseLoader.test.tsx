// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Exercise } from '@/entities/exercise';
import { useExerciseLoader } from './useExerciseLoader';

const exercise: Exercise = {
  id: 'exercise-1',
  title: 'Route a request',
  description: 'Create a valid request path.',
  requirement: {
    id: 'REQ-001',
    title: 'Request reaches a service',
    description: 'A request must reach a handler.',
  },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

afterEach(cleanup);

describe('useExerciseLoader', () => {
  it('loads one exercise and keeps the state and ref synchronized', async () => {
    const loadExercise = vi.fn(async () => exercise);
    const { result, rerender } = renderHook(() => useExerciseLoader({ loadExercise }));
    const initialRef = result.current.exerciseRef;

    expect(result.current.exerciseStatus).toBe('loading');
    expect(result.current.exercise).toBeNull();
    await waitFor(() => expect(result.current.exerciseStatus).toBe('ready'));

    expect(result.current.exercise).toEqual(exercise);
    expect(result.current.exerciseRef.current).toEqual(exercise);
    expect(result.current.exerciseError).toBeNull();

    rerender();
    expect(result.current.exerciseRef).toBe(initialRef);
    expect(loadExercise).toHaveBeenCalledTimes(1);
  });

  it('exposes loader failures without producing an exercise', async () => {
    const loadExercise = vi.fn(async () => {
      throw new Error('Exercise API is offline');
    });
    const { result } = renderHook(() => useExerciseLoader({ loadExercise }));

    await waitFor(() => expect(result.current.exerciseStatus).toBe('error'));

    expect(result.current.exercise).toBeNull();
    expect(result.current.exerciseRef.current).toBeNull();
    expect(result.current.exerciseError).toBe('Exercise API is offline');
  });

  it('ignores a response that resolves after unmount', async () => {
    const pending = deferred<Exercise>();
    const loadExercise = vi.fn(() => pending.promise);
    const { result, unmount } = renderHook(() => useExerciseLoader({ loadExercise }));
    const exerciseRef = result.current.exerciseRef;

    unmount();
    await act(async () => {
      pending.resolve(exercise);
      await pending.promise;
    });

    expect(exerciseRef.current).toBeNull();
  });
});
