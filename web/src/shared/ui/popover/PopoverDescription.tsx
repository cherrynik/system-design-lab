import type { PopoverDescriptionProps } from './popover.types';

export function PopoverDescription(props: PopoverDescriptionProps) {
  return <p data-slot="popover-description" {...props} />;
}
