// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toRichText, type Editor } from 'tldraw';
import { useArchitectureArrowLabelCommit } from './useArchitectureArrowLabelCommit';

afterEach(cleanup);

function harness(type = 'arrow', text = 'gRPC') {
  const container = document.createElement('div');
  const input = document.createElement('div');
  container.append(input);
  let editing: string | null = 'shape:arrow';
  const editor = {
    getContainer: () => container,
    getEditingShapeId: () => editing,
    getShape: () => ({ id: 'shape:arrow', type, props: { richText: toRichText(text) } }),
    getTextOptions: () => ({}),
    updateShape: vi.fn(),
    complete: vi.fn(() => {
      editing = null;
    }),
  } as unknown as Editor;
  return { editor, input, container };
}

describe('arrow label confirmation', () => {
  it('commits Enter without inserting a newline and leaves native edit mode', () => {
    const { editor, input } = harness();
    renderHook(() => useArchitectureArrowLabelCommit(editor));
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(editor.complete).toHaveBeenCalledOnce();
    expect(editor.updateShape).not.toHaveBeenCalled();
  });

  it('keeps pasted protocols on one line on confirmation', () => {
    const { editor, input } = harness('arrow', 'HTTP\nstream');
    renderHook(() => useArchitectureArrowLabelCommit(editor));
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(editor.updateShape).toHaveBeenCalledWith({
      id: 'shape:arrow',
      type: 'arrow',
      props: { richText: toRichText('HTTP stream') },
    });
  });

  it('does not interfere with composition, other text inputs, or events after unmount', () => {
    const arrow = harness();
    const { unmount } = renderHook(() => useArchitectureArrowLabelCommit(arrow.editor));
    arrow.input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }),
    );
    expect(arrow.editor.complete).not.toHaveBeenCalled();
    unmount();
    arrow.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(arrow.editor.complete).not.toHaveBeenCalled();
    const card = harness('architecture-card');
    renderHook(() => useArchitectureArrowLabelCommit(card.editor));
    card.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(card.editor.complete).not.toHaveBeenCalled();
  });
});
