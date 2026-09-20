import type { BrowserRequest, BrowserRuntime } from './api.types';

const runtime = globalThis as BrowserRuntime;

async function loadRuntime() {
  const assetRoot = new URL(`${import.meta.env.BASE_URL}runtime/`, runtime.location.origin);
  const scriptUrl = new URL('wasm_exec.js', assetRoot).href;
  await import(/* @vite-ignore */ scriptUrl);
  const go = new runtime.Go();
  const response = await fetch(new URL('api.wasm', assetRoot));
  if (!response.ok) throw new Error('The browser validation engine could not be downloaded.');
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), go.importObject);
  // Go installs the synchronous request bridge before its first await.
  void go.run(instance);
}

let ready: Promise<void> | undefined;
runtime.onmessage = async ({ data }: MessageEvent<BrowserRequest>) => {
  try {
    ready ??= loadRuntime();
    await ready;
    const result = runtime.systemDesignRequest(data.method, data.path, data.body);
    runtime.postMessage({ id: data.id, ...result });
  } catch (error) {
    ready = undefined;
    runtime.postMessage({ id: data.id, error: String(error) });
  }
};
