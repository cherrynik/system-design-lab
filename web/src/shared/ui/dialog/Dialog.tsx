import { useUncontrolled } from '@mantine/hooks';
import { DialogContext } from './dialog.context';
import type { DialogProps } from './dialog.types';

export function Dialog({ open, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const [opened, setOpened] = useUncontrolled({
    value: open,
    defaultValue: defaultOpen,
    finalValue: false,
    onChange: onOpenChange,
  });

  return (
    <DialogContext.Provider
      value={{
        opened,
        open: () => setOpened(true),
        close: () => setOpened(false),
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}
