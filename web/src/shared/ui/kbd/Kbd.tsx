import { Kbd as MantineKbd } from '@mantine/core';
import type { KbdProps } from './kbd.types';

export function Kbd(props: KbdProps) {
  return <MantineKbd data-slot="kbd" {...props} />;
}
