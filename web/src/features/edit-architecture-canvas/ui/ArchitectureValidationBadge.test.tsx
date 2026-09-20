// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithPlatform as render } from '@/shared/testing/renderWithPlatform';
import { ArchitectureValidationBadge } from './ArchitectureValidationBadge';

afterEach(cleanup);

describe('ArchitectureValidationBadge', () => {
  it('opens the validation tooltip outside the node for keyboard focus', async () => {
    const user = userEvent.setup();
    render(<ArchitectureValidationBadge status="warning" message="Connect this component." />);

    const badge = screen.getByRole('img', { name: 'Connect this component.' });

    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.textContent).toBe('Connect this component.');
    expect(badge.contains(tooltip)).toBe(false);
    expect(tooltip.closest('[data-portal]')).not.toBeNull();
    expect(badge.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('uses a useful fallback when a validation message is missing', () => {
    render(<ArchitectureValidationBadge status="error" message="" />);

    expect(screen.getByRole('img', { name: 'Node validation issue' })).toBeTruthy();
  });

  it.each(['idle', 'valid'] as const)('does not render for the %s state', (status) => {
    render(<ArchitectureValidationBadge status={status} message="" />);

    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
