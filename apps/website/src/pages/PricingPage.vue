<template>
  <div class="pricing-page" :class="{ dark: isDark }">
    <!-- ===== HERO ===== -->
    <section class="pricing-hero">
      <div class="hero-bg">
        <div class="mesh"></div>
        <svg class="dot-matrix" width="100%" height="100%">
          <defs>
            <pattern id="pDots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pDots)" />
        </svg>
      </div>
      <div class="hero-content site-container">
        <h1 class="anim" :class="{ show: heroVisible }">
          {{ $t('pricing.title') }}
        </h1>
        <p class="hero-sub anim" :class="{ show: heroVisible }" style="transition-delay:.08s">
          {{ $t('pricing.subtitle') }}
        </p>
        <!-- Billing Toggle -->
        <div class="billing-toggle anim" :class="{ show: heroVisible }" style="transition-delay:.16s">
          <button :class="{ active: !annual }" @click="annual = false">{{ $t('pricing.monthly') }}</button>
          <button :class="{ active: annual }" @click="annual = true">
            {{ $t('pricing.annual') }}
            <span class="save-badge">{{ $t('pricing.save') }}</span>
          </button>
        </div>
      </div>
      <svg class="wave" viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
        <path d="M0 80L48 68C96 56 192 32 288 24C384 16 480 24 576 32C672 40 768 48 864 48C960 48 1056 40 1152 36C1248 32 1344 32 1392 32L1440 32V80H0Z" class="wave-fill" />
      </svg>
    </section>

    <!-- ===== PLANS ===== -->
    <section class="plans-section" ref="plansEl">
      <div class="site-container">
        <div class="plans-grid">
          <!-- Free -->
          <article class="plan-card anim" :class="{ show: plansVisible }">
            <div class="plan-header">
              <h3>{{ $t('pricing.free') }}</h3>
              <p class="plan-desc">{{ $t('pricing.free_desc') }}</p>
            </div>
            <div class="plan-price">
              <span class="price">$0</span>
              <span class="suffix">/{{ $t('pricing.mo') }}</span>
            </div>
            <p class="plan-limits">{{ $t('pricing.free_limits') }}</p>
            <a href="https://app.asoode.com/register" class="plan-btn">{{ $t('pricing.get_started') }}</a>
            <ul class="plan-features">
              <li v-for="f in freeFeatures" :key="f.key" :class="{ excluded: !f.included }">
                <v-icon size="16" :color="f.included ? 'green' : undefined">{{ f.included ? 'mdi-check-circle' : 'mdi-close-circle-outline' }}</v-icon>
                {{ $t(f.key) }}
              </li>
            </ul>
          </article>

          <!-- Pro -->
          <article class="plan-card featured anim" :class="{ show: plansVisible }" style="transition-delay:.1s">
            <div class="popular-badge">{{ $t('pricing.most_popular') }}</div>
            <div class="plan-header">
              <h3>{{ $t('pricing.pro') }}</h3>
              <p class="plan-desc">{{ $t('pricing.pro_desc') }}</p>
            </div>
            <div class="plan-price">
              <span class="price">{{ annual ? '$10' : '$12' }}</span>
              <span class="suffix">{{ $t('pricing.per_member') }}</span>
            </div>
            <p class="plan-limits">{{ $t('pricing.pro_limits') }}</p>
            <a href="https://app.asoode.com/register" class="plan-btn primary">{{ $t('pricing.start_trial') }}</a>
            <ul class="plan-features">
              <li v-for="f in proFeatures" :key="f.key" :class="{ excluded: !f.included }">
                <v-icon size="16" :color="f.included ? 'green' : undefined">{{ f.included ? 'mdi-check-circle' : 'mdi-close-circle-outline' }}</v-icon>
                {{ $t(f.key) }}
              </li>
            </ul>
          </article>

          <!-- Enterprise -->
          <article class="plan-card anim" :class="{ show: plansVisible }" style="transition-delay:.2s">
            <div class="plan-header">
              <h3>{{ $t('pricing.enterprise') }}</h3>
              <p class="plan-desc">{{ $t('pricing.enterprise_desc') }}</p>
            </div>
            <div class="plan-price">
              <span class="price custom">{{ $t('pricing.custom') }}</span>
            </div>
            <p class="plan-limits">{{ $t('pricing.ent_limits') }}</p>
            <router-link :to="localePath('/contact')" class="plan-btn">{{ $t('pricing.contact_sales') }}</router-link>
            <ul class="plan-features">
              <li v-for="f in enterpriseFeatures" :key="f.key">
                <v-icon size="16" color="green">mdi-check-circle</v-icon>
                {{ $t(f.key) }}
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- ===== FAQ ===== -->
    <section class="faq-section" ref="faqEl">
      <div class="site-container">
        <div class="section-head anim" :class="{ show: faqVisible }">
          <h2>{{ $t('pricing.faq_title') }}</h2>
        </div>
        <div class="faq-grid">
          <div
            v-for="(faq, i) in faqs"
            :key="faq.qKey"
            class="faq-item anim"
            :class="{ show: faqVisible, open: openFaq === i }"
            :style="{ transitionDelay: `${0.04 + i * 0.06}s` }"
          >
            <button class="faq-q" @click="openFaq = openFaq === i ? -1 : i">
              <span>{{ $t(faq.qKey) }}</span>
              <v-icon size="20">{{ openFaq === i ? 'mdi-minus' : 'mdi-plus' }}</v-icon>
            </button>
            <Transition name="faq-expand">
              <div v-if="openFaq === i" class="faq-a">
                <p>{{ $t(faq.aKey) }}</p>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== CTA ===== -->
    <section class="cta-section">
      <div class="site-container">
        <div class="cta-card anim" :class="{ show: faqVisible }">
          <div class="cta-bg">
            <div class="cta-orb cta-orb-1"></div>
            <div class="cta-orb cta-orb-2"></div>
          </div>
          <div class="cta-content">
            <h2>{{ $t('cta.title') }}</h2>
            <p>{{ $t('cta.subtitle') }}</p>
            <a href="https://app.asoode.com/register" class="cta-btn">
              {{ $t('cta.button') }}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </a>
            <span class="cta-note">{{ $t('cta.note') }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppTheme } from '@/composables/useAppTheme'
