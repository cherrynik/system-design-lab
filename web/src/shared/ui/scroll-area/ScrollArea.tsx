import { ScrollArea as MantineScrollArea } from '@mantine/core';
import type { ScrollAreaProps } from './scroll-area.types';

export function ScrollArea({ autosize = false, viewportProps, ...props }: ScrollAreaProps) {
  const focusableViewportProps = {
    ...viewportProps,
    tabIndex: viewportProps?.tabIndex ?? 0,
  };

  if (autosize) {
    return (
      <MantineScrollArea.Autosize
        data-slot="scroll-area"
        type="hover"
        scrollbarSize={6}
        viewportProps={focusableViewportProps}
        {...props}
      />
    );
  }

  return (
    <MantineScrollArea
      data-slot="scroll-area"
      type="hover"
      scrollbarSize={6}
      viewportProps={focusableViewportProps}
      {...props}
    />
  );
}
