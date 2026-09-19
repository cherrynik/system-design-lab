// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ArchitectureVersion } from '../../../entities/architecture';
import { ArchitectureCommitsMenu } from './ArchitectureCommitsMenu';

const version: ArchitectureVersion = {
  id: '12345678-abcd-4abc-8abc-1234567890ab',
  name: 'Initial architecture',
  createdAt: '2026-09-18T12:00:00.000Z',
  nodes: [],
  edges: [],
};

afterEach(cleanup);

describe('ArchitectureCommitsMenu', () => {
  it('shows short commit hashes and renames a commit inline', () => {
    const onRename = vi.fn();
    render(<ArchitectureCommitsMenu
      versions={[version]}
      open
      onOpenChange={vi.fn()}
      onCommit={vi.fn()}
      onRestore={vi.fn()}
      onRename={onRename}
      onDeleteLatest={vi.fn()}
    />);

    expect(screen.getByText('1234567')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Commit' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Rename Initial architecture' }));
    const input = screen.getByRole('textbox', { name: 'Rename Initial architecture' });
    fireEvent.change(input, { target: { value: 'Load balancer path' } });
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Finish renaming Initial architecture' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish renaming Initial architecture' }));

    expect(onRename).toHaveBeenCalledWith(version.id, 'Load balancer path');
    expect(screen.getByRole('button', { name: 'Rename Initial architecture' })).toBeTruthy();
  });

  it('cancels an inline rename with Escape', () => {
    const onRename = vi.fn();
    const onOpenChange = vi.fn();
    render(<ArchitectureCommitsMenu
      versions={[version]}
      open
      onOpenChange={onOpenChange}
      onCommit={vi.fn()}
      onRestore={vi.fn()}
      onRename={onRename}
      onDeleteLatest={vi.fn()}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Rename Initial architecture' }));
    const input = screen.getByRole('textbox', { name: 'Rename Initial architecture' });
    fireEvent.change(input, { target: { value: 'Discarded name' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onRename).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const onOpenChange = vi.fn();
    render(<ArchitectureCommitsMenu
      versions={[version]}
      open
      onOpenChange={onOpenChange}
      onCommit={vi.fn()}
      onRestore={vi.fn()}
      onRename={vi.fn()}
      onDeleteLatest={vi.fn()}
    />);

    const trigger = screen.getByRole('button', { name: 'Architecture commits' });
    screen.getByRole('button', { name: 'Commit' }).focus();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('moves focus into the open commits dialog', () => {
    render(<ArchitectureCommitsMenu
      versions={[version]}
      open
      onOpenChange={vi.fn()}
      onCommit={vi.fn()}
      onRestore={vi.fn()}
      onRename={vi.fn()}
      onDeleteLatest={vi.fn()}
    />);

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Commit' }));
    expect(screen.getByRole('button', { name: 'Architecture commits' }).getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('keeps restore and pencil rename as separate actions', () => {
    const onRestore = vi.fn();
    render(<ArchitectureCommitsMenu
      versions={[version]}
      open
      onOpenChange={vi.fn()}
      onCommit={vi.fn()}
      onRestore={onRestore}
      onRename={vi.fn()}
      onDeleteLatest={vi.fn()}
    />);

    const restore = screen.getByText('Initial architecture').closest('button')!;
    fireEvent.doubleClick(restore);
    expect(screen.queryByRole('textbox', { name: 'Rename Initial architecture' })).toBeNull();

    fireEvent.click(restore);
    expect(onRestore).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Rename Initial architecture' }));
    expect(screen.getByRole('textbox', { name: 'Rename Initial architecture' })).toBeTruthy();
  });

  it('only exposes deletion for the latest commit', () => {
    const onDeleteLatest = vi.fn();
    const older = { ...version, id: 'older-commit', name: 'Older commit' };
    render(<ArchitectureCommitsMenu
      versions={[version, older]}
      open
      onOpenChange={vi.fn()}
      onCommit={vi.fn()}
      onRestore={vi.fn()}
      onRename={vi.fn()}
      onDeleteLatest={onDeleteLatest}
    />);

    expect(screen.queryByRole('button', { name: 'Delete latest commit Older commit' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Delete latest commit Initial architecture' }));
    expect(onDeleteLatest).toHaveBeenCalledOnce();
  });
});
