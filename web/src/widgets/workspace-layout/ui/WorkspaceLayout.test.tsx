// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WorkspaceLayout } from './WorkspaceLayout';

afterEach(cleanup);

describe('WorkspaceLayout', () => {
  it('renders keyboard-accessible separators for the sidebar and runner', () => {
    render(
      <WorkspaceLayout
        sidebar={<aside>Requirements</aside>}
        canvas={<section>Canvas</section>}
        runner={<section>Test runner</section>}
        sidebarCollapsed={false}
      />,
    );

    expect(screen.getByText('Requirements')).toBeTruthy();
    expect(screen.getByText('Canvas')).toBeTruthy();
    expect(screen.getByText('Test runner')).toBeTruthy();
    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(2);
    expect(separators[0].getAttribute('aria-orientation')).toBe('vertical');
    expect(separators[0].getAttribute('tabindex')).toBe('0');
    expect(separators[0].getAttribute('aria-controls')).toBe('requirements-panel');
    expect(separators[1].getAttribute('aria-orientation')).toBe('horizontal');
    expect(separators[1].getAttribute('tabindex')).toBe('0');
    expect(separators[1].getAttribute('aria-controls')).toBe('canvas-panel');
  });

  it('keeps the collapsed sidebar rail mounted so it can be expanded', () => {
    render(
      <WorkspaceLayout
        sidebar={<aside>Requirements</aside>}
        canvas={<section>Canvas</section>}
        runner={<section>Test runner</section>}
        sidebarCollapsed
      />,
    );

    expect(screen.getByText('Requirements')).toBeTruthy();
    expect(screen.getByText('Canvas')).toBeTruthy();
    expect(screen.getByText('Test runner')).toBeTruthy();
    expect(
      screen
        .getByText('Requirements')
        .closest('.workspace-layout__sidebar')
        ?.classList.contains('workspace-layout__sidebar--collapsed'),
    ).toBe(true);

    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(1);
    expect(separators[0].getAttribute('aria-orientation')).toBe('horizontal');
    expect(separators[0].getAttribute('aria-controls')).toBe('canvas-panel');
  });
});
