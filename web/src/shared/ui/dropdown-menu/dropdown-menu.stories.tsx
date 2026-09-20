import type { Meta, StoryObj } from '@storybook/react-vite';
import { Copy, Focus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { expect, userEvent, within } from 'storybook/test';
import { IconButton } from '../button';
import { DropdownMenu } from './DropdownMenu';
import { DropdownMenuCheckboxItem } from './DropdownMenuCheckboxItem';
import { DropdownMenuContent } from './DropdownMenuContent';
import { DropdownMenuGroup } from './DropdownMenuGroup';
import { DropdownMenuItem } from './DropdownMenuItem';
import { DropdownMenuLabel } from './DropdownMenuLabel';
import { DropdownMenuRadioGroup } from './DropdownMenuRadioGroup';
import { DropdownMenuRadioItem } from './DropdownMenuRadioItem';
import { DropdownMenuSeparator } from './DropdownMenuSeparator';
import { DropdownMenuShortcut } from './DropdownMenuShortcut';
import { DropdownMenuSub } from './DropdownMenuSub';
import { DropdownMenuSubContent } from './DropdownMenuSubContent';
import { DropdownMenuSubTrigger } from './DropdownMenuSubTrigger';
import { DropdownMenuTrigger } from './DropdownMenuTrigger';

const meta = {
  title: 'Composition/Dropdown menu',
  component: DropdownMenu,
  subcomponents: {
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComponentActions: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<IconButton label="Component actions" variant="outline" />}>
        <MoreHorizontal size={15} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Load balancer</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem leftSection={<Focus size={14} />}>
            Focus<DropdownMenuShortcut>F</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem leftSection={<Pencil size={14} />}>
            Rename<DropdownMenuShortcut>↵</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem leftSection={<Copy size={14} />}>Duplicate</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Validation</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuCheckboxItem defaultChecked>Include in checks</DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuRadioGroup defaultValue="http">
          <DropdownMenuRadioItem value="http">HTTP</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="https">HTTPS</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" leftSection={<Trash2 size={14} />}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Component actions' });
    await userEvent.click(trigger);
    const menu = await page.findByRole('menu', { name: 'Component actions' });
    const item = page.getByRole('menuitem', { name: 'Duplicate' });
    await expect(getComputedStyle(menu).borderTopWidth).toBe('0px');
    await expect(getComputedStyle(menu).backgroundColor).toBe('rgb(16, 29, 48)');
    await expect(getComputedStyle(item).fontSize).toBe('12px');
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveFocus();
  },
};
