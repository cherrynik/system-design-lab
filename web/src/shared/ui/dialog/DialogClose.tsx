import { Button } from '../button';
import { useDialogContext } from './dialog.context';
import type { DialogCloseProps } from './dialog.types';

export function DialogClose({ onClick, ...props }: DialogCloseProps) {
  const { close } = useDialogContext();

  return (
    <Button
      data-slot="dialog-close"
      variant="outline"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) close();
      }}
      {...props}
    />
  );
}
