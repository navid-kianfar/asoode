<template>
  <section class="pricing-preview-section" ref="el">
    <div class="site-container">
      <div class="section-header anim" :class="{ show: visible }">
        <span class="section-badge">{{ $t('home.pricing_badge') }}</span>
        <h2>{{ $t('pricing.title') }}</h2>
        <p>{{ $t('pricing.subtitle') }}</p>
      </div>
      <div class="pricing-cards">
        <article
          v-for="(plan, i) in plans"
          :key="plan.name"
          class="price-card anim"
          :class="{ show: visible, featured: plan.featured }"
          :style="{ transitionDelay: `${0.1 + i * 0.1}s` }"
        >
          <div v-if="plan.featured" class="popular-tag">{{ $t('pricing.most_popular') }}</div>
          <h3>{{ plan.name }}</h3>
          <p class="plan-desc">{{ plan.desc }}</p>
          <div class="plan-price">
            <span class="price-amount">{{ plan.price }}</span>
            <span v-if="plan.suffix" class="price-suffix">{{ plan.suffix }}</span>
          </div>
          <a :href="plan.href" class="plan-btn" :class="{ primary: plan.featured }">{{ plan.cta }}</a>
        </article>
      </div>
      <div class="view-pricing anim" :class="{ show: visible }" style="transition-delay:.4s">
        <router-link :to="localePath('/pricing')" class="view-pricing-link">
          {{ $t('home.view_pricing') }}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 8h13M10 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { useLocalePath } from '@/composables/useLocalePath'

const { t } = useI18n()
const { el, visible } = useScrollReveal()
const localePath = useLocalePath()

const plans = computed(() => [
  { name: t('pricing.free'), desc: t('pricing.free_desc'), price: '$0', suffix: `/${t('pricing.mo')}`, cta: t('pricing.get_started'), href: 'https://app.asoode.com/register', featured: false },
  { name: t('pricing.pro'), desc: t('pricing.pro_desc'), price: '$12', suffix: t('pricing.per_member'), cta: t('pricing.start_trial'), href: 'https://app.asoode.com/register', featured: true },
  { name: t('pricing.enterprise'), desc: t('pricing.enterprise_desc'), price: t('pricing.custom'), suffix: '', cta: t('pricing.contact_sales'), href: localePath('/contact'), featured: false },
])
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
.pricing-preview-section { padding: 80px 0; }
.pricing-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 800px; margin: 0 auto; }
.price-card {
  position: relative; background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 16px; padding: 32px 24px; text-align: center;
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s;
  &:hover { transform: translateY(-4px); box-shadow: 0 16px 48px var(--card-hover-shadow); }
  &.featured { border-color: var(--accent); border-width: 2px; }
  h3 { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
}
.popular-tag {
  position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
  padding: 4px 14px; font-size: 0.72rem; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #7c3aed, #6366f1); border-radius: 12px; white-space: nowrap;
}
.plan-desc { font-size: 0.84rem; color: var(--text-muted); margin: 0 0 16px; }
.plan-price { margin-bottom: 20px; }
.price-amount { font-size: 2rem; font-weight: 800; color: var(--text-primary); }
.price-suffix { font-size: 0.82rem; color: var(--text-muted); }
.plan-btn {
  display: block; width: 100%; padding: 12px 20px;
  font-size: 0.88rem; font-weight: 600; color: var(--text-primary);
  background: var(--accent-light); border: 1px solid var(--card-border);
  border-radius: 10px; text-decoration: none; text-align: center;
  transition: background 0.3s, transform 0.3s;
  &:hover { transform: translateY(-1px); }
  &.primary {
    color: #fff; background: linear-gradient(135deg, #7c3aed, #6366f1); border-color: transparent;
    &:hover { box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3); }
  }
}
.view-pricing { text-align: center; margin-top: 32px; }
.view-pricing-link {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 0.92rem; font-weight: 600; color: var(--accent);
  text-decoration: none; transition: gap 0.3s;
  &:hover { gap: 12px; }
}
@media (max-width: 960px) { .pricing-cards { grid-template-columns: 1fr; max-width: 360px; margin: 0 auto; } .price-card.featured { order: -1; } }
@media (max-width: 600px) { .section-header h2 { font-size: 1.5rem; } }
</style>