import { useLocalePath } from '@/composables/useLocalePath'

const { t } = useI18n()
const { isDark } = useAppTheme()
const localePath = useLocalePath()

onMounted(() => {
  document.title = `${t('pricing.title')} — Asoode`
})

const annual = ref(false)
const openFaq = ref(-1)

const freeFeatures = [
  { key: 'pricing.f_kanban', included: true },
  { key: 'pricing.f_tasks', included: true },
  { key: 'pricing.f_messenger', included: true },
  { key: 'pricing.f_files', included: true },
  { key: 'pricing.f_basic_reports', included: true },
  { key: 'pricing.f_time_tracking', included: false },
  { key: 'pricing.f_hr', included: false },
  { key: 'pricing.f_custom_fields', included: false },
]

const proFeatures = [
  { key: 'pricing.f_everything_free', included: true },
  { key: 'pricing.f_time_tracking', included: true },
  { key: 'pricing.f_adv_reports', included: true },
  { key: 'pricing.f_custom_fields', included: true },
  { key: 'pricing.f_adv_perms', included: true },
  { key: 'pricing.f_calendar', included: true },
  { key: 'pricing.f_guests', included: true },
  { key: 'pricing.f_hr', included: false },
  { key: 'pricing.f_sso', included: false },
]

const enterpriseFeatures = [
  { key: 'pricing.f_everything_pro' },
  { key: 'pricing.f_hr' },
  { key: 'pricing.f_org_chart' },
  { key: 'pricing.f_shifts' },
  { key: 'pricing.f_sso' },
  { key: 'pricing.f_api' },
  { key: 'pricing.f_branding' },
  { key: 'pricing.f_onprem' },
  { key: 'pricing.f_export' },
]

