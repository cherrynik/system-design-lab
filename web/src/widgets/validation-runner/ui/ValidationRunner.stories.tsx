import { createRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ValidationRunner } from './ValidationRunner';

const storyOutputRef = createRef<HTMLDivElement>();

const meta = {
  title: 'Workspace/Validation runner',
  component: ValidationRunner,
  parameters: { layout: 'padded' },
  args: {
    error: null,
    lines: [],
    running: false,
    status: 'idle',
    usesCommandKey: true,
    outputRef: { current: null },
    onClear: () => undefined,
    onValidate: () => undefined,
  },
  render: (args) => <ValidationRunner {...args} outputRef={storyOutputRef} />,
} satisfies Meta<typeof ValidationRunner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const Passing: Story = {
  args: {
    status: 'ready',
    lines: [
      { kind: 'info', text: 'Checking request path…' },
      { kind: 'success', text: 'PASS 1 passed · 0 warnings' },
    ],
  },
};

export const Warning: Story = {
  args: {
    status: 'warning',
    lines: [
      { kind: 'success', text: 'PASS 1 passed', warningCount: 1 },
      { kind: 'warning', text: 'Load balancer is a single point of failure.' },
    ],
  },
};

export const Failed: Story = {
  args: {
    status: 'error',
    error: 'The architecture could not be evaluated.',
    lines: [{ kind: 'error', text: 'No request path reaches an HTTP handler.' }],
  },
};
