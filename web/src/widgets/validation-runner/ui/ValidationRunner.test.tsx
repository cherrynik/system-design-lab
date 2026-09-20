// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformProvider } from '@/shared/config';
import { renderWithPlatform } from '@/shared/testing/renderWithPlatform';
import { ValidationRunner } from './ValidationRunner';
import type { ValidationRunnerProps } from './ValidationRunner.types';
import { validationAttempts } from './validation-attempts.fixtures';

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
    expect(screen.getByRole('tab', { name: 'Output' }).getAttribute('aria-selected')).toBe('true');
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

  it('keeps native text copying inside the runner instead of forwarding it to the canvas', () => {
    const documentCopy = vi.fn();
    document.addEventListener('copy', documentCopy);

    renderWithPlatform(
      <ValidationRunner
        error={null}
        lines={[{ kind: 'success', text: 'PASS  request path reaches handler' }]}
        running={false}
        status="ready"
        usesCommandKey
        outputRef={createRef<HTMLDivElement>()}
        onClear={vi.fn()}
        onValidate={vi.fn()}
      />,
    );

    const copyEvent = new Event('copy', { bubbles: true, cancelable: true });
    fireEvent(screen.getByText('PASS request path reaches handler'), copyEvent);

    expect(documentCopy).not.toHaveBeenCalled();
    expect(copyEvent.defaultPrevented).toBe(false);
    document.removeEventListener('copy', documentCopy);
  });

  it('keeps saved attempts visible when selecting a different attempt', async () => {
    const user = userEvent.setup();
    const onSelectAttempt = vi.fn();

    renderWithPlatform(
      <ValidationRunner
        error={null}
        lines={validationAttempts[0].terminal}
        running={false}
        status="error"
        usesCommandKey
        outputRef={createRef<HTMLDivElement>()}
        onClear={vi.fn()}
        onValidate={vi.fn()}
        attempts={validationAttempts}
        selectedAttemptId={3}
        onSelectAttempt={onSelectAttempt}
      />,
    );

    await user.click(screen.getByRole('tab', { name: 'Attempts' }));
    expect(
      screen.getByRole('button', { name: 'View Attempt #3' }).getAttribute('aria-current'),
    ).toBe('true');
    expect(screen.getByText('Load Balancer Path')).toBeTruthy();
    expect(screen.getByText('Warnings')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'View Attempt #2' }));

    expect(onSelectAttempt).toHaveBeenCalledWith(2);
    expect(screen.getByRole('tab', { name: 'Attempts' }).getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('preserves access to history when output is cleared and validation stays available', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const onValidate = vi.fn();

    renderWithPlatform(
      <ValidationRunner
        error={null}
        lines={validationAttempts[0].terminal}
        running={false}
        status="error"
        usesCommandKey
        outputRef={createRef<HTMLDivElement>()}
        onClear={onClear}
        onValidate={onValidate}
        attempts={validationAttempts}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Clear test runner' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('tab', { name: 'Attempts' }));
    expect(screen.getAllByRole('button', { name: /View Attempt/ })).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: /Validate/ }));
    expect(onValidate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('tab', { name: 'Attempts' }).getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('explains an empty history and supports keyboard switching between runner tabs', async () => {
    const user = userEvent.setup();

    renderWithPlatform(
      <ValidationRunner
        error={null}
        lines={[]}
        running={false}
        status="idle"
        usesCommandKey
        outputRef={createRef<HTMLDivElement>()}
        onClear={vi.fn()}
        onValidate={vi.fn()}
      />,
    );

    screen.getByRole('tab', { name: 'Output' }).focus();
    await user.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByRole('tab', { name: 'Attempts' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(screen.getByText('No saved attempts yet.')).toBeTruthy();
  });

  it('preserves the selected tab when an external validation starts and finishes', async () => {
    const user = userEvent.setup();
    const props: ValidationRunnerProps = {
      error: null,
      lines: validationAttempts[0].terminal,
      running: false,
      status: 'error',
      usesCommandKey: true,
      outputRef: createRef<HTMLDivElement>(),
      onClear: vi.fn(),
      onValidate: vi.fn(),
      attempts: validationAttempts,
      selectedAttemptId: 3,
    };
    const { rerender } = renderWithPlatform(<ValidationRunner {...props} />);

    await user.click(screen.getByRole('tab', { name: 'Attempts' }));
    rerender(
      <PlatformProvider>
        <ValidationRunner {...props} selectedAttemptId={2} status="warning" />
      </PlatformProvider>,
    );
    expect(screen.getByRole('tab', { name: 'Attempts' }).getAttribute('aria-selected')).toBe(
      'true',
    );

    rerender(
      <PlatformProvider>
        <ValidationRunner {...props} selectedAttemptId={4} running status="running" />
      </PlatformProvider>,
    );
    expect(screen.getByRole('tab', { name: 'Attempts' }).getAttribute('aria-selected')).toBe(
      'true',
    );

    rerender(
      <PlatformProvider>
        <ValidationRunner {...props} selectedAttemptId={4} status="ready" />
      </PlatformProvider>,
    );
    expect(screen.getByRole('tab', { name: 'Attempts' }).getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('pins the editable current attempt before history and keeps the list open on return', async () => {
    const user = userEvent.setup();
    const onSelectCurrentAttempt = vi.fn();
    renderWithPlatform(
      <ValidationRunner
        error={null}
        lines={validationAttempts[0].terminal}
        running={false}
        status="error"
        usesCommandKey
        outputRef={createRef<HTMLDivElement>()}
        onClear={vi.fn()}
        onValidate={vi.fn()}
        attempts={validationAttempts}
        selectedAttemptId={3}
        currentAttemptSelected
        onSelectCurrentAttempt={onSelectCurrentAttempt}
      />,
    );
    await user.click(screen.getByRole('tab', { name: 'Attempts' }));
    const current = screen.getByRole('button', { name: 'View Current attempt' });
    expect(current.getAttribute('aria-current')).toBe('true');
    expect(
      screen.getByRole('button', { name: 'View Attempt #3' }).hasAttribute('aria-current'),
    ).toBe(false);
    expect(
      screen
        .getByRole('region', { name: 'Validation attempts' })
        .firstElementChild?.contains(current),
    ).toBe(true);
    await user.click(current);
    expect(onSelectCurrentAttempt).toHaveBeenCalledOnce();
    expect(screen.getByRole('tab', { name: 'Attempts' }).getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it.each([false, undefined])(
    'changes the live preference without running validation or changing tabs (%s)',
    async (liveChecks) => {
      const user = userEvent.setup();
      const onLiveChecksChange = vi.fn();
      const onValidate = vi.fn();
      const liveIssueCount = liveChecks === false ? 2 : undefined;
      renderWithPlatform(
        <ValidationRunner
          error={null}
          lines={[]}
          running={false}
          status="idle"
          usesCommandKey
          outputRef={createRef<HTMLDivElement>()}
          onClear={vi.fn()}
          onValidate={onValidate}
          liveChecks={liveChecks}
          liveIssueCount={liveIssueCount}
          onLiveChecksChange={onLiveChecksChange}
        />,
      );
      await user.click(screen.getByRole('tab', { name: 'Attempts' }));
      await user.click(screen.getByRole('checkbox', { name: 'Live connection checks' }));
      expect(onLiveChecksChange).toHaveBeenCalledWith(true);
      expect(onValidate).not.toHaveBeenCalled();
      expect(screen.getByRole('tab', { name: 'Attempts' }).getAttribute('aria-selected')).toBe(
        'true',
      );
    },
  );

  it('does not mark Current attempt active when viewing a solution', async () => {
    const user = userEvent.setup();
    renderWithPlatform(
      <ValidationRunner
        error={null}
        lines={[]}
        running={false}
        status="idle"
        usesCommandKey
        outputRef={createRef<HTMLDivElement>()}
        onClear={vi.fn()}
        onValidate={vi.fn()}
        currentAttemptSelected={false}
      />,
    );
    await user.click(screen.getByRole('tab', { name: 'Attempts' }));
    expect(
      screen.getByRole('button', { name: 'View Current attempt' }).hasAttribute('aria-current'),
    ).toBe(false);
    expect(screen.getByText('No saved attempts yet.')).toBeTruthy();
  });
});
