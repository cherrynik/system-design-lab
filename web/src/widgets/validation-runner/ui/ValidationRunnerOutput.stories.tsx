import { createRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ValidationRunnerOutput } from './ValidationRunnerOutput';

const storyOutputRef = createRef<HTMLDivElement>();

const meta = {
  title: 'Workspace/Validation runner/Output',
  component: ValidationRunnerOutput,
  args: {
    error: null,
    lines: [],
    outputRef: { current: null },
  },
  render: (args) => <ValidationRunnerOutput {...args} outputRef={storyOutputRef} />,
} satisfies Meta<typeof ValidationRunnerOutput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Results: Story = {
  args: {
    lines: [
      { kind: 'info', text: 'Observed request path:' },
      { kind: 'success', text: 'Browser → NGINX → Go HTTP API' },
      { kind: 'warning', text: 'PASS 1 passed · 1 warning', warningCount: 1 },
    ],
  },
};
