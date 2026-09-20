// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithPlatform as render } from '@/shared/testing/renderWithPlatform';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ArchitectureNode } from '../model/architecture.types';
import { ArchitectureLayerItem } from './ArchitectureLayerItem';
import type { ArchitectureNodeConnectionState } from '../model/connections';
import type { ArchitectureNodeValidationState } from '../model/nodeValidation';

const node: ArchitectureNode = {
  id: 'service-1',
  type: 'architecture',
  position: { x: 0, y: 0 },
  data: { kind: 'service', variantId: 'abstract', label: 'Service' },
};
const connectionState: ArchitectureNodeConnectionState = {
  state: 'isolated',
  incoming: [],
  outgoing: [],
  missing: ['incoming'],
};

afterEach(cleanup);

const setup = (state = connectionState) => {
  const onFocus = vi.fn();
  const onOpenMenu = vi.fn();
  const onRename = vi.fn();
  render(
    <ArchitectureLayerItem
      node={node}
      fallbackLabel="Server"
      connectionState={state}
      onFocus={onFocus}
      onOpenMenu={onOpenMenu}
      onRename={onRename}
    />,
  );
  return { onFocus, onOpenMenu, onRename };
};

describe('ArchitectureLayerItem', () => {
  it('opens inline rename on double click and submits with Enter', () => {
    const { onRename } = setup();
    fireEvent.doubleClick(screen.getByText('Service'));

    const input = screen.getByRole('textbox', { name: 'Rename Service' });
    expect((input as HTMLInputElement).value).toBe('Service');
    fireEvent.change(input, { target: { value: 'Orders API' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith('service-1', 'Orders API');
  });

  it('cancels inline rename with Escape', () => {
    const { onRename } = setup();
    fireEvent.doubleClick(screen.getByText('Service'));
    const input = screen.getByRole('textbox', { name: 'Rename Service' });
    fireEvent.change(input, { target: { value: 'Discarded name' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByText('Service')).toBeTruthy();
  });

  it('keeps focus and context-menu actions working', () => {
    const { onFocus, onOpenMenu } = setup();
    fireEvent.click(screen.getByText('Service'));
    fireEvent.click(screen.getByRole('button', { name: 'Open menu for Service' }), {
      clientX: 24,
      clientY: 42,
    });

    expect(onFocus).toHaveBeenCalledWith('service-1');
    expect(onOpenMenu).toHaveBeenCalledWith('service-1', 24, 42);
  });

  it('focuses with Enter or Space and reserves F2 for rename', () => {
    const { onFocus } = setup();
    const item = screen.getByText('Service').closest('[role="button"]')!;

    fireEvent.keyDown(item, { key: 'Enter' });
    fireEvent.keyDown(item, { key: ' ' });

    expect(onFocus).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('textbox', { name: 'Rename Service' })).toBeNull();

    fireEvent.keyDown(item, { key: 'F2' });
    expect(screen.getByRole('textbox', { name: 'Rename Service' })).toBeTruthy();
  });

  it('opens the component menu on right click without the browser menu', () => {
    const { onOpenMenu } = setup();
    const item = screen.getByText('Service').closest('.layer-row')!;
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 31,
      clientY: 47,
    });

    item.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onOpenMenu).toHaveBeenCalledWith('service-1', 31, 47);
  });

  it('shows the component connection requirement', () => {
    setup();
    expect(screen.getByText('Choose source')).toBeTruthy();
  });

  it('shows the latest node validation status', () => {
    const validationState: ArchitectureNodeValidationState = {
      status: 'warning',
      issues: [
        {
          code: 'NODE_INPUT_REQUIRED',
          nodeId: node.id,
          severity: 'warning',
          message: 'Service has no incoming connection.',
          suggestion: 'Connect a request source to Service.',
        },
      ],
    };
    render(
      <ArchitectureLayerItem
        node={node}
        fallbackLabel="Server"
        connectionState={connectionState}
        validationState={validationState}
        onFocus={vi.fn()}
        onOpenMenu={vi.fn()}
        onRename={vi.fn()}
      />,
    );

    const warning = screen.getByLabelText(/^Service: 1 validation issue\./);
    expect(warning.getAttribute('aria-label')).toContain('Service has no incoming connection.');
    expect(warning.getAttribute('aria-label')).toContain('Connect a request source to Service.');
  });

  it('does not show validation state before a validation run', () => {
    setup();
    expect(screen.queryByLabelText(/validation issue/)).toBeNull();
  });

  it('renders connected components as visual links with their component icon', () => {
    const client: ArchitectureNode = {
      ...node,
      id: 'client-1',
      data: { kind: 'client', variantId: 'abstract', label: 'Client' },
    };
    setup({ state: 'ready', incoming: [client], outgoing: [], missing: [] });

    const link = screen.getByLabelText('Connected from Client');
    expect(link.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('Client')).toBeTruthy();
  });
});
