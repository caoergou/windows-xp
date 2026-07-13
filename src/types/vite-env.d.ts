/// <reference types="vite/client" />

/** Injected by vite `define` from package.json — the real installable version. */
declare const __SITE_VERSION__: string;

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
