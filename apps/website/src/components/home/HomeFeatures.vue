<template>
  <section class="features-section" ref="el">
    <div class="site-container">
      <div class="section-header anim" :class="{ show: visible }">
        <span class="section-badge">{{ $t('home.features_badge') }}</span>
        <h2>{{ $t('features_overview.title') }}</h2>
        <p>{{ $t('features_overview.subtitle') }}</p>
      </div>
      <div class="features-grid">
        <article
          v-for="(feat, i) in features"
          :key="feat.key"
          class="feat-card anim"
          :class="{ show: visible }"
          :style="{ transitionDelay: `${0.1 + i * 0.08}s` }"
        >
          <div class="feat-art">
            <component :is="feat.art" />
          </div>
          <h3>{{ $t(feat.titleKey) }}</h3>
          <p>{{ $t(feat.descKey) }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import ArtMiniProject from '@/components/art/ArtMiniProject.vue'
import ArtMiniKanban from '@/components/art/ArtMiniKanban.vue'
import ArtMiniTeam from '@/components/art/ArtMiniTeam.vue'
import ArtMiniChat from '@/components/art/ArtMiniChat.vue'
import ArtMiniTime from '@/components/art/ArtMiniTime.vue'
import ArtMiniFiles from '@/components/art/ArtMiniFiles.vue'

const { el, visible } = useScrollReveal()

const features = [
  { key: 'pm', titleKey: 'features_overview.project_management', descKey: 'features_overview.project_management_desc', art: markRaw(ArtMiniProject) },
  { key: 'kb', titleKey: 'features_overview.kanban', descKey: 'features_overview.kanban_desc', art: markRaw(ArtMiniKanban) },
  { key: 'co', titleKey: 'features_overview.collaboration', descKey: 'features_overview.collaboration_desc', art: markRaw(ArtMiniTeam) },
  { key: 'ms', titleKey: 'features_overview.messenger', descKey: 'features_overview.messenger_desc', art: markRaw(ArtMiniChat) },
  { key: 'tt', titleKey: 'features_overview.time_tracking', descKey: 'features_overview.time_tracking_desc', art: markRaw(ArtMiniTime) },
  { key: 'fi', titleKey: 'features_overview.files', descKey: 'features_overview.files_desc', art: markRaw(ArtMiniFiles) },
]
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
.features-section { padding: 80px 0; }
.features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.feat-card {
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 16px; overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s;
  &:hover { transform: translateY(-4px); box-shadow: 0 16px 48px var(--card-hover-shadow); }
  h3 { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); padding: 0 24px; margin: 0 0 6px; }
  p { font-size: 0.87rem; color: var(--text-secondary); line-height: 1.6; padding: 0 24px 24px; margin: 0; }
}
.feat-art {
  height: 160px; display: flex; align-items: center; justify-content: center;
  background: var(--accent-light); margin-bottom: 16px; overflow: hidden;
  & > :deep(*) { max-width: 100%; max-height: 100%; }
}
@media (max-width: 960px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .features-grid { grid-template-columns: 1fr; } .section-header h2 { font-size: 1.5rem; } }
</style>
