import { create } from 'storybook/theming/create';

export const platformStorybookTheme = create({
  base: 'dark',
  brandTitle: 'System Design Lab',
  brandTarget: '_self',
  colorPrimary: '#68d5ff',
  colorSecondary: '#72dfb2',
  appBg: '#08111f',
  appContentBg: '#0d1828',
  appBorderColor: '#20334d',
  appBorderRadius: 6,
  fontBase: "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
  fontCode: "'JetBrains Mono Variable', 'SFMono-Regular', 'Cascadia Code', monospace",
  textColor: '#edf4fc',
  textMutedColor: '#8191a8',
  barTextColor: '#a1b0c4',
  barSelectedColor: '#68d5ff',
  barHoverColor: '#edf4fc',
  inputBg: '#101d30',
  inputBorder: '#36516f',
  inputTextColor: '#edf4fc',
  inputBorderRadius: 5,
});
