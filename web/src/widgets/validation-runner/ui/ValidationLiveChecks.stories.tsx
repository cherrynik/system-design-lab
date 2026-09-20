import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ValidationLiveChecks } from './ValidationLiveChecks';
import './validation-attempts.css';

const meta = {
  title: 'Workspace/Validation runner/Live checks',
  component: ValidationLiveChecks,
  args: { enabled: false, issueCount: 0, onChange: fn() },
} satisfies Meta<typeof ValidationLiveChecks>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Off: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('checkbox', { name: 'Live connection checks' }),
    );
    await expect(args.onChange).toHaveBeenCalledWith(true);
  },
};
export const Warnings: Story = { args: { enabled: true, issueCount: 2 } };
export const Clear: Story = { args: { enabled: true } };
