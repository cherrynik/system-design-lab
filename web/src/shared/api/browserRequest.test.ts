import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrowserResponse } from './api.types';

class TestWorker {
  static instances: TestWorker[] = [];
  onmessage: ((event: { data: BrowserResponse }) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    TestWorker.instances.push(this);
  }
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  TestWorker.instances = [];
});

async function setup() {
  vi.resetModules();
  vi.stubGlobal('Worker', TestWorker);
  return import('./browserRequest');
}

describe('browser API transport', () => {
  it('matches concurrent responses by id and preserves API error status', async () => {
    const { browserRequest } = await setup();
    const first = browserRequest('/api/exercise');
    const second = browserRequest('/api/evaluate', { method: 'POST', body: '{}' });
    const worker = TestWorker.instances[0];
    worker.onmessage!({ data: { id: 2, status: 400, body: '{"error":"invalid"}' } });
    worker.onmessage!({ data: { id: 1, status: 200, body: '{"id":"exercise"}' } });
    expect((await second).status).toBe(400);
    expect(await (await first).json()).toEqual({ id: 'exercise' });
    expect(TestWorker.instances).toHaveLength(1);
  });

  it('rejects all waiting requests on failure and starts a fresh worker on retry', async () => {
    const { browserRequest } = await setup();
    const first = browserRequest('/api/exercise');
    const second = browserRequest('/api/evaluate');
    const assertions = [
      expect(first).rejects.toThrow('could not be loaded'),
      expect(second).rejects.toThrow('could not be loaded'),
    ];
    TestWorker.instances[0].onerror!();
    await Promise.all(assertions);
    expect(TestWorker.instances[0].terminate).toHaveBeenCalled();
    const retry = browserRequest('/api/exercise');
    TestWorker.instances[1].onmessage!({ data: { id: 3, status: 200, body: '{}' } });
    expect((await retry).ok).toBe(true);
  });

  it('times out a stalled engine and releases the worker', async () => {
    vi.useFakeTimers();
    const { browserRequest } = await setup();
    const request = browserRequest('/api/exercise');
    const assertion = expect(request).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(60_000);
    await assertion;
    expect(TestWorker.instances[0].terminate).toHaveBeenCalled();
  });
});
