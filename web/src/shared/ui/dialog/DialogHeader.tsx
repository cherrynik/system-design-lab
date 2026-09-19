import type { DialogHeaderProps } from './dialog.types';

export function DialogHeader({ style, ...props }: DialogHeaderProps) {
  return (
    <header
      data-slot="dialog-header"
      style={{
        marginBottom: 'var(--space-4)',
        ...style,
      }}
      {...props}
    />
  );
}
