import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArchitectureCommitsMenu } from './ArchitectureCommitsMenu';

const meta = {
  title: 'Workspace/Commits menu',
  component: ArchitectureCommitsMenu,
  args: {
    versions: [],
    dirty: true,
    open: true,
    onOpenChange: () => undefined,
    onCommit: () => undefined,
    onRestore: () => undefined,
    onRename: () => undefined,
    onDeleteLatest: () => undefined,
  },
} satisfies Meta<typeof ArchitectureCommitsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithHistory: Story = {
  args: {
    dirty: false,
    versions: [
      {
        id: '1f56d92e-4369-42da-b143-f2e0f91a6113',
        name: 'Add load balancer',
        createdAt: '2026-09-19T17:30:00.000Z',
        nodes: [],
        edges: [],
      },
      {
        id: '6ac7499c-02c9-4b69-8a9f-4093b48fce51',
        name: 'Initial route',
        createdAt: '2026-09-19T17:20:00.000Z',
        nodes: [],
        edges: [],
      },
    ],
  },
};
