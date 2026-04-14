import { ref, computed } from 'vue'

type Theme = 'light' | 'dark'

const theme = ref<Theme>(
  (localStorage.getItem('asoode-theme') as Theme) || 'light',
)

export function useAppTheme() {
  const isDark = computed(() => theme.value === 'dark')

  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('asoode-theme', theme.value)
  }

  return { theme, isDark, toggle }
}
