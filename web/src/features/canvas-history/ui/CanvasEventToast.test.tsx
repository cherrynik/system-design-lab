// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CanvasEventToast } from './CanvasEventToast';

afterEach(cleanup);

describe('CanvasEventToast', () => {
  it('announces an event and runs its action', () => {
    const onAction = vi.fn();
    render(<CanvasEventToast message={'Deleted “API”'} tone="danger" actionLabel="Undo" onAction={onAction} />);

    expect(screen.getByRole('status').textContent).toContain('Deleted “API”');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
