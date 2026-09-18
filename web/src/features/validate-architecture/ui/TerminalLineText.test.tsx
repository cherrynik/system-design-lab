// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TerminalLineText } from './TerminalLineText';

afterEach(cleanup);

describe('TerminalLineText', () => {
  it('highlights a non-zero warning summary separately', () => {
    render(<p><TerminalLineText text="PASS  1 passed · 1 warning" warningCount={1} /></p>);

    expect(screen.getByText('1 warning').className).toBe('terminal-summary-warning');
  });

  it('keeps a zero-warning summary unaccented', () => {
    const { container } = render(<p><TerminalLineText text="PASS  1 passed · 0 warnings" warningCount={0} /></p>);

    expect(container.querySelector('.terminal-summary-warning')).toBeNull();
  });
});
