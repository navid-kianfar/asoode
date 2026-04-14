<template>
  <div class="home-page" :class="{ dark: isDark }">
    <HomeHero />
    <HomeFeatures />
    <HomeHowItWorks />
    <HomeStats />
    <HomeTestimonials />
    <HomeIntegrations />
    <HomePricing />
    <HomeCta />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppTheme } from '@/composables/useAppTheme'
import HomeHero from '@/components/home/HomeHero.vue'
import HomeFeatures from '@/components/home/HomeFeatures.vue'
import HomeHowItWorks from '@/components/home/HomeHowItWorks.vue'
import HomeStats from '@/components/home/HomeStats.vue'
import HomeTestimonials from '@/components/home/HomeTestimonials.vue'
import HomeIntegrations from '@/components/home/HomeIntegrations.vue'
import HomePricing from '@/components/home/HomePricing.vue'
import HomeCta from '@/components/home/HomeCta.vue'

const { t } = useI18n()
const { isDark } = useAppTheme()

onMounted(() => {
  document.title = `Asoode — ${t('hero.title')}`
})
</script>

<style scoped lang="scss">
.home-page {
  --page-bg: #f8f7fc;
  --card-bg: #ffffff;
  --card-border: rgba(0,0,0,0.06);
  --card-hover-shadow: rgba(0,0,0,0.08);
  --text-primary: #1a1a2e;
  --text-secondary: #5a576e;
  --text-muted: #9e9bb0;
  --accent: #7c3aed;
  --accent-light: rgba(124, 58, 237, 0.08);
  --art-bg: #f0eef6;
  --art-elem: #e4e1f0;
  --art-card: #ffffff;
  --art-border: rgba(0,0,0,0.08);
  --art-line: rgba(0,0,0,0.12);
  --art-text: #5a576e;
  --art-text-muted: #9e9bb0;

  &.dark {
    --page-bg: #0f0d1a;
    --card-bg: #161228;
    --card-border: rgba(255,255,255,0.06);
    --card-hover-shadow: rgba(0,0,0,0.3);
    --text-primary: #e8e6f0;
    --text-secondary: #9e9bb0;
    --text-muted: #706d82;
    --accent: #a78bfa;
    --accent-light: rgba(167, 139, 250, 0.08);
    --art-bg: #1a1630;
    --art-elem: #252040;
    --art-card: #201b38;
    --art-border: rgba(255,255,255,0.06);
    --art-line: rgba(255,255,255,0.1);
    --art-text: #c0bdd0;
    --art-text-muted: #706d82;
  }

  background: var(--page-bg);
}
</style>
