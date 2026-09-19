import { Modal } from '@mantine/core';
import { useDialogContext } from './dialog.context';
import type { DialogContentProps } from './dialog.types';

export function DialogContent({
  showCloseButton = true,
  closeButtonProps,
  children,
  ...props
}: DialogContentProps) {
  const { opened, close } = useDialogContext();
  const resolvedCloseButtonProps = {
    'aria-label': 'Close dialog',
    ...closeButtonProps,
  };

  return (
    <Modal
      data-slot="dialog-content"
      opened={opened}
      onClose={close}
      withCloseButton={showCloseButton}
      closeButtonProps={resolvedCloseButtonProps}
      overlayProps={{ backgroundOpacity: 0.68, blur: 8 }}
      {...props}
    >
      {children}
    </Modal>
  );
}
