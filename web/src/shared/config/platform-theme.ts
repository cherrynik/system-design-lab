import { createTheme, type MantineColorsTuple } from '@mantine/core';

const platformTeal: MantineColorsTuple = [
  '#e8fff8',
  '#cbf9eb',
  '#94efd3',
  '#58e4ba',
  '#2edca6',
  '#18d89a',
  '#0baf7c',
  '#078b64',
  '#086f53',
  '#075b45',
];

export const platformTheme = createTheme({
  autoContrast: true,
  primaryColor: 'platformTeal',
  primaryShade: { light: 6, dark: 4 },
  colors: {
    platformTeal,
  },
  fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
  fontFamilyMonospace: "'JetBrains Mono Variable', 'SFMono-Regular', 'Cascadia Code', monospace",
  headings: {
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
    fontWeight: '600',
  },
  defaultRadius: 'sm',
  cursorType: 'pointer',
  focusRing: 'auto',
  respectReducedMotion: true,
  components: {
    Button: {
      defaultProps: {
        radius: 'sm',
      },
    },
    ActionIcon: {
      defaultProps: {
        radius: 'sm',
      },
    },
    Menu: {
      defaultProps: {
        radius: 'sm',
        shadow: 'md',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'md',
        centered: true,
      },
    },
    Popover: {
      defaultProps: {
        radius: 'sm',
        shadow: 'md',
      },
    },
  },
});
