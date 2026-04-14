import type { App } from 'vue';
import vuetify from './vuetify';
import i18n from './i18n';
import { createPinia } from 'pinia';
import router from '../router';

export function registerPlugins(app: App) {
  app.use(createPinia());
  app.use(router);
  app.use(i18n);
  app.use(vuetify);
}
