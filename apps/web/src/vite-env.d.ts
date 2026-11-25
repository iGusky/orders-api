/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Inyectadas por `define` en vite.config.mts.
declare const __APP_VERSION__: string;
declare const __APP_BUILD__: string;
declare const __APP_COMMIT__: string;
declare const __APP_BUILT_AT__: string;
