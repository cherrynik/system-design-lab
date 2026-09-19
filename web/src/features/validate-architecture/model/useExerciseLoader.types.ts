import type { RefObject } from 'react';
import type { Exercise } from '@/entities/exercise';
import type { ExerciseFetchStatus, ExerciseLoader } from './useArchitectureValidation.types';

export type UseExerciseLoaderResult = {
  exercise: Exercise | null;
  exerciseStatus: ExerciseFetchStatus;
  exerciseError: string | null;
  exerciseRef: RefObject<Exercise | null>;
};

export type UseExerciseLoaderOptions = {
  loadExercise: ExerciseLoader;
};
