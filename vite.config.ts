import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

// Dev server config — serves the demo app
export default defineConfig({
  plugins: [vueDevTools(), vue()],
  resolve: {
    alias: {
      'vue-devtools-injectortree': resolve(
        __dirname,
        'dist/index.mjs',
      ),
    },
  },
});
