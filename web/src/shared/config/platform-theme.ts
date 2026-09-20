import { createTheme, type MantineColorsTuple } from '@mantine/core';

const platformSignal: MantineColorsTuple = [
  '#e7f8ff',
  '#c5eeff',
  '#97e2ff',
  '#68d5ff',
  '#36c4f5',
  '#14aedf',
  '#008bb8',
  '#006f94',
  '#075a77',
  '#0b4b62',
];

export const platformTheme = createTheme({
  autoContrast: true,
  primaryColor: 'platformSignal',
  primaryShade: 3,
  colors: {
    platformSignal,
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
    Tooltip: {
      styles: {
        tooltip: {
          '--tooltip-bg': 'var(--surface-overlay)',
          '--tooltip-color': 'var(--text-default)',
          fontSize: 'var(--text-sm)',
          padding: '6px 8px',
          boxShadow: 'var(--shadow-float)',
        },
      },
    },
  },
});
