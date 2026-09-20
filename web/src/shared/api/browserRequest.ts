import type { ApiRequestOptions, BrowserResponse, PendingRequest } from './api.types';

let worker: Worker | undefined;
let sequence = 0;
const pending = new Map<number, PendingRequest>();

function reset(error: Error) {
  worker?.terminate();
  worker = undefined;
  for (const request of pending.values()) {
    clearTimeout(request.timeout);
    request.reject(error);
  }
  pending.clear();
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./browser-api.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }: MessageEvent<BrowserResponse>) => {
    const request = pending.get(data.id);
    if (!request) return;
    clearTimeout(request.timeout);
    pending.delete(data.id);
    if (data.error) {
      request.reject(new Error(data.error));
      return;
    }
    request.resolve(
      new Response(data.body, {
        status: data.status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  };
  worker.onerror = () => reset(new Error('The browser validation engine could not be loaded.'));
  return worker;
}

export function browserRequest(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const runtime = getWorker();
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reset(new Error('The browser validation engine timed out.')),
      60_000,
    );
    pending.set(id, { resolve, reject, timeout });
    runtime.postMessage({ id, path, method: options.method ?? 'GET', body: options.body ?? '' });
  });
}
