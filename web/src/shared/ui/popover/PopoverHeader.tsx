import type { PopoverHeaderProps } from './popover.types';

export function PopoverHeader(props: PopoverHeaderProps) {
  return <header data-slot="popover-header" {...props} />;
}
