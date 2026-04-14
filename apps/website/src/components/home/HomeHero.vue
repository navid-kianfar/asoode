<template>
  <section class="home-hero" ref="el">
    <div class="hero-bg">
      <div class="mesh" />
      <svg class="dot-matrix" width="100%" height="100%">
        <defs>
          <pattern id="hDots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hDots)" />
      </svg>
    </div>
    <div class="hero-content site-container">
      <div class="hero-grid">
        <div class="hero-text">
          <div class="badge anim" :class="{ show: visible }">
            <span class="badge-dot" />
            {{ $t('home.badge') }}
          </div>
          <h1 class="anim" :class="{ show: visible }" style="transition-delay:.08s">
            {{ $t('home.hero_line1') }}<br />
            {{ $t('home.hero_line2') }}<br />
            <span class="gradient-text">{{ $t('home.hero_gradient') }}</span>
          </h1>
          <p class="hero-sub anim" :class="{ show: visible }" style="transition-delay:.16s">
            {{ $t('hero.subtitle') }}
          </p>
          <div class="hero-actions anim" :class="{ show: visible }" style="transition-delay:.24s">
            <a href="https://app.asoode.com/register" class="btn-primary-hero">
              {{ $t('hero.cta_primary') }}
            </a>
            <button class="btn-ghost-hero" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
              </svg>
              {{ $t('hero.cta_secondary') }}
            </button>
          </div>
        </div>
        <div class="hero-visual anim" :class="{ show: visible }" style="transition-delay:.2s">
          <ArtHeroDash />
        </div>
      </div>
    </div>
    <svg class="wave" viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
      <path d="M0 80L48 68C96 56 192 32 288 24C384 16 480 24 576 32C672 40 768 48 864 48C960 48 1056 40 1152 36C1248 32 1344 32 1392 32L1440 32V80H0Z" class="wave-fill" />
    </svg>
  </section>
</template>

<script setup lang="ts">
import { useScrollReveal } from '@/composables/useScrollReveal'
import ArtHeroDash from '@/components/art/ArtHeroDash.vue'

const { el, visible } = useScrollReveal({ immediate: true })
</script>

<style scoped lang="scss">
.anim {
  opacity: 0; transform: translateY(28px);
  transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
  &.show { opacity: 1; transform: translateY(0); }
}
.home-hero {
  position: relative; background: #0a0818;
  padding: 150px 0 120px; overflow: hidden; margin-bottom: 10px;
}
.hero-bg { position: absolute; inset: 0; }
.mesh {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 20% 30%, rgba(124, 58, 237, 0.18), transparent),
    radial-gradient(ellipse 50% 60% at 80% 60%, rgba(59, 130, 246, 0.12), transparent),
    radial-gradient(ellipse 40% 40% at 50% 80%, rgba(236, 72, 153, 0.08), transparent);
}
.dot-matrix { position: absolute; inset: 0; color: rgba(255,255,255,0.04); }
.hero-content { position: relative; z-index: 2; }
.hero-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center;
}
.hero-text { max-width: 560px; }
.badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 16px; font-size: 0.82rem; font-weight: 600;
  color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px; backdrop-filter: blur(12px); margin-bottom: 28px;
}
.badge-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #10b981;
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
  50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
}
.home-hero h1 {
  font-size: 3.6rem; font-weight: 800; line-height: 1.12;
  color: #fff; letter-spacing: -0.03em; margin: 0 0 24px;
}
.gradient-text {
  background: linear-gradient(135deg, #c4b5fd 0%, #f0abfc 30%, #93c5fd 60%, #c4b5fd 100%);
  background-size: 300% 100%;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 6s ease-in-out infinite;
}
@keyframes shimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
.hero-sub {
  font-size: 1.08rem; line-height: 1.75; color: rgba(255,255,255,0.6);
  margin: 0 0 32px; max-width: 480px;
}
.hero-actions { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.btn-primary-hero {
  display: inline-flex; align-items: center; padding: 14px 32px;
  font-size: 0.95rem; font-weight: 700; color: #0f0d1a;
  background: linear-gradient(135deg, #a78bfa, #7c3aed);
  border-radius: 12px; text-decoration: none;
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(124, 58, 237, 0.4); }
}
.btn-ghost-hero {
  display: inline-flex; align-items: center; gap: 8px; padding: 14px 24px;
  font-size: 0.95rem; font-weight: 600; color: rgba(255,255,255,0.8);
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px; cursor: pointer;
  transition: background 0.3s, color 0.3s;
  &:hover { background: rgba(255,255,255,0.1); color: #fff; }
}
.hero-visual { position: relative; perspective: 800px; overflow: hidden; border-radius: 20px; }
.wave { position: absolute; bottom: -1px; left: 0; width: 100%; height: 60px; z-index: 2; }
.wave-fill { fill: var(--page-bg); }

@media (max-width: 960px) {
  .home-hero { padding: 130px 0 100px; }
  .home-hero h1 { font-size: 2.8rem; }
  .hero-grid { grid-template-columns: 1fr; text-align: center; }
  .hero-text { max-width: 100%; }
  .hero-sub { margin-left: auto; margin-right: auto; }
  .hero-actions { justify-content: center; }
  .hero-visual { display: none; }
}
@media (max-width: 600px) {
  .home-hero { padding: 110px 0 80px; }
  .home-hero h1 { font-size: 2.1rem; }
  .hero-sub { font-size: 0.95rem; }
}
</style>
