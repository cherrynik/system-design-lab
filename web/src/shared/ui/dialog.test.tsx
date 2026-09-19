// @vitest-environment jsdom
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithPlatform } from '@/shared/testing/renderWithPlatform';

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog';

afterEach(cleanup);

describe('Dialog', () => {
  it('traps keyboard focus, closes with Escape, and restores the trigger', async () => {
    const user = userEvent.setup();

    renderWithPlatform(
      <Dialog>
        <DialogTrigger>Open component library</DialogTrigger>
        <DialogContent>
          <DialogTitle>Component library</DialogTitle>
          <DialogDescription>Search for a component to add.</DialogDescription>
          <input aria-label="Search components" />
          <button type="button">Add component</button>
        </DialogContent>
      </Dialog>,
    );

    const trigger = screen.getByRole('button', {
      name: 'Open component library',
    });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog', {
      name: 'Component library',
    });
    expect(dialog).toBeTruthy();

    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });
});
