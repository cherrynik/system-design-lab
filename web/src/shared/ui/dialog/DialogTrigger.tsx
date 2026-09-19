import { cloneElement, type ReactElement } from 'react';
import { resolveCompoundTarget } from '../internal/resolve-compound-target';
import { useDialogContext } from './dialog.context';
import type { DialogTriggerElementProps, DialogTriggerProps } from './dialog.types';

export function DialogTrigger({ render, children, onClick, ...props }: DialogTriggerProps) {
  const { open } = useDialogContext();
  const target = resolveCompoundTarget(render, children) as ReactElement<DialogTriggerElementProps>;
  const originalClick = target.props.onClick;

  return cloneElement(target, {
    ...props,
    'data-slot': 'dialog-trigger',
    onClick: (event) => {
      originalClick?.(event);
      onClick?.(event as React.MouseEvent<HTMLButtonElement>);
      if (!event.defaultPrevented) open();
    },
  });
}
