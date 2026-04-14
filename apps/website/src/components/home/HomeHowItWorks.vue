<template>
  <section class="works-section" ref="el">
    <div class="site-container">
      <div class="section-header anim" :class="{ show: visible }">
        <span class="section-badge">{{ $t('home.works_badge') }}</span>
        <h2>{{ $t('how_it_works.title') }}</h2>
        <p>{{ $t('how_it_works.subtitle') }}</p>
      </div>
      <div class="steps-row">
        <div
          v-for="(step, i) in steps"
          :key="i"
          class="step-item anim"
          :class="{ show: visible }"
          :style="{ transitionDelay: `${0.1 + i * 0.15}s` }"
        >
          <div class="step-art-wrap">
            <component :is="step.art" />
          </div>
          <div class="step-num">{{ i + 1 }}</div>
          <h3>{{ $t(step.titleKey) }}</h3>
          <p>{{ $t(step.descKey) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import ArtStepSetup from '@/components/art/ArtStepSetup.vue'
import ArtStepPlan from '@/components/art/ArtStepPlan.vue'
import ArtStepTrack from '@/components/art/ArtStepTrack.vue'

const { el, visible } = useScrollReveal()

const steps = [
  { titleKey: 'how_it_works.step1_title', descKey: 'how_it_works.step1_desc', art: markRaw(ArtStepSetup) },
  { titleKey: 'how_it_works.step2_title', descKey: 'how_it_works.step2_desc', art: markRaw(ArtStepPlan) },
  { titleKey: 'how_it_works.step3_title', descKey: 'how_it_works.step3_desc', art: markRaw(ArtStepTrack) },
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
.works-section { padding: 80px 0; background: var(--card-bg); }
.steps-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; position: relative; }
.step-item { text-align: center; }
.step-art-wrap { margin-bottom: 20px; display: flex; justify-content: center; }
.step-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: #fff; font-weight: 800; font-size: 1rem; margin-bottom: 14px;
}
.step-item {
  h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 8px; }
  p { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.65; margin: 0; }
}
@media (max-width: 960px) { .steps-row { grid-template-columns: 1fr; max-width: 360px; margin: 0 auto; } }
@media (max-width: 600px) { .section-header h2 { font-size: 1.5rem; } }
</style>
