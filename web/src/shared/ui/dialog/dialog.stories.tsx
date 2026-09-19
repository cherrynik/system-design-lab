import { Stack } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { Dialog } from './Dialog';
import { DialogClose } from './DialogClose';
import { DialogContent } from './DialogContent';
import { DialogDescription } from './DialogDescription';
import { DialogFooter } from './DialogFooter';
import { DialogHeader } from './DialogHeader';
import { DialogTitle } from './DialogTitle';
import { DialogTrigger } from './DialogTrigger';

const meta = {
  title: 'Composition/Dialog',
  component: Dialog,
  subcomponents: {
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
  },
  args: { children: null },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComponentLibrary: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Open component library</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Component library</DialogTitle>
          <DialogDescription>Search or browse infrastructure components.</DialogDescription>
        </DialogHeader>
        <Stack gap="xs">
          <Button variant="outline">Client</Button>
          <Button variant="outline">Load balancer</Button>
          <Button variant="outline">Service</Button>
        </Stack>
        <DialogFooter>
          <DialogClose>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
