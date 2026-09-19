// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithPlatform } from '@/shared/testing/renderWithPlatform';

import { Toolbar, ToolbarButton } from './toolbar';

afterEach(cleanup);

describe('Toolbar', () => {
  it('uses arrow keys to move focus and wraps at the end', async () => {
    const user = userEvent.setup();

    renderWithPlatform(
      <Toolbar aria-label="Canvas tools">
        <ToolbarButton>Pan</ToolbarButton>
        <ToolbarButton>Select</ToolbarButton>
      </Toolbar>,
    );

    const pan = screen.getByRole('button', { name: 'Pan' });
    const select = screen.getByRole('button', { name: 'Select' });

    pan.focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(select);

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(pan);
  });
});
