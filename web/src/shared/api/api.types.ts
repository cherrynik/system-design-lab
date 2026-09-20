export type ApiRequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export type BrowserRequest = {
  id: number;
  path: string;
  method: string;
  body: string;
};

export type BrowserResponse = {
  id: number;
  status?: number;
  body?: string;
  error?: string;
};

export type GoRuntime = {
  importObject: WebAssembly.Imports;
  run(instance: WebAssembly.Instance): Promise<void>;
};

export type BrowserRuntime = typeof globalThis & {
  Go: new () => GoRuntime;
  systemDesignRequest(
    method: string,
    path: string,
    body: string,
  ): {
    status: number;
    body: string;
  };
};

export type PendingRequest = {
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};
