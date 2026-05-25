import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Library build config
export default defineConfig({
  plugins: [
    dts({ include: ['src'], rollupTypes: true }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueInjectorTree',
      formats: ['es', 'cjs'],
      fileName: format =>
        `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['vue', '@vue/devtools-api'],
      output: {
        globals: {
          vue: 'Vue',
          '@vue/devtools-api': 'VueDevtoolsApi',
        },
      },
    },
  },
});
