// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformProvider } from '@/shared/config';
import { CanvasHistoryControls } from './CanvasHistoryControls';

afterEach(cleanup);

describe('CanvasHistoryControls', () => {
  it('only invokes available history actions and updates when history changes', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const callbacks = { onUndo, onRedo, usesCommandKey: true };
    const { rerender } = render(
      <CanvasHistoryControls {...callbacks} canUndo={false} canRedo={false} />,
      { wrapper: PlatformProvider },
    );

    const undo = screen.getByRole<HTMLButtonElement>('button', { name: 'Undo' });
    const redo = screen.getByRole<HTMLButtonElement>('button', { name: 'Redo' });
    expect(undo.disabled).toBe(true);
    expect(redo.disabled).toBe(true);
    await user.click(undo);
    await user.click(redo);
    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();

    rerender(<CanvasHistoryControls {...callbacks} canUndo canRedo={false} />);
    expect(undo.disabled).toBe(false);
    expect(redo.disabled).toBe(true);
    await user.click(undo);
    expect(onUndo).toHaveBeenCalledOnce();

    rerender(<CanvasHistoryControls {...callbacks} canUndo={false} canRedo />);
    expect(undo.disabled).toBe(true);
    expect(redo.disabled).toBe(false);
    await user.click(redo);
    expect(onRedo).toHaveBeenCalledOnce();
  });
});
