import '@fontsource-variable/geist';
import '@fontsource-variable/jetbrains-mono';

import { addons } from 'storybook/manager-api';
import { platformStorybookTheme } from './storybook-theme';

addons.setConfig({ theme: platformStorybookTheme });
