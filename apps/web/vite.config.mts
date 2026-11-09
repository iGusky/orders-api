/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';
import tailwindcss from '@tailwindcss/vite'

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
