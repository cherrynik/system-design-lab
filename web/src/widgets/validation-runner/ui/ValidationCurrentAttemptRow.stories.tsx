import type { Meta, StoryObj } from '@storybook/react-vite';
import { ValidationCurrentAttemptRow } from './ValidationCurrentAttemptRow';

const meta = {
  title: 'Workspace/Validation runner/Current attempt',
  component: ValidationCurrentAttemptRow,
  parameters: { layout: 'padded' },
  args: { selected: true, onSelect: () => undefined },
  render: (args) => (
    <div style={{ width: 'min(840px, 100%)' }}>
      <ValidationCurrentAttemptRow {...args} />
    </div>
  ),
} satisfies Meta<typeof ValidationCurrentAttemptRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};
export const ViewingArchive: Story = { args: { selected: false } };
