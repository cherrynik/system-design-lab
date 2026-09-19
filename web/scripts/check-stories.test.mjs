import { describe, expect, it } from 'vitest';
import { storyCoversComponentSource } from './check-stories.mjs';

describe('Storybook component coverage', () => {
  it('accepts a component configured as the primary story subject', () => {
    expect(
      storyCoversComponentSource(
        `const meta = { component: Button } satisfies Meta<typeof Button>;`,
        'Button',
      ),
    ).toBe(true);
  });

  it('accepts a component rendered by a composition story', () => {
    expect(
      storyCoversComponentSource(
        `export const Example = { render: () => <IconButton /> };`,
        'IconButton',
      ),
    ).toBe(true);
  });

  it('rejects imports and subcomponent metadata without a rendered story', () => {
    const source = `
      import { IconButton } from './IconButton';
      const meta = { component: Button, subcomponents: { IconButton } };
    `;

    expect(storyCoversComponentSource(source, 'IconButton')).toBe(false);
  });
});
