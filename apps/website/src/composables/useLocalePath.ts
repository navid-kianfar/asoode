import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

export function useLocalePath() {
  const { locale } = useI18n()

  return (path: string): string => {
    if (locale.value === 'en') return path
    const clean = path.startsWith('/') ? path : `/${path}`
    return `/${locale.value}${clean === '/' ? '' : clean}`
  }
}

export function useSwitchLocalePath() {
  const route = useRoute()

  return (targetLocale: string): string => {
    const currentPath = route.path
    const stripped = currentPath.replace(/^\/(fa|ar|tr)(\/|$)/, '/$2').replace(/\/\/$/, '/')
    const normalizedPath = stripped === '' ? '/' : stripped

    if (targetLocale === 'en') return normalizedPath
    return `/${targetLocale}${normalizedPath === '/' ? '' : normalizedPath}`
  }
}
