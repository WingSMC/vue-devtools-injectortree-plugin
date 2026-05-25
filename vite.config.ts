import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Dev server config — serves the demo app
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'vue-devtools-injectortree': resolve(
        __dirname,
        'src/index.ts',
      ),
    },
  },
});
