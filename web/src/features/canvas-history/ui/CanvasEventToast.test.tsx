// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithPlatform } from '@/shared/testing/renderWithPlatform';
import { CanvasEventToast } from './CanvasEventToast';

afterEach(cleanup);

describe('CanvasEventToast', () => {
  it('announces an event and runs its action', () => {
    const onAction = vi.fn();
    renderWithPlatform(
      <CanvasEventToast
        message={'Deleted “API”'}
        tone="danger"
        actionLabel="Undo"
        onAction={onAction}
      />,
    );

    expect(screen.getByRole('status').textContent).toContain('Deleted “API”');
    const action = screen.getByRole('button', { name: 'Undo' });
    expect(action.getAttribute('data-slot')).toBe('button');
    fireEvent.click(action);
    expect(onAction).toHaveBeenCalledOnce();
  });
});
