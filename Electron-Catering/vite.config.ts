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
              // sqlite3 loads a native .node binary via an internal require() call —
              // it must stay external (unbundled) so that require() still exists at runtime,
              // instead of being inlined into Vite's ES-module output for the main process.
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
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: 'index.cjs',
              },
            },
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
