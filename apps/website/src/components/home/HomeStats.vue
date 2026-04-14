<template>
  <section class="stats-section" ref="el">
    <div class="stats-bg"><div class="stats-mesh" /></div>
    <div class="site-container">
      <h2 class="stats-title anim" :class="{ show: visible }">{{ $t('stats.title') }}</h2>
      <div class="stats-grid">
        <div
          v-for="(stat, i) in stats"
          :key="stat.key"
          class="stat-item anim"
          :class="{ show: visible }"
          :style="{ transitionDelay: `${0.08 + i * 0.1}s` }"
        >
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ $t(stat.labelKey) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useScrollReveal } from '@/composables/useScrollReveal'

const { el, visible } = useScrollReveal()

const stats = [
  { value: '10,000+', labelKey: 'stats.users', key: 'u' },
  { value: '50,000+', labelKey: 'stats.projects', key: 'p' },
  { value: '1M+', labelKey: 'stats.tasks', key: 't' },
  { value: '99.9%', labelKey: 'stats.uptime', key: 'up' },
]
</script>

<style scoped lang="scss">
.anim {
  opacity: 0; transform: translateY(28px);
  transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
  &.show { opacity: 1; transform: translateY(0); }
}
.stats-section { position: relative; padding: 72px 0; overflow: hidden; background: #0a0818; }
.stats-bg { position: absolute; inset: 0; }
.stats-mesh {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 50% 50% at 30% 50%, rgba(124, 58, 237, 0.2), transparent),
    radial-gradient(ellipse 50% 50% at 70% 50%, rgba(59, 130, 246, 0.15), transparent);
}
.stats-title {
  text-align: center; font-size: 1.6rem; font-weight: 800;
  color: #fff; margin: 0 0 40px; position: relative; z-index: 1;
}
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; position: relative; z-index: 1; }
.stat-item { text-align: center; }
.stat-value {
  display: block; font-size: 2.4rem; font-weight: 800; color: #fff; letter-spacing: -0.02em;
  background: linear-gradient(135deg, #c4b5fd, #f0abfc, #93c5fd);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.stat-label { font-size: 0.9rem; color: rgba(255,255,255,0.55); margin-top: 4px; display: block; }
@media (max-width: 960px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .stats-grid { gap: 16px; } .stat-value { font-size: 1.8rem; } }
</style>
