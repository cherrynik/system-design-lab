import { Stack, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GitBranch } from 'lucide-react';
import { IconButton } from '../button';
import { Popover } from './Popover';
import { PopoverContent } from './PopoverContent';
import { PopoverDescription } from './PopoverDescription';
import { PopoverHeader } from './PopoverHeader';
import { PopoverTitle } from './PopoverTitle';
import { PopoverTrigger } from './PopoverTrigger';

const meta = {
  title: 'Composition/Popover',
  component: Popover,
  subcomponents: {
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CommitHistory: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<IconButton label="Architecture commits" variant="outline" />}>
        <GitBranch size={15} />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" w={280}>
        <PopoverHeader>
          <PopoverTitle>Commits</PopoverTitle>
          <PopoverDescription>Manual architecture checkpoints</PopoverDescription>
        </PopoverHeader>
        <Stack gap="xs" mt="sm">
          <Text size="sm">e894cd2 Initial route</Text>
          <Text size="sm">67eca57 Add load balancer</Text>
        </Stack>
      </PopoverContent>
    </Popover>
  ),
};
