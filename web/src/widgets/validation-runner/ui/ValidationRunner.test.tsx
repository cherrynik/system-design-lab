// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithPlatform } from '@/shared/testing/renderWithPlatform';
import { ValidationRunner } from './ValidationRunner';

afterEach(cleanup);

describe('ValidationRunner', () => {
  it('presents an idle runner and invokes validation with the platform shortcut visible', async () => {
    const user = userEvent.setup();
    const onValidate = vi.fn();
    const onClear = vi.fn();

    renderWithPlatform(
      <ValidationRunner
        error={null}
        lines={[]}
        running={false}
        status="idle"
        usesCommandKey
        outputRef={createRef<HTMLDivElement>()}
        onClear={onClear}
        onValidate={onValidate}
      />,
    );

    expect(screen.getByText('archlab simulator v0.4')).toBeTruthy();
    expect(screen.getByText('Run validation to inspect the active topology.')).toBeTruthy();
    expect(screen.getByText('⌘')).toBeTruthy();
    const clearButton = screen.getByRole('button', { name: 'Clear test runner' });
    expect(clearButton.getAttribute('data-slot')).toBe('icon-button');
    expect(clearButton.hasAttribute('disabled')).toBe(true);

    await user.click(screen.getByRole('button', { name: /Validate/ }));
    expect(onValidate).toHaveBeenCalledTimes(1);
    expect(onClear).not.toHaveBeenCalled();
  });

  it('disables actions while running and announces the current runner status', () => {
    renderWithPlatform(
      <ValidationRunner
        error={null}
        lines={[{ kind: 'pending', text: 'Evaluating active topology…' }]}
        running
        status="running"
        usesCommandKey={false}
        outputRef={createRef<HTMLDivElement>()}
        onClear={vi.fn()}
        onValidate={vi.fn()}
      />,
    );

    expect(screen.getByText('running').className).toBe('sr-only');
    expect(screen.getByText('Ctrl')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Running/ }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Clear test runner' }).hasAttribute('disabled')).toBe(
      true,
    );
    expect(document.querySelector('.terminal-spinner')).toBeTruthy();
  });

  it('renders errors and validation output, accents warnings, and clears completed output', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    renderWithPlatform(
      <ValidationRunner
        error="The architecture could not be evaluated."
        lines={[
          { kind: 'success', text: 'PASS  request path reaches handler' },
          { kind: 'warning', text: 'PASS  1 passed · 1 warning', warningCount: 1 },
        ]}
        running={false}
        status="warning"
        usesCommandKey
        outputRef={createRef<HTMLDivElement>()}
        onClear={onClear}
        onValidate={vi.fn()}
      />,
    );

    expect(screen.getByText('The architecture could not be evaluated.')).toBeTruthy();
    expect(screen.getByText('PASS request path reaches handler')).toBeTruthy();
    expect(screen.getByText('1 warning').className).toBe('terminal-summary-warning');
    expect(screen.queryByText('archlab simulator v0.4')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Clear test runner' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
