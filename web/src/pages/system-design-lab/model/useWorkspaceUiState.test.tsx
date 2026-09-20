// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { referenceSolutions } from '@/entities/architecture';
import { useWorkspaceUiState } from './useWorkspaceUiState';

describe('useWorkspaceUiState', () => {
  it('starts in the editable canvas with the primary workspace sections available', () => {
    const { result } = renderHook(() => useWorkspaceUiState());

    expect(result.current).toMatchObject({
      workspaceView: 'canvas',
      selectedSolutionId: referenceSolutions[0].id,
      requirementsCollapsed: false,
      requirementsExpanded: true,
      layersExpanded: true,
      registryOpen: false,
      versionsOpen: false,
      tool: 'selection',
    });
  });

  it('expands the sidebar when component search opens and closes only the registry', () => {
    const { result } = renderHook(() => useWorkspaceUiState());
    act(() => {
      result.current.setRequirementsCollapsed(true);
      result.current.setQuery('nginx');
      result.current.setGroup('load-balancer');
    });

    act(() => result.current.handleRegistryOpenChange(true));
    expect(result.current.requirementsCollapsed).toBe(false);
    expect(result.current.registryOpen).toBe(true);
    expect(result.current.query).toBe('');
    expect(result.current.group).toBeNull();

    act(() => result.current.handleRegistryOpenChange(false));
    expect(result.current.registryOpen).toBe(false);
    expect(result.current.requirementsCollapsed).toBe(false);
  });

  it('keeps navigation, search, grouping, commits, and tool state independently editable', () => {
    const { result } = renderHook(() => useWorkspaceUiState());

    act(() => {
      result.current.setWorkspaceView('solutions');
      result.current.setSelectedSolutionId('load-balanced');
      result.current.setRequirementsExpanded(false);
      result.current.setLayersExpanded(false);
      result.current.setQuery('nginx');
      result.current.setGroup('load-balancer');
      result.current.setVersionsOpen(true);
      result.current.setTool('connection');
    });

    expect(result.current).toMatchObject({
      workspaceView: 'solutions',
      selectedSolutionId: 'load-balanced',
      requirementsExpanded: false,
      layersExpanded: false,
      query: 'nginx',
      group: 'load-balancer',
      versionsOpen: true,
      tool: 'connection',
    });
  });
});
