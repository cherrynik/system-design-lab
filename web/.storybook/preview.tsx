import '../src/app/styles/global.css';

import type { Preview } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import { PlatformProvider } from '../src/shared/config';
import { platformStorybookTheme } from './storybook-theme';

function getStorySurfaceStyle(layout: unknown) {
  const style = {
    display: 'grid',
    width: '100%',
    minHeight: '100vh',
    placeItems: 'center',
    padding: 32,
    background: 'var(--surface-canvas)',
    color: 'var(--text-default)',
  };

  if (layout === 'fullscreen') {
    style.placeItems = 'stretch';
    style.padding = 0;
  }

  return style;
}

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        dark: 'dark',
      },
      defaultTheme: 'dark',
    }),
    (Story, context) => (
      <PlatformProvider colorScheme="dark">
        <div style={getStorySurfaceStyle(context.parameters.layout)}>
          <Story />
        </div>
      </PlatformProvider>
    ),
  ],
  parameters: {
    docs: {
      theme: platformStorybookTheme,
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true,
    },
    layout: 'fullscreen',
    options: {
      storySort: {
        order: ['Design system', 'Primitives', 'Composition'],
      },
    },
    a11y: {
      test: 'error',
    },
  },
  tags: ['autodocs'],
};

export default preview;
