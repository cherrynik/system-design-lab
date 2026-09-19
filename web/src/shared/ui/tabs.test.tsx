// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

afterEach(cleanup);

describe('Tabs', () => {
  it('moves focus and selection with arrow keys', async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="layers">
        <TabsList aria-label="Component views">
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
        </TabsList>
        <TabsContent value="layers">Layer list</TabsContent>
        <TabsContent value="graph">Dependency graph</TabsContent>
      </Tabs>,
    );

    const layers = screen.getByRole('tab', { name: 'Layers' });
    const graph = screen.getByRole('tab', { name: 'Graph' });

    expect(layers.getAttribute('aria-selected')).toBe('true');
    layers.focus();
    await user.keyboard('{ArrowRight}');

    await waitFor(() => expect(document.activeElement).toBe(graph));
    expect(graph.getAttribute('aria-selected')).toBe('false');

    await user.keyboard('{Enter}');
    await waitFor(() => expect(graph.getAttribute('aria-selected')).toBe('true'));
    expect(screen.getByRole('tabpanel').textContent).toBe('Dependency graph');
  });
});
