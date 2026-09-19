// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RefObject } from 'react';
import type { Editor } from 'tldraw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithPlatform } from '@/shared/testing/renderWithPlatform';
import { CanvasZoomControls } from './CanvasZoomControls';

afterEach(cleanup);

describe('CanvasZoomControls', () => {
  it('delegates all zoom actions to the active canvas editor', async () => {
    const user = userEvent.setup();
    const zoomOut = vi.fn();
    const zoomToFit = vi.fn();
    const zoomIn = vi.fn();
    const editorRef = {
      current: { zoomOut, zoomToFit, zoomIn } as unknown as Editor,
    } as RefObject<Editor | null>;

    renderWithPlatform(<CanvasZoomControls editorRef={editorRef} />);

    expect(screen.getByRole('button', { name: 'Zoom out' }).getAttribute('data-size')).toBe('md');
    expect(screen.getByRole('button', { name: 'Fit canvas' }).getAttribute('data-size')).toBe('md');
    expect(screen.getByRole('button', { name: 'Zoom in' }).getAttribute('data-size')).toBe('md');

    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    await user.click(screen.getByRole('button', { name: 'Fit canvas' }));
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));

    expect(zoomOut).toHaveBeenCalledOnce();
    expect(zoomToFit).toHaveBeenCalledOnce();
    expect(zoomIn).toHaveBeenCalledOnce();
  });
});
