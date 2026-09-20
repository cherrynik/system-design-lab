import { describe, expect, it, vi } from 'vitest';
import { toRichText, type Editor, type TLArrowShape } from 'tldraw';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';
import { syncArchitectureArrowProtocol } from './syncArchitectureArrowProtocol';

function harness(label = '', meta: TLArrowShape['meta'] = {}) {
  let arrow = {
    id: 'shape:request',
    type: 'arrow',
    meta,
    props: { richText: toRichText(label) },
  } as TLArrowShape;
  let editing = false;
  const editor = {
    getTextOptions: () => ({}),
    getEditingShapeId: () => (editing ? arrow.id : null),
    updateShape: vi.fn((update: Partial<TLArrowShape>) => {
      arrow = { ...arrow, ...update, props: { ...arrow.props, ...update.props } };
    }),
  } as unknown as Editor;
  return {
    editor,
    get arrow() {
      return arrow;
    },
    edit(value: string) {
      arrow = { ...arrow, props: { ...arrow.props, richText: toRichText(value) } };
    },
    setEditing(value: boolean) {
      editing = value;
    },
  };
}

function source(kind: 'client' | 'service') {
  return { props: { kind } } as ArchitectureCardShape;
}

describe('automatic arrow protocols', () => {
  it('labels from the source alone, updates when reattached, and clears when detached', () => {
    const current = harness();
    expect(syncArchitectureArrowProtocol(current.editor, current.arrow)).toEqual({
      protocol: '',
      protocolMode: 'auto',
    });
    expect(syncArchitectureArrowProtocol(current.editor, current.arrow, source('client'))).toEqual({
      protocol: 'HTTPS',
      protocolMode: 'auto',
    });
    expect(syncArchitectureArrowProtocol(current.editor, current.arrow, source('service'))).toEqual(
      { protocol: 'HTTP', protocolMode: 'auto' },
    );
    expect(syncArchitectureArrowProtocol(current.editor, current.arrow)).toEqual({
      protocol: '',
      protocolMode: 'auto',
    });
  });

  it('never replaces user text or explicitly cleared labels after editing ends', () => {
    const current = harness();
    syncArchitectureArrowProtocol(current.editor, current.arrow, source('client'));
    current.edit('gRPC');
    expect(syncArchitectureArrowProtocol(current.editor, current.arrow, source('service'))).toEqual(
      { protocol: 'gRPC', protocolMode: 'manual' },
    );
    current.edit('');
    expect(syncArchitectureArrowProtocol(current.editor, current.arrow, source('client'))).toEqual({
      protocol: '',
      protocolMode: 'manual',
    });
    expect(syncArchitectureArrowProtocol(current.editor, current.arrow)).toEqual({
      protocol: '',
      protocolMode: 'manual',
    });
  });

  it('preserves an automatic label cleared during editing through reload metadata', () => {
    const current = harness();
    syncArchitectureArrowProtocol(current.editor, current.arrow, source('client'));
    current.setEditing(true);
    current.edit('');
    expect(
      syncArchitectureArrowProtocol(current.editor, current.arrow, source('client')).protocolMode,
    ).toBe('manual');
    const reloaded = harness('', current.arrow.meta);
    expect(
      syncArchitectureArrowProtocol(reloaded.editor, reloaded.arrow, source('service')),
    ).toEqual({ protocol: '', protocolMode: 'manual' });
  });

  it('does not rewrite metadata or rich text when an auto label is already current', () => {
    const current = harness('HTTPS', {
      architectureProtocolMode: 'auto',
      architectureAutoProtocol: 'HTTPS',
    });
    syncArchitectureArrowProtocol(current.editor, current.arrow, source('client'));
    expect(current.editor.updateShape).not.toHaveBeenCalled();
    current.setEditing(true);
    expect(
      syncArchitectureArrowProtocol(current.editor, current.arrow, source('client')).protocolMode,
    ).toBe('auto');
    expect(current.editor.updateShape).not.toHaveBeenCalled();
  });
});
