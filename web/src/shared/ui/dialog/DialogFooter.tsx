import { DialogClose } from './DialogClose';
import type { DialogFooterProps } from './dialog.types';

export function DialogFooter({
  showCloseButton = false,
  children,
  style,
  ...props
}: DialogFooterProps) {
  return (
    <footer
      data-slot="dialog-footer"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 'var(--space-2)',
        marginTop: 'var(--space-4)',
        ...style,
      }}
      {...props}
    >
      {children}
      {showCloseButton && <DialogClose>Close</DialogClose>}
    </footer>
  );
}
