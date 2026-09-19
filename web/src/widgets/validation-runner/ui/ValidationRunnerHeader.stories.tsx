import type { Meta, StoryObj } from '@storybook/react-vite';
import { ValidationRunnerHeader } from './ValidationRunnerHeader';

const meta = {
  title: 'Workspace/Validation runner/Header',
  component: ValidationRunnerHeader,
  args: {
    lines: [],
    onClear: () => undefined,
    onValidate: () => undefined,
    running: false,
    status: 'idle',
    usesCommandKey: true,
  },
} satisfies Meta<typeof ValidationRunnerHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const Running: Story = {
  args: {
    running: true,
    status: 'running',
  },
};
