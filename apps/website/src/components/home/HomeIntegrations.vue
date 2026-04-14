<template>
  <section class="integrations-section" ref="el">
    <div class="site-container">
      <div class="section-header anim" :class="{ show: visible }">
        <span class="section-badge">{{ $t('home.integrations_badge') }}</span>
        <h2>{{ $t('integrations.title') }}</h2>
        <p>{{ $t('integrations.subtitle') }}</p>
      </div>
      <div class="integrations-visual anim" :class="{ show: visible }" style="transition-delay:.12s">
        <ArtApiHub />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useScrollReveal } from '@/composables/useScrollReveal'
import ArtApiHub from '@/components/art/ArtApiHub.vue'

const { el, visible } = useScrollReveal()
</script>

<style scoped lang="scss">
.anim {
  opacity: 0; transform: translateY(28px);
  transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
  &.show { opacity: 1; transform: translateY(0); }
}
.section-header {
  text-align: center; margin-bottom: 48px;
  h2 { font-size: 2.2rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin: 12px 0 14px; }
  p { font-size: 1.05rem; color: var(--text-secondary); max-width: 560px; margin: 0 auto; line-height: 1.7; }
}
.section-badge {
  display: inline-block; padding: 5px 14px; font-size: 0.78rem; font-weight: 600;
  color: var(--accent); background: var(--accent-light); border-radius: 20px; letter-spacing: 0.02em;
}
.integrations-section { padding: 80px 0; background: var(--card-bg); }
.integrations-visual { display: flex; justify-content: center; overflow: hidden; }
@media (max-width: 960px) { :deep(.api-hub) { width: 280px; height: 280px; } }
@media (max-width: 600px) { .section-header h2 { font-size: 1.5rem; } }
</style>
