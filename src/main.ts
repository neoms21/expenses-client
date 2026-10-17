import "./assets/main.css";
import { createApp } from "vue";
import { createPinia } from "pinia";

import Aura from "@primeuix/themes/aura";
import PrimeVue from "primevue/config";
import App from "./App.vue";
import router from "./router";
import appState from "./plugins/appState";
import DialogService from "primevue/dialogservice";
import ToastService from "primevue/toastservice";

import { VueQueryPlugin } from "@tanstack/vue-query";

// Auto-sync dark mode class based on system theme preference
if (typeof window !== "undefined" && window.matchMedia) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const updateTheme = (matches: boolean) => {
    if (matches) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };
  updateTheme(mediaQuery.matches);
  mediaQuery.addEventListener("change", (e) => updateTheme(e.matches));
}

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: "p",
      darkModeSelector: "system",
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

app.mount("#app");
