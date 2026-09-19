// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  referenceSolutions,
  type ArchitectureSnapshot,
  type ReferenceSolution,
} from '@/entities/architecture';
import type { ArchitectureValidationInvalidationOptions } from './ArchitectureValidationInvalidation.types';
import { useArchitectureValidationInvalidation } from './useArchitectureValidationInvalidation';

const snapshot: ArchitectureSnapshot = {
  nodes: [
    {
      id: 'client',
      type: 'architecture',
      position: { x: 0, y: 0 },
      data: { kind: 'client', variantId: 'web-browser', label: 'Browser' },
    },
  ],
  edges: [],
};

function createOptions(
  invalidateValidation: () => void,
  overrides: Partial<ArchitectureValidationInvalidationOptions> = {},
): ArchitectureValidationInvalidationOptions {
  return {
    snapshot,
    view: 'canvas',
    solution: referenceSolutions[0],
    invalidateValidation,
    ...overrides,
  };
}

describe('useArchitectureValidationInvalidation', () => {
  it('invalidates when switching documents or changing active document content', () => {
    const invalidateValidation = vi.fn();
    const initial = createOptions(invalidateValidation, { view: 'solutions' });
    const { rerender } = renderHook(
      ({ options }) => useArchitectureValidationInvalidation(options),
      { initialProps: { options: initial } },
    );

    expect(invalidateValidation).not.toHaveBeenCalled();

    rerender({ options: createOptions(invalidateValidation) });
    expect(invalidateValidation).toHaveBeenCalledTimes(1);

    rerender({
      options: createOptions(invalidateValidation, {
        snapshot: {
          ...snapshot,
          nodes: [{ ...snapshot.nodes[0], position: { x: 120, y: 80 } }],
        },
      }),
    });
    expect(invalidateValidation).toHaveBeenCalledTimes(2);
  });

  it('keeps validation for selection-only canvas changes', () => {
    const invalidateValidation = vi.fn();
    const { rerender } = renderHook(
      ({ options }) => useArchitectureValidationInvalidation(options),
      { initialProps: { options: createOptions(invalidateValidation) } },
    );

    rerender({
      options: createOptions(invalidateValidation, {
        snapshot: {
          ...snapshot,
          nodes: snapshot.nodes.map((node) => ({ ...node, selected: true })),
        },
      }),
    });

    expect(invalidateValidation).not.toHaveBeenCalled();
  });

  it('invalidates when the selected solution identity or topology changes', () => {
    const invalidateValidation = vi.fn();
    const initial = createOptions(invalidateValidation, { view: 'solutions' });
    const { rerender } = renderHook(
      ({ options }) => useArchitectureValidationInvalidation(options),
      { initialProps: { options: initial } },
    );

    rerender({
      options: createOptions(invalidateValidation, {
        view: 'solutions',
        solution: referenceSolutions[1],
      }),
    });
    expect(invalidateValidation).toHaveBeenCalledTimes(1);

    const changedSolution: ReferenceSolution = {
      ...referenceSolutions[1],
      nodes: referenceSolutions[1].nodes.map((node, index) => {
        if (index !== 1) return node;
        return { ...node, label: 'Edge Proxy' };
      }),
    };
    rerender({
      options: createOptions(invalidateValidation, {
        view: 'solutions',
        solution: changedSolution,
      }),
    });
    expect(invalidateValidation).toHaveBeenCalledTimes(2);
  });
});
