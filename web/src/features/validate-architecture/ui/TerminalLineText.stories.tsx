import type { Meta, StoryObj } from '@storybook/react-vite';
import { TerminalLineText } from './TerminalLineText';

const meta = {
  title: 'Validation/Terminal line text',
  component: TerminalLineText,
  args: {
    text: '1 passed · 1 warning',
    warningCount: 1,
  },
} satisfies Meta<typeof TerminalLineText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Warning: Story = {};
export const Plain: Story = { args: { text: '1 passed', warningCount: 0 } };
