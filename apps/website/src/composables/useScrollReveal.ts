import { ref, onMounted, onUnmounted } from 'vue'

export function useScrollReveal(options: { immediate?: boolean; threshold?: number } = {}) {
  const { immediate = false, threshold = 0.12 } = options
  const el = ref<HTMLElement>()
  const visible = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (immediate) {
      visible.value = true
      return
    }
    if (!el.value) return
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          visible.value = true
          observer?.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(el.value)
  })

  onUnmounted(() => observer?.disconnect())

  return { el, visible }
}
