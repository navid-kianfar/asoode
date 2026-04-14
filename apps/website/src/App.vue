<template>
  <v-app>
    <SiteHeader />
    <v-main>
      <router-view />
    </v-main>
    <SiteFooter />
  </v-app>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { useAppTheme } from '@/composables/useAppTheme'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import { LOCALES } from '@/i18n'

const { theme } = useAppTheme()
const vuetifyTheme = useTheme()
const { locale } = useI18n()

// Sync Vuetify theme + data-theme attribute
watch(
  theme,
  (val) => {
    vuetifyTheme.global.name.value = val
    document.documentElement.setAttribute('data-theme', val)
    document.documentElement.style.colorScheme = val === 'dark' ? 'dark' : 'light'
  },
  { immediate: true },
)

// Sync HTML dir + lang for RTL support
watch(
  locale,
  (val) => {
    const loc = LOCALES.find((l) => l.code === val)
    const dir = loc?.dir || 'ltr'
    document.documentElement.dir = dir
    document.documentElement.lang = val
  },
  { immediate: true },
)
</script>
