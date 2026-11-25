/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Versión del build que se muestra en la app (ver "Versiones" en docs/despliegue.md).
// - APP_VERSION: la calcula CI desde los commits (scripts/next-version.sh). En local, el último tag web-v* o, sin
//   tags, la de apps/web/package.json.
// - APP_BUILD: número de corrida de GitHub Actions; en local, "dev".
// - APP_COMMIT: commit corto; CI lo pasa como build-arg porque .git no entra al contexto de Docker.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

function git(command: string): string | undefined {
  try {
    return execSync(`git ${command}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || undefined;
  } catch {
    return undefined;
  }
}

const appVersion =
  process.env.APP_VERSION || git("describe --tags --abbrev=0 --match 'web-v*'")?.replace(/^web-v/, '') || pkg.version;
const appBuild = process.env.APP_BUILD || 'dev';
const appCommit = (process.env.APP_COMMIT || git('rev-parse --short HEAD') || 'local').slice(0, 7);

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  server:{
    port: 4200,
    host: 'localhost',
    // Para `pnpm dev:lan`: el iPad no ve el localhost de esta máquina, así que la app llama a /api
    // y Vite reenvía la petición a la API local.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    headers: {
      'Reporting-Endpoints': 'local-endpoint="/csp-report"',
      // Orígenes de Google Identity Services (botón "Iniciar sesión con Google" en /iniciar-sesion).
      'Content-Security-Policy-Report-Only':
        'script-src https://accounts.google.com/gsi/client; frame-src https://accounts.google.com/gsi/; connect-src https://accounts.google.com/gsi/',
      // Encabezado propio, no una directiva de la CSP. Permite que la ventana emergente de Google le responda a la página.
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  preview:{
    port: 4300,
    host: 'localhost',
  },
  plugins: [react(), nxReadySignal(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_BUILD__: JSON.stringify(appBuild),
    __APP_COMMIT__: JSON.stringify(appCommit),
    __APP_BUILT_AT__: JSON.stringify(new Date().toISOString()),
  },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
