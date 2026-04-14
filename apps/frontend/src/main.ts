import { createApp } from 'vue';
import App from './App.vue';
import { registerPlugins } from './plugins';
import { loadRuntimeConfig } from './services/runtime-config.service';
import { httpService } from './services/http.service';

// Directives
import { onlyNumber } from './directives/only-number';
import { ctrlClick } from './directives/ctrl-click';
import { clickOutside } from './directives/click-outside';

// Global components
import AppSelect from './components/core/AppSelect.vue';
import AppModal from './components/core/AppModal.vue';
import AppConfirm from './components/core/AppConfirm.vue';
import AppInput from './components/core/AppInput.vue';
import AppCheckbox from './components/core/AppCheckbox.vue';

loadRuntimeConfig().then(() => {
  httpService.init();
  const app = createApp(App);

  registerPlugins(app);

  // Register global directives
  app.directive('only-number', onlyNumber);
  app.directive('ctrl-click', ctrlClick);
  app.directive('click-outside', clickOutside);

  // Register global components
  app.component('AppSelect', AppSelect);
  app.component('AppModal', AppModal);
  app.component('AppConfirm', AppConfirm);
  app.component('AppInput', AppInput);
  app.component('AppCheckbox', AppCheckbox);

  app.mount('#app');
});
