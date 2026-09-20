// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ValidationAttempt } from '@/features/validate-architecture';
import { useArchitectureAttemptPreview } from './useArchitectureAttemptPreview';

afterEach(cleanup);

const savedAttempt: ValidationAttempt = {
  id: 2,
  createdAt: '2026-09-20T09:32:00.000Z',
  snapshot: { nodes: [], edges: [] },
  view: 'canvas',
  status: 'ready',
  results: [],
  terminal: [],
  validationError: null,
  nodeIssues: [],
  warningCount: 0,
};

function createOptions() {
  return {
    selectedAttempt: savedAttempt,
    selectAttempt: vi.fn(),
    clearValidation: vi.fn(),
    restoreCurrentValidation: vi.fn(),
    setWorkspaceView: vi.fn(),
    closeTransientUi: vi.fn(),
  };
}

describe('useArchitectureAttemptPreview', () => {
  it('restores the current canvas and its own validation when exiting an archived attempt', () => {
    const options = createOptions();
    const { result } = renderHook(() => useArchitectureAttemptPreview(options));
    act(() => result.current.viewAttempt(2));
    expect(options.selectAttempt).toHaveBeenCalledWith(2);
    expect(result.current.preview?.id).toBe('attempt:2');

    act(() => result.current.selectCurrentAttempt());
    expect(result.current.preview).toBeUndefined();
    expect(options.setWorkspaceView).toHaveBeenCalledWith('canvas');
    expect(options.restoreCurrentValidation).toHaveBeenCalledOnce();
    expect(options.clearValidation).not.toHaveBeenCalled();
  });

  it('restores current validation when returning from a solution without previewing an archive', () => {
    const options = createOptions();
    const { result } = renderHook(() => useArchitectureAttemptPreview(options));
    act(() => result.current.changeWorkspaceView('canvas'));
    expect(options.restoreCurrentValidation).toHaveBeenCalledOnce();
    expect(options.setWorkspaceView).toHaveBeenCalledWith('canvas');
    expect(options.clearValidation).not.toHaveBeenCalled();
  });

  it('clears archived output when navigating to solutions or explicitly clearing the runner', () => {
    const options = createOptions();
    const { result } = renderHook(() => useArchitectureAttemptPreview(options));
    act(() => result.current.viewAttempt(2));
    act(() => result.current.changeWorkspaceView('solutions'));
    expect(result.current.preview).toBeUndefined();
    expect(options.clearValidation).toHaveBeenCalledOnce();
    expect(options.setWorkspaceView).toHaveBeenLastCalledWith('solutions');

    act(() => result.current.viewAttempt(2));
    act(() => result.current.clearOutput());
    expect(result.current.preview).toBeUndefined();
    expect(options.clearValidation).toHaveBeenCalledTimes(2);
    expect(options.setWorkspaceView).toHaveBeenLastCalledWith('canvas');
    expect(options.restoreCurrentValidation).not.toHaveBeenCalled();
  });
});
