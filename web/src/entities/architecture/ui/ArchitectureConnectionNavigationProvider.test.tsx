// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformProvider } from '@/shared/config';
import { useConnectionNavigation } from '../model/useConnectionNavigation';
import { ArchitectureConnectionNavigationProvider } from './ArchitectureConnectionNavigationProvider';
import { ArchitectureConnectionPort } from './ArchitectureConnectionPort';
import { connectionPortNodes } from './ArchitectureConnectionPorts.fixtures';

afterEach(cleanup);

function HighlightedNodes() {
  const { highlightedNodeIds } = useConnectionNavigation();
  return <output aria-label="Highlighted nodes">{[...highlightedNodeIds].join(',')}</output>;
}

function Fixture({ showPort = true, scope = 'canvas', onFocus = vi.fn() }) {
  return (
    <PlatformProvider>
      <ArchitectureConnectionNavigationProvider scope={scope} onFocus={onFocus}>
        {showPort && (
          <ArchitectureConnectionPort direction="incoming" connections={[connectionPortNodes[0]]} />
        )}
        <ArchitectureConnectionPort
          direction="outgoing"
          connections={[connectionPortNodes[1], connectionPortNodes[2], connectionPortNodes[1]]}
        />
        <ArchitectureConnectionPort direction="outgoing" connections={[]} />
        <HighlightedNodes />
      </ArchitectureConnectionNavigationProvider>
    </PlatformProvider>
  );
}

describe('connection navigation', () => {
  it('previews sources and recipients independently and clears only the active port', () => {
    render(<Fixture />);
    const input = screen.getByRole('button', { name: /^Input:/ });
    const output = screen.getByRole('button', { name: /^Output:/ });
    fireEvent.pointerEnter(input);
    expect(screen.getByLabelText('Highlighted nodes').textContent).toBe('client');
    fireEvent.pointerEnter(output);
    fireEvent.pointerLeave(input);
    expect(screen.getByLabelText('Highlighted nodes').textContent).toBe('balancer,service');
    fireEvent.pointerLeave(output);
    expect(screen.getByLabelText('Highlighted nodes').textContent).toBe('');
  });

  it('focuses a deduplicated group only on double click or keyboard activation', () => {
    const onFocus = vi.fn();
    render(<Fixture onFocus={onFocus} />);
    const output = screen.getByRole('button', { name: /^Output:/ });
    fireEvent.click(output);
    expect(onFocus).not.toHaveBeenCalled();
    fireEvent.doubleClick(output);
    expect(onFocus).toHaveBeenLastCalledWith(['balancer', 'service']);
    fireEvent.keyDown(screen.getByRole('button', { name: /^Input:/ }), { key: 'Enter' });
    expect(onFocus).toHaveBeenLastCalledWith(['client']);
    fireEvent.keyDown(output, { key: ' ' });
    expect(onFocus).toHaveBeenCalledTimes(3);
    fireEvent.doubleClick(screen.getByRole('img', { name: 'Output: Not connected' }));
    expect(onFocus).toHaveBeenCalledTimes(3);
  });

  it('removes a preview when its port unmounts or the canvas document changes', () => {
    const { rerender } = render(<Fixture />);
    fireEvent.pointerEnter(screen.getByRole('button', { name: /^Input:/ }));
    rerender(<Fixture showPort={false} />);
    expect(screen.getByLabelText('Highlighted nodes').textContent).toBe('');
    fireEvent.pointerEnter(screen.getByRole('button', { name: /^Output:/ }));
    rerender(<Fixture showPort={false} scope="solution" />);
    expect(screen.getByLabelText('Highlighted nodes').textContent).toBe('');
  });
});
