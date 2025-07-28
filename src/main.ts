import './assets/main.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import App from './App.vue';
import router from './router';
import appState from './plugins/appState';
import DialogService from 'primevue/dialogservice';
import ToastService from 'primevue/toastservice';

import { VueQueryPlugin } from '@tanstack/vue-query';

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '',
      cssLayer: false,
    },
  },
});
app.use(appState);
app.use(createPinia());
app.use(router);

app.use(ToastService);
app.use(DialogService);
app.use(VueQueryPlugin);

app.mount('#app');
