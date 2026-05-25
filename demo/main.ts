import { createApp } from 'vue';
import { registerInjectorTreePlugin } from '../lib/injector-tree-plugin';
import App from './App.vue';

const app = createApp(App);

app.provide('appName', 'Injector Tree Demo');
app.provide(
  'apiBaseUrl',
  'https://api.example.test',
);

registerInjectorTreePlugin(app);
app.mount('#app');
