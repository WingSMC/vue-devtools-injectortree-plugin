import { createApp } from 'vue'
import App from './App.vue'
import { registerInjectorTreePlugin } from 'vue-devtools-injectortree'

const app = createApp(App)
registerInjectorTreePlugin(app)
app.mount('#app')
