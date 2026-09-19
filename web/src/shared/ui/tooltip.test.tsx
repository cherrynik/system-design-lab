// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

afterEach(cleanup);

describe('Tooltip', () => {
  it('opens for keyboard focus and dismisses with Escape', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delay={0}>
        <Tooltip>
          <TooltipTrigger>Validate</TooltipTrigger>
          <TooltipContent>Run architecture checks</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Validate' }));
    const tooltip = await screen.findByText('Run architecture checks');
    expect(tooltip.getAttribute('data-slot')).toBe('tooltip-content');
    expect(tooltip.hasAttribute('data-open')).toBe(true);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Run architecture checks')).toBeNull());
  });
});
