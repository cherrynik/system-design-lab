import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { Exercise, ValidationResult } from '@/entities/exercise';
import {
  ARCHITECTURE_AUTOSAVE_STORAGE_KEY,
  ARCHITECTURE_LEGACY_CANVAS_STORAGE_KEY,
  ARCHITECTURE_STORAGE_MIGRATION_KEY,
  ARCHITECTURE_VERSIONS_STORAGE_KEY,
} from '@/shared/config';
import { SystemDesignLabPage } from './SystemDesignLabPage';

const exerciseFixture = {
  id: 'connect-client-to-service',
  title: 'Connect a client to a service',
  description:
    'Build a directed request path from a client to a service. Intermediate load balancers are allowed.',
  requirement: {
    id: 'client-reaches-service',
    title: 'Client can reach a service',
    description: 'At least one directed path must exist from a client node to a service node.',
  },
} satisfies Exercise;

const validationFixture = {
  results: [
    {
      requirementId: exerciseFixture.requirement.id,
      status: 'passed',
      message: 'A directed request path reaches the service.',
    },
  ] satisfies ValidationResult[],
};

const architectureStorageKeys = [
  ARCHITECTURE_AUTOSAVE_STORAGE_KEY,
  ARCHITECTURE_LEGACY_CANVAS_STORAGE_KEY,
  ARCHITECTURE_STORAGE_MIGRATION_KEY,
  ARCHITECTURE_VERSIONS_STORAGE_KEY,
];

function jsonResponse(value: unknown) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requestUrl(input: RequestInfo | URL) {
  if (input instanceof Request) return new URL(input.url);
  if (input instanceof URL) return input;
  return new URL(input, window.location.origin);
}

const storyFetch: typeof fetch = async (input, init) => {
  const url = requestUrl(input);
  const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

  if (url.pathname === '/api/exercise' && method === 'GET') {
    return jsonResponse(exerciseFixture);
  }

  if (url.pathname === '/api/evaluate' && method === 'POST') {
    return jsonResponse(validationFixture);
  }

  return new Response(null, { status: 404 });
};

const meta = {
  title: 'Screens/System design lab',
  component: SystemDesignLabPage,
  parameters: { layout: 'fullscreen' },
  beforeEach: () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fn(storyFetch);
    architectureStorageKeys.forEach((key) => window.localStorage.removeItem(key));

    return () => {
      globalThis.fetch = originalFetch;
      architectureStorageKeys.forEach((key) => window.localStorage.removeItem(key));
    };
  },
} satisfies Meta<typeof SystemDesignLabPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Workspace: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Load the technical workspace', async () => {
      await expect(
        await canvas.findByRole('heading', { name: 'Route web traffic to an HTTP API' }),
      ).toBeVisible();
      await expect(canvas.getByRole('button', { name: /Validate/ })).toBeEnabled();
    });

    await step('Open and switch reference solutions', async () => {
      await userEvent.click(canvas.getByRole('tab', { name: 'Solutions' }));
      await userEvent.click(canvas.getByRole('button', { name: /Load Balancer Path/ }));
      await expect(
        await canvas.findByRole('heading', { name: 'Load Balancer Path' }),
      ).toBeVisible();
    });

    await step('Validate the selected solution', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Validate/ }));
      await expect(await canvas.findByText('✓ Client can reach a service')).toBeVisible();
      await expect(await canvas.findByText(/PASS\s+1 passed · 0 warnings/)).toBeVisible();
    });

    await step('Return to the editable canvas', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'My Canvas' }));
      await expect(
        await canvas.findByRole('heading', { name: 'Route web traffic to an HTTP API' }),
      ).toBeVisible();
    });
  },
};
