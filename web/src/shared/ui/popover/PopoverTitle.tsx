import type { PopoverTitleProps } from './popover.types';

export function PopoverTitle(props: PopoverTitleProps) {
  return <h2 data-slot="popover-title" {...props} />;
}
