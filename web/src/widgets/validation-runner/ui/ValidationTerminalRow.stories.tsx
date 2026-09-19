import type { Meta, StoryObj } from '@storybook/react-vite';
import { ValidationTerminalRow } from './ValidationTerminalRow';

const meta = {
  title: 'Workspace/Validation runner/Terminal row',
  component: ValidationTerminalRow,
  args: {
    index: 0,
    line: { kind: 'info', text: 'Checking request path…' },
  },
} satisfies Meta<typeof ValidationTerminalRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const Pending: Story = {
  args: { line: { kind: 'pending', text: 'Evaluating topology…' } },
};

export const Success: Story = {
  args: { line: { kind: 'success', text: 'PASS 1 passed · 0 warnings' } },
};
