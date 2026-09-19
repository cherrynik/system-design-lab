import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { PlatformProvider } from '@/shared/config';

export function renderWithPlatform(ui: ReactElement, options?: RenderOptions) {
  return render(<PlatformProvider>{ui}</PlatformProvider>, options);
}
