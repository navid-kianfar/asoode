<template>
  <div class="docs-page" :class="{ dark: isDark }">
    <div class="site-container">
      <div class="docs-layout">
        <aside class="docs-sidebar">
          <SiteNavigation />
        </aside>
        <div class="docs-main">
          <div v-if="loading" class="docs-loading">Loading...</div>
          <div v-else-if="error" class="docs-error">Document not found.</div>
          <div v-else v-html="html"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppTheme } from '@/composables/useAppTheme'
import { useDocContent } from '@/composables/useDocContent'
import SiteNavigation from '@/components/layout/SiteNavigation.vue'

const route = useRoute()
const { isDark } = useAppTheme()
const { html, loading, error, load } = useDocContent()

watch(
  () => route.params.slug,
  (slug) => {
    const slugStr = Array.isArray(slug) ? slug.join('/') : slug || 'getting-started'
    load(slugStr)
    document.title = `Asoode Docs — ${slugStr}`
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.docs-page {
  --page-bg: #f8f7fc;
  --text-primary: #1a1a2e;
  --text-secondary: #5a576e;
  --sidebar-bg: #ffffff;
  --sidebar-border: rgba(0,0,0,0.06);

  &.dark {
    --page-bg: #0f0d1a;
    --text-primary: #e8e6f0;
    --text-secondary: #9e9bb0;
    --sidebar-bg: #131020;
    --sidebar-border: rgba(255,255,255,0.05);
  }

  background: var(--page-bg);
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 80px;
}

.docs-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 40px;
  align-items: start;
}

.docs-sidebar {
  position: sticky;
  top: 100px;
  background: var(--sidebar-bg);
  border-radius: 16px;
  border: 1px solid var(--sidebar-border);
  padding: 20px 16px;
}

.docs-main {
  color: var(--text-primary);

  :deep(h1) { font-size: 2rem; font-weight: 800; margin: 0 0 16px; }
  :deep(h2) { font-size: 1.4rem; font-weight: 700; margin: 32px 0 12px; }
  :deep(h3) { font-size: 1.15rem; font-weight: 600; margin: 24px 0 8px; }
  :deep(p) { color: var(--text-secondary); line-height: 1.8; margin: 0 0 16px; }
  :deep(ul), :deep(ol) { color: var(--text-secondary); padding-left: 20px; margin: 0 0 16px; }
  :deep(li) { line-height: 1.7; margin-bottom: 4px; }
  :deep(code) { font-size: 0.88em; padding: 2px 6px; border-radius: 4px; background: rgba(124, 58, 237, 0.08); }
  :deep(pre) { border-radius: 12px; padding: 16px; margin: 0 0 16px; overflow-x: auto; }
}

@media (max-width: 960px) {
  .docs-layout { grid-template-columns: 1fr; }
  .docs-sidebar { position: static; }
}

@media (max-width: 600px) {
  .docs-page { padding-top: 80px; }
}
</style>
