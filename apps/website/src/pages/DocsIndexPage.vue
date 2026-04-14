<template>
  <div class="docs-page" :class="{ dark: isDark }">
    <div class="site-container">
      <div class="docs-layout">
        <!-- Sidebar -->
        <aside class="docs-sidebar">
          <SiteNavigation />
        </aside>

        <!-- Main Content -->
        <div class="docs-main">
          <div class="docs-hero">
            <div class="accent-line"></div>
            <h1>{{ $t('docs.title') }}</h1>
            <p>{{ $t('docs.subtitle') }}</p>
          </div>

          <div class="docs-grid">
            <router-link
              v-for="(section, i) in sections"
              :key="section.titleKey"
              :to="localePath(section.to)"
              class="doc-card"
            >
              <div class="doc-icon" :style="{ background: section.gradient }">
                <v-icon size="22" color="white">{{ section.icon }}</v-icon>
              </div>
              <h3>{{ $t(section.titleKey) }}</h3>
              <p>{{ $t(section.descKey) }}</p>
              <span class="doc-link">
                {{ $t('docs.read_more') }}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppTheme } from '@/composables/useAppTheme'
import { useLocalePath } from '@/composables/useLocalePath'
import SiteNavigation from '@/components/layout/SiteNavigation.vue'

const { t } = useI18n()
const { isDark } = useAppTheme()
const localePath = useLocalePath()

onMounted(() => {
  document.title = `${t('docs.title')} — Asoode`
})

const sections = [
  { titleKey: 'docs.s1_title', descKey: 'docs.s1_desc', to: '/docs/getting-started', icon: 'mdi-rocket-launch-outline', gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)' },
  { titleKey: 'docs.s2_title', descKey: 'docs.s2_desc', to: '/docs/architecture', icon: 'mdi-sitemap-outline', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
  { titleKey: 'docs.s3_title', descKey: 'docs.s3_desc', to: '/docs/api-reference', icon: 'mdi-code-braces', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  { titleKey: 'docs.s4_title', descKey: 'docs.s4_desc', to: '/docs/features/projects', icon: 'mdi-puzzle-outline', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { titleKey: 'docs.s5_title', descKey: 'docs.s5_desc', to: '/docs/guides/kanban-boards', icon: 'mdi-book-open-page-variant-outline', gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
]
</script>

<style scoped lang="scss">
.docs-page {
  --page-bg: #f8f7fc;
  --card-bg: #ffffff;
  --card-border: rgba(0,0,0,0.04);
  --text-primary: #1a1a2e;
  --text-secondary: #5a576e;
  --text-muted: #9e9bb0;
  --sidebar-bg: #ffffff;
  --sidebar-border: rgba(0,0,0,0.06);
  --accent: #7c3aed;
  --link-color: #7c3aed;

  &.dark {
    --page-bg: #0f0d1a;
    --card-bg: #161228;
    --card-border: rgba(255,255,255,0.05);
    --text-primary: #e8e6f0;
    --text-secondary: #9e9bb0;
    --text-muted: #706d82;
    --sidebar-bg: #131020;
    --sidebar-border: rgba(255,255,255,0.05);
    --accent: #a78bfa;
    --link-color: #a78bfa;
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

.docs-hero {
  margin-bottom: 40px;

  h1 {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin: 0 0 12px;
  }

  p {
    font-size: 1rem;
    color: var(--text-secondary);
    line-height: 1.7;
    max-width: 560px;
    margin: 0;
  }
}

.accent-line {
  width: 48px;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--accent), #a78bfa);
  margin-bottom: 20px;
}

.docs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.doc-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 28px 24px;
  border: 1px solid var(--card-border);
  text-decoration: none;
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s cubic-bezier(0.22,1,0.36,1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.08);

    .doc-link svg { transform: translateX(4px); }
  }

  h3 {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 14px 0 6px;
  }

  p {
    font-size: 0.87rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0 0 14px;
  }
}

.dark .doc-card:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.3); }

.doc-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doc-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--link-color);

  svg { transition: transform 0.3s cubic-bezier(0.22,1,0.36,1); }
}

@media (max-width: 960px) {
  .docs-layout { grid-template-columns: 1fr; }
  .docs-sidebar { position: static; }
}

@media (max-width: 600px) {
  .docs-grid { grid-template-columns: 1fr; }
  .docs-page { padding-top: 80px; }
}
</style>
