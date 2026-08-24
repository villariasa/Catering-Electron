import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import electron from 'vite-plugin-electron/simple';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [
    svelte({
      compilerOptions: {
        warningFilter: (warning) => !warning.code.startsWith('a11y'),
      },
    }),
    electron({
      main: {
        entry: path.resolve(__dirname, 'src/main/index.ts'),
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron/main'),
            rollupOptions: {
              external: ['electron', 'sqlite3'],
            },
          },
        },
      },
      preload: {
        input: path.resolve(__dirname, 'src/preload/index.ts'),
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron/preload'),
          },
        },
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '$lib': path.resolve(__dirname, './src/renderer/src/lib'),
      '$components': path.resolve(__dirname, './src/renderer/src/lib/components'),
      '$pages': path.resolve(__dirname, './src/renderer/src/lib/pages'),
    },
  },
  root: 'src/renderer',
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
