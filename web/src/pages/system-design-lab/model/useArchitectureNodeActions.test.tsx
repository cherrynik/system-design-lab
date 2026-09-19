// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArchitectureSnapshot } from '@/entities/architecture';
import type { ArchitectureNodeActionsOptions } from './ArchitectureNodeActions.types';
import { useArchitectureNodeActions } from './useArchitectureNodeActions';

const initialSnapshot = (): ArchitectureSnapshot => ({
  nodes: [
    {
      id: 'client',
      type: 'architecture',
      position: { x: 0, y: 0 },
      data: { kind: 'client', variantId: 'abstract', label: 'Client' },
    },
    {
      id: 'service',
      type: 'architecture',
      position: { x: 300, y: 0 },
      data: { kind: 'service', variantId: 'abstract', label: 'Service' },
    },
    {
      id: 'anchor',
      type: 'architecture',
      position: { x: 600, y: 0 },
      data: { kind: 'service', variantId: 'abstract', label: '', isAnchor: true },
    },
  ],
  edges: [
    {
      id: 'edge',
      source: 'client',
      target: 'service',
      type: 'architecture',
      data: { protocol: 'HTTPS' },
    },
  ],
});

function makeOptions(snapshot: ArchitectureSnapshot) {
  let current = snapshot;
  const applyChange = vi.fn(
    (update: Parameters<ArchitectureNodeActionsOptions['applyChange']>[0]) => {
      current = update(current);
    },
  );
  const replacePresent = vi.fn(
    (update: Parameters<ArchitectureNodeActionsOptions['replacePresent']>[0]) => {
      current = update(current);
    },
  );
  const options: ArchitectureNodeActionsOptions = {
    nodes: snapshot.nodes,
    applyChange,
    replacePresent,
    focusShape: vi.fn(),
    selectShape: vi.fn(),
    setRegistryOpen: vi.fn(),
    setGroup: vi.fn(),
    setMenu: vi.fn(),
    setInspectorId: vi.fn(),
    showEvent: vi.fn(),
  };
  return { options, snapshot: () => current };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000000');
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useArchitectureNodeActions', () => {
  it('adds the next named component on the placement grid and focuses it', () => {
    const harness = makeOptions(initialSnapshot());
    const { result } = renderHook(() => useArchitectureNodeActions(harness.options));

    act(() => result.current.addNode('service'));

    const added = harness.snapshot().nodes.at(-1)!;
    expect(added).toMatchObject({
      id: 'service-00000000-0000-4000-8000-000000000000',
      position: { x: 660, y: 140 },
      data: { kind: 'service', variantId: 'abstract', label: 'Service 2' },
    });
    expect(harness.options.setRegistryOpen).toHaveBeenCalledWith(false);
    expect(harness.options.setGroup).toHaveBeenCalledWith(null);
    expect(harness.options.showEvent).toHaveBeenCalledWith({
      message: 'Added “Service 2”',
      action: 'undo',
    });

    act(() => vi.runAllTimers());
    expect(harness.options.focusShape).toHaveBeenCalledWith(added.id);
  });

  it('renames valid labels and ignores an empty rename', () => {
    const harness = makeOptions(initialSnapshot());
    const { result } = renderHook(() => useArchitectureNodeActions(harness.options));

    act(() => result.current.renameNode('service', '   '));
    expect(harness.options.applyChange).not.toHaveBeenCalled();

    act(() => result.current.renameNode('service', '  Orders API  '));
    expect(harness.snapshot().nodes.find((node) => node.id === 'service')?.data.label).toBe(
      'Orders API',
    );
    expect(harness.options.showEvent).toHaveBeenCalledWith({
      message: 'Renamed to “Orders API”',
      action: 'undo',
    });
  });

  it('removes a component with its connections and clears matching transient UI', () => {
    const harness = makeOptions(initialSnapshot());
    const { result } = renderHook(() => useArchitectureNodeActions(harness.options));

    act(() => result.current.deleteNode('service'));

    expect(harness.snapshot().nodes.map((node) => node.id)).toEqual(['client', 'anchor']);
    expect(harness.snapshot().edges).toEqual([]);
    expect(harness.options.setMenu).toHaveBeenCalledWith(null);
    const updateInspector = vi.mocked(harness.options.setInspectorId).mock.calls[0][0];
    expect(typeof updateInspector).toBe('function');
    if (typeof updateInspector === 'function') {
      expect(updateInspector('service')).toBeNull();
      expect(updateInspector('client')).toBe('client');
    }
    expect(harness.options.showEvent).toHaveBeenCalledWith({
      message: 'Deleted “Service”',
      tone: 'danger',
      action: 'undo',
    });
  });

  it('keeps focus and inspect as selection-only history replacements', () => {
    const harness = makeOptions(initialSnapshot());
    const { result } = renderHook(() => useArchitectureNodeActions(harness.options));

    act(() => result.current.focusNode('service'));
    expect(harness.snapshot().nodes.find((node) => node.id === 'service')?.selected).toBe(true);
    expect(harness.options.focusShape).toHaveBeenCalledWith('service');

    act(() => result.current.inspectNode('client'));
    expect(harness.snapshot().nodes.find((node) => node.id === 'client')?.selected).toBe(true);
    expect(harness.snapshot().nodes.find((node) => node.id === 'service')?.selected).toBe(false);
    expect(harness.options.selectShape).toHaveBeenCalledWith('client');
    expect(harness.options.setInspectorId).toHaveBeenCalledWith('client');
  });
});
