// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Editor } from 'tldraw';
import type { ArchitectureCardShape } from '../model/architectureCanvas.types';
import { ArchitectureCardNameInput } from './ArchitectureCardNameInput';

afterEach(cleanup);

function architectureCard(): ArchitectureCardShape {
  return {
    id: 'shape:service',
    typeName: 'shape',
    type: 'architecture-card',
    props: {
      w: 220,
      h: 86,
      nodeId: 'service',
      label: 'Service',
      kind: 'service',
      variantId: 'generic-service',
      validation: 'idle',
      validationMessage: '',
      isReadonly: false,
    },
  } as ArchitectureCardShape;
}

function editorFor(shape: ArchitectureCardShape) {
  return {
    updateShape: vi.fn(),
    getEditingShapeId: vi.fn(() => shape.id),
    complete: vi.fn(),
  } as unknown as Editor;
}

describe('ArchitectureCardNameInput', () => {
  it('trims and synchronizes a committed canvas rename', () => {
    const shape = architectureCard();
    const editor = editorFor(shape);
    const onRename = vi.fn();
    render(<ArchitectureCardNameInput shape={shape} editor={editor} onRename={onRename} />);
    const input = screen.getByRole('textbox', { name: 'Rename Service' });

    fireEvent.change(input, { target: { value: '  Orders API  ' } });
    fireEvent.blur(input);

    expect(onRename).toHaveBeenCalledWith('service', 'Orders API');
    expect(editor.updateShape).toHaveBeenCalledWith({
      id: shape.id,
      type: 'architecture-card',
      props: { label: 'Orders API' },
    });
    expect(editor.complete).toHaveBeenCalledOnce();
  });

  it('leaves the original label untouched when rename is cancelled', () => {
    const shape = architectureCard();
    const editor = editorFor(shape);
    const onRename = vi.fn();
    render(<ArchitectureCardNameInput shape={shape} editor={editor} onRename={onRename} />);
    const input = screen.getByRole('textbox', { name: 'Rename Service' });

    fireEvent.change(input, { target: { value: 'Temporary name' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onRename).not.toHaveBeenCalled();
    expect(editor.updateShape).not.toHaveBeenCalled();
    expect(editor.complete).toHaveBeenCalledOnce();
  });

  it('does not replace a useful name with whitespace', () => {
    const shape = architectureCard();
    const editor = editorFor(shape);
    const onRename = vi.fn();
    render(<ArchitectureCardNameInput shape={shape} editor={editor} onRename={onRename} />);
    const input = screen.getByRole('textbox', { name: 'Rename Service' });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);

    expect(onRename).not.toHaveBeenCalled();
    expect(editor.updateShape).not.toHaveBeenCalled();
    expect(editor.complete).toHaveBeenCalledOnce();
  });

  it('commits before an outside pointerdown unmounts the editor', () => {
    const shape = architectureCard();
    const editor = editorFor(shape);
    const onRename = vi.fn();
    const { unmount } = render(
      <ArchitectureCardNameInput shape={shape} editor={editor} onRename={onRename} />,
    );
    const input = screen.getByRole('textbox', { name: 'Rename Service' });
    fireEvent.change(input, { target: { value: 'Orders API' } });

    fireEvent.pointerDown(document.body);
    unmount();

    expect(onRename).toHaveBeenCalledExactlyOnceWith('service', 'Orders API');
    expect(editor.updateShape).toHaveBeenCalledOnce();
    expect(editor.complete).toHaveBeenCalledOnce();
  });

  it('keeps editing while selecting text inside the input', () => {
    const shape = architectureCard();
    const editor = editorFor(shape);
    const onRename = vi.fn();
    render(<ArchitectureCardNameInput shape={shape} editor={editor} onRename={onRename} />);
    const input = screen.getByRole('textbox', { name: 'Rename Service' });
    fireEvent.change(input, { target: { value: 'Orders API' } });
    fireEvent.pointerDown(input);

    expect(document.activeElement).toBe(input);
    expect(onRename).not.toHaveBeenCalled();
    expect(editor.complete).not.toHaveBeenCalled();
  });

  it('commits only once when completing the editor triggers a second blur', () => {
    const shape = architectureCard();
    const editor = editorFor(shape);
    const onRename = vi.fn();
    render(<ArchitectureCardNameInput shape={shape} editor={editor} onRename={onRename} />);
    const input = screen.getByRole('textbox', { name: 'Rename Service' });
    vi.mocked(editor.complete).mockImplementation(() => {
      fireEvent.blur(input);
      return editor;
    });
    fireEvent.change(input, { target: { value: 'Orders API' } });
    fireEvent.blur(input);

    expect(onRename).toHaveBeenCalledExactlyOnceWith('service', 'Orders API');
    expect(editor.updateShape).toHaveBeenCalledOnce();
    expect(editor.complete).toHaveBeenCalledOnce();
  });
});
