import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid3X3 } from 'lucide-react';
import { Toggle } from './Toggle';

const meta = {
  title: 'Primitives/Toggle',
  component: Toggle,
  args: { children: 'Snap to grid' },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithIcon: Story = {
  render: () => (
    <Toggle defaultPressed leftSection={<Grid3X3 size={14} />}>
      Grid
    </Toggle>
  ),
};
