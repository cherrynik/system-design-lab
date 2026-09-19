// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ArchitectureValidationBadge } from './ArchitectureValidationBadge';

afterEach(cleanup);

describe('ArchitectureValidationBadge', () => {
  it('exposes the validation message through a named image role', () => {
    render(<ArchitectureValidationBadge status="warning" message="Connect this component." />);

    const badge = screen.getByRole('img', { name: 'Connect this component.' });

    expect(badge.getAttribute('data-tooltip')).toBe('Connect this component.');
    expect(badge.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('uses a useful fallback when a validation message is missing', () => {
    render(<ArchitectureValidationBadge status="error" message="" />);

    expect(
      screen.getByRole('img', { name: 'Node validation issue' }).getAttribute('data-tooltip'),
    ).toBe('Node validation issue');
  });

  it.each(['idle', 'valid'] as const)('does not render for the %s state', (status) => {
    const { container } = render(<ArchitectureValidationBadge status={status} message="" />);

    expect(container.childElementCount).toBe(0);
  });
});