const faqs = [
  { qKey: 'pricing.faq1_q', aKey: 'pricing.faq1_a' },
  { qKey: 'pricing.faq2_q', aKey: 'pricing.faq2_a' },
  { qKey: 'pricing.faq3_q', aKey: 'pricing.faq3_a' },
  { qKey: 'pricing.faq4_q', aKey: 'pricing.faq4_a' },
  { qKey: 'pricing.faq5_q', aKey: 'pricing.faq5_a' },
]

// Scroll
const heroVisible = ref(false)
const plansVisible = ref(false)
const faqVisible = ref(false)
const plansEl = ref<HTMLElement>()
const faqEl = ref<HTMLElement>()

onMounted(() => {
  heroVisible.value = true
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        if (e.target === plansEl.value) plansVisible.value = true
        if (e.target === faqEl.value) faqVisible.value = true
      }
    },
    { threshold: 0.05 },
  )
  if (plansEl.value) observer.observe(plansEl.value)
  if (faqEl.value) observer.observe(faqEl.value)
})
</script>

<style scoped lang="scss">
$purple: #7c3aed;

.pricing-page {
  --page-bg: #f8f7fc;
  --card-bg: #ffffff;
  --card-border: rgba(0,0,0,0.04);
  --text-primary: #1a1a2e;
  --text-secondary: #5a576e;
  --text-muted: #9e9bb0;
  --accent: #{$purple};
  --toggle-bg: rgba(0,0,0,0.04);
  --toggle-active-bg: #ffffff;

  &.dark {
    --page-bg: #0f0d1a;
    --card-bg: #161228;
    --card-border: rgba(255,255,255,0.05);
    --text-primary: #e8e6f0;
    --text-secondary: #9e9bb0;
    --text-muted: #706d82;
    --accent: #a78bfa;
    --toggle-bg: rgba(255,255,255,0.06);
    --toggle-active-bg: #1e1a30;
  }

  background: var(--page-bg);
  overflow-x: hidden;
}

/* Animations */
.anim {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1);
  &.show { opacity: 1; transform: none; }
}

/* ===== HERO ===== */
.pricing-hero {
  position: relative;
  background: #0a0818;
  padding: 160px 0 140px;
  margin-bottom: 10px;
  overflow: hidden;
  text-align: center;
}

.hero-bg { position: absolute; inset: 0; }
.mesh {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 30% 30%, rgba(124, 58, 237, 0.18), transparent),
    radial-gradient(ellipse 50% 60% at 70% 70%, rgba(59, 130, 246, 0.12), transparent);
}
.dot-matrix { position: absolute; inset: 0; color: rgba(255,255,255,0.04); }

.hero-content { position: relative; z-index: 2; }

.pricing-hero h1 {
  font-size: 3.2rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.03em;
  margin: 0 0 16px;
}

.hero-sub {
  font-size: 1.05rem;
  color: rgba(255,255,255,0.5);
  line-height: 1.7;
  max-width: 520px;
  margin: 0 auto 32px;
}

/* Billing Toggle */
.billing-toggle {
  display: inline-flex;
  background: rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 4px;
  border: 1px solid rgba(255,255,255,0.08);

  button {
    padding: 10px 22px;
    border: none;
    border-radius: 9px;
    font-size: 0.88rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    background: transparent;
    color: rgba(255,255,255,0.5);
    transition: all 0.25s;
    display: flex;
    align-items: center;
    gap: 8px;

    &.active {
      background: rgba(255,255,255,0.12);
      color: #fff;
    }
  }
}

.save-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.wave {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 60px;
  z-index: 2;
}
.wave-fill { fill: var(--page-bg); }

/* ===== PLANS ===== */
.plans-section {
  padding: 0 0 80px;
  margin-top: -40px;
  position: relative;
  z-index: 3;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  align-items: start;
}

.plan-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 36px 28px;
  border: 1px solid var(--card-border);
  position: relative;

  &.featured {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
}

