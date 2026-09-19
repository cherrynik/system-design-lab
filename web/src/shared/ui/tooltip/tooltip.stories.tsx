import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import { IconButton } from '../button';
import { Kbd } from '../kbd';
import { Tooltip } from './Tooltip';
import { TooltipContent } from './TooltipContent';
import { TooltipProvider } from './TooltipProvider';
import { TooltipTrigger } from './TooltipTrigger';

const meta = {
  title: 'Composition/Tooltip',
  component: Tooltip,
  subcomponents: { TooltipProvider, TooltipTrigger, TooltipContent },
  args: { children: null },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AddComponent: Story = {
  render: () => (
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger render={<IconButton label="Add component" variant="outline" />}>
          <Plus size={14} />
        </TooltipTrigger>
        <TooltipContent>
          Add component <Kbd>⌘ K</Kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
