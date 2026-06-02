/// <reference types="vite/client" />

interface ImportMeta {
  glob: <T = { [key: string]: () => Promise<unknown> }>(
    pattern: string,
    options?: {
      eager?: boolean;
      as?: 'raw' | 'url' | 'default';
      query?: Record<string, string>;
    }
  ) => T;
}
