// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithPlatform } from '@/shared/testing/renderWithPlatform';
import { CanvasToolbar } from './CanvasToolbar';

afterEach(cleanup);

describe('CanvasToolbar', () => {
  it('exposes the selected tool and changes tools through shared icon buttons', async () => {
    const user = userEvent.setup();
    const onToolChange = vi.fn();

    renderWithPlatform(<CanvasToolbar tool="selection" onToolChange={onToolChange} />);

    const selectionButton = screen.getByRole('button', { name: 'Select (2)' });
    expect(selectionButton.getAttribute('aria-pressed')).toBe('true');
    expect(selectionButton.getAttribute('data-size')).toBe('lg');
    expect(screen.getByText('2').closest('[data-slot="kbd"]')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Connect (3)' }));

    expect(onToolChange).toHaveBeenCalledWith('connection');
  });
});
