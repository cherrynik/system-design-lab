import type { Meta, StoryObj } from '@storybook/react-vite';
import { referenceSolutions } from '@/entities/architecture';
import { SolutionCanvasHeader } from './SolutionCanvasHeader';

const meta = {
  title: 'Workspace/Solutions/Canvas header',
  component: SolutionCanvasHeader,
  args: {
    solution: referenceSolutions[1],
    onBack: () => undefined,
  },
} satisfies Meta<typeof SolutionCanvasHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
