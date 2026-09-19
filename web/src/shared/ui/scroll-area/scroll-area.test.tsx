// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithPlatform } from '@/shared/testing/renderWithPlatform';
import { ScrollArea } from './ScrollArea';

afterEach(cleanup);

describe('ScrollArea', () => {
  it('makes its scrollable viewport keyboard accessible', () => {
    const { container } = renderWithPlatform(
      <ScrollArea h={120}>
        <span>Scrollable content</span>
      </ScrollArea>,
    );

    expect(container.querySelector('[data-scrollarea-viewport]')?.getAttribute('tabindex')).toBe(
      '0',
    );
  });

  it('keeps autosize content and viewport focusability behind the shared facade', () => {
    const { container } = renderWithPlatform(
      <ScrollArea autosize mah={120}>
        <span>Autosize content</span>
      </ScrollArea>,
    );

    expect(screen.getByText('Autosize content')).toBeTruthy();
    expect(container.querySelector('[data-slot="scroll-area"]')).toBeTruthy();
    expect(container.querySelector('[data-scrollarea-viewport]')?.getAttribute('tabindex')).toBe(
      '0',
    );
  });
});
