// Versión del build desplegado, inyectada por Vite al compilar (ver vite.config.mts y docs/despliegue.md).
export const appVersion = {
  version: __APP_VERSION__,
  build: __APP_BUILD__,
  commit: __APP_COMMIT__,
  builtAt: __APP_BUILT_AT__,
};

// "v1.2.0": lo que se muestra en el pie de página.
export function formatAppVersion(): string {
  return `v${appVersion.version}`;
}
