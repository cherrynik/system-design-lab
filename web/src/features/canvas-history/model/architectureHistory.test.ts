// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { ArchitectureNode } from '../../../entities/architecture';
import {
  architectureSnapshotsMatch,
  createArchitectureHistory,
  getArchitectureHistoryShortcut,
  isEditableShortcutTarget,
  pushArchitectureHistory,
  redoArchitectureHistory,
  replaceArchitecturePresent,
  undoArchitectureHistory,
} from './architectureHistory';

const client: ArchitectureNode = { id: 'client', type: 'architecture', position: { x: 0, y: 0 }, data: { kind: 'client', variantId: 'abstract', label: 'Client' } };
const service: ArchitectureNode = { id: 'service', type: 'architecture', position: { x: 300, y: 0 }, data: { kind: 'service', variantId: 'abstract', label: 'Service' } };
const initial = { nodes: [client], edges: [] };
const added = { nodes: [client, service], edges: [] };
const connected = {
  nodes: [client, service],
  edges: [{
    id: 'connection',
    source: client.id,
    target: service.id,
    type: 'architecture' as const,
    data: { protocol: 'HTTPS' },
  }],
};

describe('architecture history', () => {
  it('undoes and redoes add, connect, rename, move, and delete snapshots in order', () => {
    const renamed = {
      ...connected,
      nodes: connected.nodes.map((node) => node.id === service.id
        ? { ...node, data: { ...node.data, label: 'Orders API' } }
        : node),
    };
    const moved = {
      ...renamed,
      nodes: renamed.nodes.map((node) => node.id === service.id
        ? { ...node, position: { x: 420, y: 120 } }
        : node),
    };
    const deleted = { nodes: [client], edges: [] };

    let state = createArchitectureHistory(initial);
    for (const snapshot of [added, connected, renamed, moved, deleted]) {
      state = pushArchitectureHistory(state, snapshot);
    }

    state = undoArchitectureHistory(state);
    expect(state.present).toEqual(moved);
    state = undoArchitectureHistory(state);
    expect(state.present).toEqual(renamed);
    state = redoArchitectureHistory(state);
    expect(state.present).toEqual(moved);
    state = redoArchitectureHistory(state);
    expect(state.present).toEqual(deleted);
  });

  it('does not record selection-only changes or clear an available redo', () => {
    let state = pushArchitectureHistory(createArchitectureHistory(initial), added);
    state = undoArchitectureHistory(state);
    const selected = {
      ...state.present,
      nodes: state.present.nodes.map((node) => ({ ...node, selected: true })),
    };

    expect(architectureSnapshotsMatch(state.present, selected)).toBe(true);
    state = pushArchitectureHistory(state, selected);
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(1);
    expect(redoArchitectureHistory(state).present).toEqual(added);
  });

  it('can replace derived state without creating a history entry', () => {
    const state = replaceArchitecturePresent(createArchitectureHistory(initial), added);
    expect(state.present).toEqual(added);
    expect(state.past).toHaveLength(0);
  });
});

describe('architecture history shortcuts', () => {
  const shortcut = (overrides: Partial<KeyboardEvent>) => getArchitectureHistoryShortcut({
    key: 'z',
    metaKey: false,
    ctrlKey: true,
    shiftKey: false,
    altKey: false,
    ...overrides,
  });

  it('supports platform undo and both common redo shortcuts', () => {
    expect(shortcut({})).toBe('undo');
    expect(shortcut({ metaKey: true, ctrlKey: false })).toBe('undo');
    expect(shortcut({ shiftKey: true })).toBe('redo');
    expect(shortcut({ key: 'y' })).toBe('redo');
    expect(shortcut({ key: 'x' })).toBeNull();
    expect(shortcut({ altKey: true })).toBeNull();
  });

  it('leaves undo and redo with editable controls', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    const nested = document.createElement('span');
    editable.append(nested);
    const textbox = document.createElement('div');
    textbox.setAttribute('role', 'textbox');

    expect(isEditableShortcutTarget(input)).toBe(true);
    expect(isEditableShortcutTarget(textarea)).toBe(true);
    expect(isEditableShortcutTarget(nested)).toBe(true);
    expect(isEditableShortcutTarget(textbox)).toBe(true);
    expect(isEditableShortcutTarget(document.body)).toBe(false);
  });
});
