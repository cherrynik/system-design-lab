// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckIcon } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithPlatform } from '@/shared/testing/renderWithPlatform';

import { Button, IconButton } from './button';

afterEach(cleanup);

describe('Button', () => {
  it('invokes its action and exposes the shared slot contract', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithPlatform(<Button onClick={onClick}>Validate</Button>);

    const button = screen.getByRole('button', { name: 'Validate' });
    expect(button.getAttribute('data-slot')).toBe('button');

    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not dispatch an action while disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithPlatform(
      <Button disabled onClick={onClick}>
        Commit
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: 'Commit' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('requires an accessible label for icon-only actions', () => {
    renderWithPlatform(
      <IconButton label="Accept changes">
        <CheckIcon />
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Accept changes' });
    expect(button.getAttribute('title')).toBe('Accept changes');
  });
});
