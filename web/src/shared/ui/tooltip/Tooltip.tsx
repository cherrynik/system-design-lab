import { Tooltip as MantineTooltip, type FloatingPosition } from '@mantine/core';
import { Children, cloneElement, isValidElement, type ReactElement } from 'react';
import { resolveCompoundTarget } from '../internal/resolve-compound-target';
import { TooltipContent } from './TooltipContent';
import { TooltipTrigger } from './TooltipTrigger';
import { useTooltipDelay } from './tooltip.context';
import type { TooltipContentProps, TooltipProps, TooltipTriggerProps } from './tooltip.types';

const positionMap: Record<NonNullable<TooltipContentProps['side']>, FloatingPosition> = {
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
};

export function Tooltip({ children, openDelay, ...props }: TooltipProps) {
  const providerDelay = useTooltipDelay();
  const parts = Children.toArray(children);
  const trigger = parts.find(
    (part): part is ReactElement<TooltipTriggerProps> =>
      isValidElement(part) && part.type === TooltipTrigger,
  );
  const content = parts.find(
    (part): part is ReactElement<TooltipContentProps> =>
      isValidElement(part) && part.type === TooltipContent,
  );

  if (!trigger || !content) return null;

  const { render, children: triggerChildren, ...triggerProps } = trigger.props;
  const { side = 'top', sideOffset = 8, children: labelChildren, ...labelProps } = content.props;
  const target = resolveCompoundTarget(render, triggerChildren);
  const interactiveTarget = cloneElement(target, {
    ...triggerProps,
    'data-slot': 'tooltip-trigger',
  });
  const delay = openDelay ?? providerDelay;

  return (
    <MantineTooltip
      label={
        <span data-slot="tooltip-content" data-open="" {...labelProps}>
          {labelChildren}
        </span>
      }
      openDelay={delay}
      offset={sideOffset}
      position={positionMap[side]}
      withArrow
      events={{ hover: true, focus: true, touch: false }}
      {...props}
    >
      {interactiveTarget}
    </MantineTooltip>
  );
}
