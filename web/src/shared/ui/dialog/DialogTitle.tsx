import { Modal } from '@mantine/core';
import type { DialogTitleProps } from './dialog.types';

export function DialogTitle(props: DialogTitleProps) {
  return <Modal.Title data-slot="dialog-title" {...props} />;
}
