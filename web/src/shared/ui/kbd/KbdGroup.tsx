import type { KbdGroupProps } from './kbd.types';

export function KbdGroup({ style, ...props }: KbdGroupProps) {
  return (
    <span
      data-slot="kbd-group"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, ...style }}
      {...props}
    />
  );
}
