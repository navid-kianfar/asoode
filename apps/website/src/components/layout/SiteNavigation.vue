<template>
  <nav class="docs-nav">
    <div v-for="section in sections" :key="section.title" class="nav-section">
      <h4>{{ section.title }}</h4>
      <ul>
        <li v-for="item in section.items" :key="item.to">
          <router-link :to="localePath(item.to)" class="nav-item">{{ item.label }}</router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useLocalePath } from '@/composables/useLocalePath'

const localePath = useLocalePath()

const sections = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Quick Start Guide', to: '/docs/getting-started' },
      { label: 'Architecture', to: '/docs/architecture' },
      { label: 'API Reference', to: '/docs/api-reference' },
    ],
  },
  {
    title: 'Features',
    items: [
      { label: 'Projects', to: '/docs/features/projects' },
      { label: 'Work Packages', to: '/docs/features/work-packages' },
      { label: 'Tasks', to: '/docs/features/tasks' },
      { label: 'Groups', to: '/docs/features/groups' },
      { label: 'Messenger', to: '/docs/features/messenger' },
      { label: 'Files', to: '/docs/features/files' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'Kanban Boards', to: '/docs/guides/kanban-boards' },
      { label: 'Time Tracking', to: '/docs/guides/time-tracking' },
      { label: 'Access Control', to: '/docs/guides/access-control' },
    ],
  },
]
</script>

<style scoped lang="scss">
.docs-nav {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.nav-section {
  h4 {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted, #9e9bb0);
    padding: 0 8px;
    margin: 0 0 8px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
}

.nav-item {
  display: block;
  padding: 7px 12px;
  font-size: 0.87rem;
  color: var(--text-secondary, #5a576e);
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(124, 58, 237, 0.06);
    color: var(--accent, #7c3aed);
  }

  &.router-link-active {
    background: rgba(124, 58, 237, 0.08);
    color: var(--accent, #7c3aed);
    font-weight: 600;
  }
}
</style>
