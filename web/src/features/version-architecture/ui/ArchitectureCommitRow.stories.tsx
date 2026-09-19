import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArchitectureCommitRow } from './ArchitectureCommitRow';

const version = {
  id: '1f56d92e-4369-42da-b143-f2e0f91a6113',
  name: 'Add load balancer',
  createdAt: '2026-09-19T17:30:00.000Z',
  nodes: [],
  edges: [],
};

const meta = {
  title: 'Workspace/Commits menu/Commit row',
  component: ArchitectureCommitRow,
  args: {
    version,
    editing: false,
    latest: true,
    draft: version.name,
    onDraftChange: () => undefined,
    onBeginRename: () => undefined,
    onFinishRename: () => undefined,
    onCancelRename: () => undefined,
    onRestore: () => undefined,
    onDeleteLatest: () => undefined,
  },
} satisfies Meta<typeof ArchitectureCommitRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Latest: Story = {};

export const Editing: Story = {
  args: { editing: true },
};
