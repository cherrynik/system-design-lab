import { Toolbar as ToolbarPrimitive } from '@base-ui/react/toolbar';
import type * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { buttonVariants, type ButtonProps } from '@/shared/ui/button';

function Toolbar({ className, orientation = 'horizontal', ...props }: ToolbarPrimitive.Root.Props) {
  return (
    <ToolbarPrimitive.Root
      data-slot="toolbar"
      orientation={orientation}
      className={cn(
        'flex w-fit items-center gap-1 rounded-lg bg-muted/60 p-1 data-vertical:flex-col',
        className,
      )}
      {...props}
    />
  );
}

function ToolbarGroup({ className, ...props }: ToolbarPrimitive.Group.Props) {
  return (
    <ToolbarPrimitive.Group
      data-slot="toolbar-group"
      className={cn('flex items-center gap-0.5 data-vertical:flex-col', className)}
      {...props}
    />
  );
}

type ToolbarButtonProps = ToolbarPrimitive.Button.Props & Pick<ButtonProps, 'variant' | 'size'>;

function ToolbarButton({
  className,
  variant = 'ghost',
  size = 'icon-sm',
  ...props
}: ToolbarButtonProps) {
  return (
    <ToolbarPrimitive.Button
      data-slot="toolbar-button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

type ToolbarIconButtonProps = Omit<ToolbarButtonProps, 'aria-label' | 'children' | 'size'> & {
  label: string;
  children: React.ReactNode;
  size?: 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';
};

function ToolbarIconButton({
  label,
  title = label,
  size = 'icon-sm',
  children,
  ...props
}: ToolbarIconButtonProps) {
  return (
    <ToolbarButton aria-label={label} title={title} size={size} {...props}>
      {children}
    </ToolbarButton>
  );
}

function ToolbarSeparator({ className, ...props }: ToolbarPrimitive.Separator.Props) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      className={cn(
        'mx-1 h-4 w-px shrink-0 bg-border data-horizontal:mx-0 data-horizontal:my-1 data-horizontal:h-px data-horizontal:w-4',
        className,
      )}
      {...props}
    />
  );
}

export { Toolbar, ToolbarButton, ToolbarGroup, ToolbarIconButton, ToolbarSeparator };
export type { ToolbarButtonProps, ToolbarIconButtonProps };
