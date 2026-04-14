import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import fa from '@/locales/fa.json'
import ar from '@/locales/ar.json'
import tr from '@/locales/tr.json'

export const LOCALES = [
  { code: 'en', name: 'English', dir: 'ltr' as const },
  { code: 'fa', name: 'فارسی', dir: 'rtl' as const },
  { code: 'ar', name: 'العربية', dir: 'rtl' as const },
  { code: 'tr', name: 'Türkçe', dir: 'ltr' as const },
] as const

export type LocaleCode = (typeof LOCALES)[number]['code']

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, fa, ar, tr },
})

export default i18n
