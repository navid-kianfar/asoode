<template>
  <section class="cta-section" ref="el">
    <div class="site-container">
      <div class="cta-card anim" :class="{ show: visible }">
        <div class="cta-orb cta-orb-1" />
        <div class="cta-orb cta-orb-2" />
        <h2>{{ $t('cta.title') }}</h2>
        <p>{{ $t('cta.subtitle') }}</p>
        <a href="https://app.asoode.com/register" class="cta-btn">{{ $t('cta.button') }}</a>
        <span class="cta-note">{{ $t('cta.note') }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useScrollReveal } from '@/composables/useScrollReveal'

const { el, visible } = useScrollReveal()
</script>

<style scoped lang="scss">
.anim {
  opacity: 0; transform: translateY(28px);
  transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
  &.show { opacity: 1; transform: translateY(0); }
}
.cta-section { padding: 40px 0 100px; }
.cta-card {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #7c3aed, #4c1d95);
  border-radius: 24px; padding: 64px 40px; text-align: center;
  h2 { font-size: 2rem; font-weight: 800; color: #fff; margin: 0 0 12px; position: relative; z-index: 1; }
  p { font-size: 1rem; color: rgba(255,255,255,0.7); max-width: 520px; margin: 0 auto 28px; line-height: 1.7; position: relative; z-index: 1; }
}
.cta-orb {
  position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4;
  &.cta-orb-1 { width: 300px; height: 300px; top: -80px; right: -60px; background: #a78bfa; }
  &.cta-orb-2 { width: 250px; height: 250px; bottom: -80px; left: -60px; background: #ec4899; }
}
.cta-btn {
  display: inline-block; padding: 16px 40px;
  font-size: 1rem; font-weight: 700; color: #1a1a2e; background: #fff;
  border-radius: 12px; text-decoration: none;
  position: relative; z-index: 1;
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(255,255,255,0.2); }
}
.cta-note {
  display: block; margin-top: 12px; font-size: 0.82rem;
  color: rgba(255,255,255,0.5); position: relative; z-index: 1;
}
@media (max-width: 600px) { .cta-card { padding: 48px 24px; } }
</style>
