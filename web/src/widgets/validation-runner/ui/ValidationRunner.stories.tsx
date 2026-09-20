import { createRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ValidationRunner } from './ValidationRunner';
import { warningAttempt, validationAttempts } from './validation-attempts.fixtures';

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
  render: (args) => (
    <div style={{ width: 'min(840px, 100%)', height: 280 }}>
      <ValidationRunner {...args} outputRef={storyOutputRef} />
    </div>
  ),
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

export const WithAttempts: Story = {
  args: {
    attempts: validationAttempts,
    selectedAttemptId: 2,
    status: warningAttempt.status,
    lines: warningAttempt.terminal,
    onSelectAttempt: fn(),
    currentAttemptSelected: false,
    onSelectCurrentAttempt: fn(),
    onValidate: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'Attempts' }));
    await expect(canvas.getByRole('button', { name: 'View Attempt #2' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'View Attempt #1' }));
    await expect(args.onSelectAttempt).toHaveBeenCalledWith(1);
    await expect(canvas.getByRole('tab', { name: 'Attempts' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'View Current attempt' }));
    await expect(args.onSelectCurrentAttempt).toHaveBeenCalledOnce();
    await expect(canvas.getByRole('tab', { name: 'Attempts' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: /^Validate/ }));
    await expect(args.onValidate).toHaveBeenCalledOnce();
    await expect(canvas.getByRole('tab', { name: 'Attempts' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  },
};
