import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const lightTheme = {
  dark: false,
  colors: {
    primary: '#673AB7',
    'primary-lighten-1': '#9575CD',
    'primary-darken-1': '#512DA8',
    secondary: '#FFC107',
    accent: '#FFC107',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
    success: '#4CAF50',
    background: '#fafafa',
    surface: '#ffffff',
  },
};

const darkTheme = {
  dark: true,
  colors: {
    primary: '#9575CD',
    'primary-lighten-1': '#B39DDB',
    'primary-darken-1': '#673AB7',
    secondary: '#FFC107',
    accent: '#FFC107',
    error: '#EF5350',
    warning: '#FFA726',
    info: '#42A5F5',
    success: '#66BB6A',
    background: '#303030',
    surface: '#424242',
  },
};

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
  },
  defaults: {
    VBtn: {
      variant: 'flat',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    },
  },
});
