// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithPlatform } from '@/shared/testing/renderWithPlatform';
import { ValidationLiveChecks } from './ValidationLiveChecks';

afterEach(cleanup);

describe('ValidationLiveChecks', () => {
  it.each([
    { enabled: false, issueCount: 2, description: 'Check connections as you edit.', badge: null },
    { enabled: true, issueCount: 0, description: 'No connection issues.', badge: null },
    { enabled: true, issueCount: 1, description: '1 connection issue.', badge: '1' },
    { enabled: true, issueCount: 2, description: '2 connection issues.', badge: '2' },
  ])(
    'explains the current live state: $description',
    async ({ enabled, issueCount, description, badge }) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderWithPlatform(
        <ValidationLiveChecks enabled={enabled} issueCount={issueCount} onChange={onChange} />,
      );
      const checkbox = screen.getByRole('checkbox', { name: 'Live connection checks' });
      expect((checkbox as HTMLInputElement).checked).toBe(enabled);
      expect(screen.queryByRole('status')?.textContent ?? null).toBe(badge);
      await user.hover(checkbox);
      expect((await screen.findByRole('tooltip')).textContent).toContain(description);
      await user.click(checkbox);
      expect(onChange).toHaveBeenCalledWith(!enabled);
    },
  );
});
