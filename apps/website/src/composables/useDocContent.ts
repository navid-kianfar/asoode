import { ref } from 'vue'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

const markdownFiles = import.meta.glob('@/content/**/*.md', {
  query: '?raw',
  import: 'default',
})

export function useDocContent() {
  const html = ref('')
  const loading = ref(true)
  const error = ref(false)

  async function load(slug: string) {
    loading.value = true
    error.value = false

    const key = `/src/content/docs/${slug}.md`

    const loader = markdownFiles[key]
    if (!loader) {
      error.value = true
      loading.value = false
      return
    }

    try {
      const raw = (await loader()) as string
      html.value = md.render(raw)
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  return { html, loading, error, load }
}
