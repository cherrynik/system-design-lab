import { useEffect, useRef, useState } from 'react';
import type { Exercise } from '@/entities/exercise';
import type { ExerciseFetchStatus } from './useArchitectureValidation.types';
import type { UseExerciseLoaderOptions, UseExerciseLoaderResult } from './useExerciseLoader.types';

function exerciseErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The exercise could not be loaded.';
}

export function useExerciseLoader({
  loadExercise,
}: UseExerciseLoaderOptions): UseExerciseLoaderResult {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [exerciseStatus, setExerciseStatus] = useState<ExerciseFetchStatus>('loading');
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const exerciseRef = useRef<Exercise | null>(null);
  const loadExerciseRef = useRef(loadExercise);

  useEffect(() => {
    let active = true;

    void loadExerciseRef
      .current()
      .then((nextExercise) => {
        if (!active) return;
        exerciseRef.current = nextExercise;
        setExercise(nextExercise);
        setExerciseStatus('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        exerciseRef.current = null;
        setExercise(null);
        setExerciseError(exerciseErrorMessage(error));
        setExerciseStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  return { exercise, exerciseStatus, exerciseError, exerciseRef };
}
