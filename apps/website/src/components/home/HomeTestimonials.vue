<template>
  <section class="testimonials-section" ref="el">
    <div class="site-container">
      <div class="section-header anim" :class="{ show: visible }">
        <span class="section-badge">{{ $t('home.testimonials_badge') }}</span>
        <h2>{{ $t('testimonials.title') }}</h2>
      </div>
      <div class="testimonials-grid">
        <article
          v-for="(t, i) in testimonialItems"
          :key="i"
          class="testimonial-card anim"
          :class="{ show: visible }"
          :style="{ transitionDelay: `${0.1 + i * 0.1}s` }"
        >
          <svg class="quote-icon" width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.71 11 13.29 11 15.202c0 .99-.378 1.939-1.05 2.639A3.394 3.394 0 017.5 19c-1.172 0-2.108-.467-2.917-1.679zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.71 21 13.29 21 15.202c0 .99-.378 1.939-1.05 2.639A3.394 3.394 0 0117.5 19c-1.172 0-2.108-.467-2.917-1.679z" fill="currentColor" />
          </svg>
          <p class="testimonial-text">{{ $t(t.textKey) }}</p>
          <div class="testimonial-author">
            <div class="author-avatar" :style="{ background: t.gradient }">{{ t.initials }}</div>
            <div class="author-info">
              <strong>{{ $t(t.nameKey) }}</strong>
              <span>{{ $t(t.roleKey) }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useScrollReveal } from '@/composables/useScrollReveal'

const { el, visible } = useScrollReveal()

const testimonialItems = [
  { textKey: 'testimonials.t1_text', nameKey: 'testimonials.t1_name', roleKey: 'testimonials.t1_role', initials: 'SC', gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)' },
  { textKey: 'testimonials.t2_text', nameKey: 'testimonials.t2_name', roleKey: 'testimonials.t2_role', initials: 'AR', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
  { textKey: 'testimonials.t3_text', nameKey: 'testimonials.t3_name', roleKey: 'testimonials.t3_role', initials: 'MG', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
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
}
.section-badge {
  display: inline-block; padding: 5px 14px; font-size: 0.78rem; font-weight: 600;
  color: var(--accent); background: var(--accent-light); border-radius: 20px; letter-spacing: 0.02em;
}
.testimonials-section { padding: 80px 0; }
.testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.testimonial-card {
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 16px; padding: 28px 24px;
  display: flex; flex-direction: column;
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s;
  &:hover { transform: translateY(-4px); box-shadow: 0 12px 40px var(--card-hover-shadow); }
}
.quote-icon { color: var(--accent); opacity: 0.5; margin-bottom: 12px; flex-shrink: 0; }
.testimonial-text { font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7; flex: 1; margin: 0 0 20px; }
.testimonial-author { display: flex; align-items: center; gap: 12px; }
.author-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.78rem; font-weight: 700; flex-shrink: 0;
}
.author-info {
  strong { display: block; font-size: 0.88rem; color: var(--text-primary); }
  span { font-size: 0.78rem; color: var(--text-muted); }
}
@media (max-width: 960px) { .testimonials-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; } }
@media (max-width: 600px) { .section-header h2 { font-size: 1.5rem; } }
</style>