.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 16px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, $purple, #6366f1);
  white-space: nowrap;
}

.plan-header {
  h3 {
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0 0 4px;
  }
}

.plan-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 20px;
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.price {
  font-size: 2.8rem;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: 1;

  &.custom {
    font-size: 1.6rem;
    font-weight: 700;
  }
}

.suffix {
  font-size: 0.88rem;
  color: var(--text-muted);
}

.plan-limits {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 0 0 24px;
  line-height: 1.5;
}

.plan-btn {
  display: block;
  width: 100%;
  padding: 13px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  border: 1.5px solid var(--card-border);
  color: var(--text-primary);
  background: var(--card-bg);
  transition: all 0.25s;
  margin-bottom: 28px;

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  &.primary {
    background: linear-gradient(135deg, $purple, #6d28d9);
    color: #fff;
    border-color: transparent;

    &:hover {
      box-shadow: 0 8px 32px rgba(124, 58, 237, 0.35);
      transform: translateY(-1px);
    }
  }
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.87rem;
    color: var(--text-secondary);

    &.excluded { color: var(--text-muted); }
  }
}

/* ===== FAQ ===== */
.faq-section { padding: 0 0 80px; }

.section-head {
  text-align: center;
  margin-bottom: 40px;

  h2 {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin: 0;
  }
}

.faq-grid {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.faq-item {
  background: var(--card-bg);
  border-radius: 14px;
  border: 1px solid var(--card-border);
  overflow: hidden;
  transition: border-color 0.25s;

  &.open { border-color: var(--accent); }
}

.faq-q {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: left;
  font-family: inherit;
}

.faq-a {
  padding: 0 20px 18px;

  p {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.7;
    margin: 0;
  }
}

.faq-expand-enter-active,
.faq-expand-leave-active {
  transition: opacity 0.2s, max-height 0.3s;
  max-height: 200px;
  overflow: hidden;
}
.faq-expand-enter-from,
.faq-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

/* ===== CTA ===== */
.cta-section { padding: 0 0 100px; }

.cta-card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  padding: 72px 40px;
  text-align: center;
  background: #0a0818;
}
.cta-bg { position: absolute; inset: 0; }
.cta-orb { position: absolute; border-radius: 50%; filter: blur(80px); }
.cta-orb-1 { width: 400px; height: 400px; top: -100px; left: -50px; background: rgba(124, 58, 237, 0.25); }
.cta-orb-2 { width: 300px; height: 300px; bottom: -80px; right: -30px; background: rgba(59, 130, 246, 0.2); }
.cta-content {
  position: relative; z-index: 2;
  h2 { font-size: 2rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; margin: 0 0 12px; }
  p { font-size: 1rem; color: rgba(255,255,255,0.55); max-width: 480px; margin: 0 auto 28px; line-height: 1.7; }
}
.cta-btn {
  display: inline-flex; align-items: center; gap: 10px; padding: 14px 32px;
  border-radius: 14px; font-size: 0.95rem; font-weight: 700; color: #fff;
  text-decoration: none; background: linear-gradient(135deg, $purple, #6d28d9);
  transition: box-shadow 0.3s, transform 0.2s;
  &:hover { box-shadow: 0 8px 32px rgba(124, 58, 237, 0.45); transform: translateY(-2px); }
}
.cta-note { display: block; margin-top: 14px; font-size: 0.82rem; color: rgba(255,255,255,0.35); }

/* ===== RESPONSIVE ===== */
@media (max-width: 960px) {
  .pricing-hero { padding: 130px 0 120px; }
  .pricing-hero h1 { font-size: 2.6rem; }
  .plans-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
  .plan-card.featured { order: -1; }
}

@media (max-width: 600px) {
  .pricing-hero { padding: 110px 0 100px; }
  .pricing-hero h1 { font-size: 2rem; }
  .hero-sub { font-size: 0.95rem; }
  .cta-card { padding: 48px 24px; }
}
</style>
