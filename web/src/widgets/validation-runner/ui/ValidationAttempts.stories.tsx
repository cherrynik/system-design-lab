import type { Meta, StoryObj } from '@storybook/react-vite';
import { ValidationAttempts } from './ValidationAttempts';
import { validationAttempts } from './validation-attempts.fixtures';

const meta = {
  title: 'Workspace/Validation runner/Attempts',
  component: ValidationAttempts,
  parameters: { layout: 'padded' },
  args: {
    attempts: validationAttempts,
    selectedAttemptId: 2,
    onSelectAttempt: () => undefined,
    onSelectCurrentAttempt: () => undefined,
  },
  render: (args) => (
    <div style={{ width: 'min(840px, 100%)', height: 240 }}>
      <ValidationAttempts {...args} />
    </div>
  ),
} satisfies Meta<typeof ValidationAttempts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const History: Story = {};
export const Empty: Story = { args: { attempts: [], selectedAttemptId: null } };
export const CurrentCanvas: Story = {
  args: { currentAttemptSelected: true, selectedAttemptId: 2 },
};
