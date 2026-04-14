import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

export function createAppVuetify(defaultTheme: 'light' | 'dark' = 'light') {
  return createVuetify({
    components,
    directives,
    theme: {
      defaultTheme,
      themes: {
        light: {
          dark: false,
          colors: {
            primary: '#6b3d8d',
            'primary-lighten-1': '#9575CD',
            'primary-darken-1': '#512DA8',
            secondary: '#3F51B5',
            accent: '#FFC107',
            background: '#ffffff',
            surface: '#ffffff',
            'surface-variant': '#f7f5fb',
            'on-primary': '#ffffff',
            'on-secondary': '#ffffff',
            'on-background': '#1a1a2e',
            'on-surface': '#1a1a2e',
          },
        },
        dark: {
          dark: true,
          colors: {
            primary: '#59a8ef',
            'primary-lighten-1': '#7dbdf5',
            'primary-darken-1': '#3d8fd6',
            secondary: '#7986CB',
            accent: '#FFD54F',
            background: '#0f0d1a',
            surface: '#1a1726',
            'surface-variant': '#141020',
            'on-primary': '#ffffff',
            'on-secondary': '#ffffff',
            'on-background': '#e8e6f0',
            'on-surface': '#e8e6f0',
          },
        },
      },
    },
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: { mdi },
    },
    defaults: {
      VBtn: {
        rounded: 'lg',
      },
    },
  })
}
