import type { Exercise } from '@/entities/exercise';

export async function fetchExercise(): Promise<Exercise> {
  const response = await fetch('/api/exercise');

  if (!response.ok) throw new Error('The exercise could not be loaded.');

  return (await response.json()) as Exercise;
}
