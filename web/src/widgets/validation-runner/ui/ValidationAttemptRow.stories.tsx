import type { Meta, StoryObj } from '@storybook/react-vite';
import { ValidationAttemptRow } from './ValidationAttemptRow';
import { completedAttempt, failedAttempt, warningAttempt } from './validation-attempts.fixtures';

const meta = {
  title: 'Workspace/Validation runner/Attempt row',
  component: ValidationAttemptRow,
  parameters: { layout: 'padded' },
  args: {
    attempt: completedAttempt,
    selected: false,
    onSelect: () => undefined,
  },
  render: (args) => (
    <div style={{ width: 'min(840px, 100%)' }}>
      <ValidationAttemptRow {...args} />
    </div>
  ),
} satisfies Meta<typeof ValidationAttemptRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Passed: Story = {};
export const Warning: Story = { args: { attempt: warningAttempt, selected: true } };
export const Failed: Story = { args: { attempt: failedAttempt } };
export const Running: Story = { args: { attempt: { ...completedAttempt, status: 'running' } } };
