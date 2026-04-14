<template>
  <div class="contact-page" :class="{ dark: isDark }">
    <!-- ===== HERO ===== -->
    <section class="contact-hero">
      <div class="hero-bg">
        <div class="mesh"></div>
        <svg class="dot-matrix" width="100%" height="100%">
          <defs>
            <pattern id="cDots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cDots)" />
        </svg>
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
      </div>

      <div class="hero-content site-container">
        <div class="badge anim" :class="{ show: heroVisible }">
          <span class="badge-dot"></span>
          {{ $t('contact.badge') }}
        </div>
        <h1 class="anim" :class="{ show: heroVisible }" style="transition-delay:.08s">
          {{ $t('contact.hero_line1') }}<br />
          <span class="gradient-text">{{ $t('contact.hero_line2') }}</span>
        </h1>
        <p class="hero-sub anim" :class="{ show: heroVisible }" style="transition-delay:.16s">
          {{ $t('contact.subtitle') }}
        </p>
      </div>

      <svg class="wave" viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
        <path d="M0 80L48 68C96 56 192 32 288 24C384 16 480 24 576 32C672 40 768 48 864 48C960 48 1056 40 1152 36C1248 32 1344 32 1392 32L1440 32V80H0Z" class="wave-fill" />
      </svg>
    </section>

    <!-- ===== CONTACT CHANNELS ===== -->
    <section class="channels-section" ref="channelsEl">
      <div class="site-container">
        <div class="channels-grid">
          <article
            v-for="(ch, i) in channels"
            :key="ch.titleKey"
            class="channel-card anim"
            :class="{ show: channelsVisible }"
            :style="{ transitionDelay: `${i * 0.1}s` }"
          >
            <div class="channel-glow" :style="{ background: ch.glow }"></div>
            <div class="channel-icon" :style="{ background: ch.gradient }">
              <v-icon size="24" color="white">{{ ch.icon }}</v-icon>
            </div>
            <h3>{{ $t(ch.titleKey) }}</h3>
            <p>{{ $t(ch.descKey) }}</p>
            <a :href="ch.href" class="channel-link">
              {{ $t(ch.linkKey) }}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>
          </article>
        </div>
      </div>
    </section>

    <!-- ===== FORM + INFO ===== -->
    <section class="form-section" ref="formEl">
      <div class="site-container">
        <div class="form-layout">
          <!-- Left: Form -->
          <div class="form-card anim" :class="{ show: formVisible }">
            <div class="form-header">
              <div class="accent-line"></div>
              <h2>{{ $t('contact.form_title') }}</h2>
              <p>{{ $t('contact.form_desc') }}</p>
            </div>

            <form @submit.prevent="handleSubmit" class="the-form" novalidate>
              <div class="row-2">
                <div class="field">
                  <label>{{ $t('contact.name') }}</label>
                  <div class="input-wrap">
                    <v-icon size="18" class="field-icon">mdi-account-outline</v-icon>
                    <input v-model="form.name" type="text" :placeholder="$t('contact.name_placeholder')" required />
                  </div>
                </div>
                <div class="field">
                  <label>{{ $t('contact.email') }}</label>
                  <div class="input-wrap">
                    <v-icon size="18" class="field-icon">mdi-email-outline</v-icon>
                    <input v-model="form.email" type="email" :placeholder="$t('contact.email_placeholder')" required />
                  </div>
                </div>
              </div>

              <div class="field">
                <label>{{ $t('contact.subject') }}</label>
                <div class="input-wrap">
                  <v-icon size="18" class="field-icon">mdi-tag-outline</v-icon>
                  <select v-model="form.subject" required>
                    <option value="" disabled>{{ $t('contact.subject_placeholder') }}</option>
                    <option value="general">{{ $t('contact.general') }}</option>
                    <option value="sales">{{ $t('contact.sales') }}</option>
                    <option value="support">{{ $t('contact.support') }}</option>
                    <option value="partnership">{{ $t('contact.partnership') }}</option>
                    <option value="press">{{ $t('contact.press') }}</option>
                  </select>
                </div>
              </div>

              <div class="field">
                <label>{{ $t('contact.message') }}</label>
                <textarea v-model="form.message" :placeholder="$t('contact.message_placeholder')" rows="5" required></textarea>
              </div>

              <button type="submit" class="submit-btn" :class="{ sent: submitted }" :disabled="submitted">
                <template v-if="submitted">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  {{ $t('contact.sent') }}
                </template>
                <template v-else>
                  {{ $t('contact.submit') }}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </template>
              </button>
            </form>
          </div>

          <!-- Right: Info sidebar -->
          <aside class="info-side anim" :class="{ show: formVisible }" style="transition-delay:.15s">
            <!-- Office Hours -->
            <div class="info-block">
              <div class="info-icon-badge">
                <v-icon size="20">mdi-clock-outline</v-icon>
              </div>
              <h4>{{ $t('contact.hours_title') }}</h4>
              <ul class="hours">
                <li>
                  <span>{{ $t('contact.hours_weekdays') }}</span>
                  <span class="hours-val">9:00 — 18:00</span>
                </li>
                <li>
                  <span>{{ $t('contact.hours_saturday') }}</span>
                  <span class="hours-val">10:00 — 14:00</span>
                </li>
                <li class="closed">
                  <span>{{ $t('contact.hours_sunday') }}</span>
                  <span>{{ $t('contact.hours_closed') }}</span>
                </li>
              </ul>
              <span class="tz">UTC+3:30 (Tehran)</span>
            </div>

            <!-- Socials — compact row -->
            <div class="info-block">
              <div class="info-icon-badge">
                <v-icon size="20">mdi-earth</v-icon>
              </div>
              <h4>{{ $t('contact.follow_title') }}</h4>
              <div class="socials-row">
                <a v-for="s in socials" :key="s.name" :href="s.url" :title="s.name" class="social-btn" :style="{ '--c': s.color }">
                  <v-icon size="18">{{ s.icon }}</v-icon>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <!-- ===== LOCATION + MAP ===== -->
    <section class="location-section" ref="mapEl">
      <div class="site-container">
        <div class="location-card anim" :class="{ show: mapVisible }">
          <div class="location-info">
            <div class="info-icon-badge">
              <v-icon size="20">mdi-map-marker-outline</v-icon>
            </div>
            <h3>{{ $t('contact.location_title') }}</h3>
            <p class="location-text">{{ $t('contact.location_address') }}</p>
            <p class="location-extra">{{ $t('contact.location_extra') }}</p>
          </div>
          <div class="map-wrap">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=51.10%2C35.55%2C51.65%2C35.85&layer=mapnik&marker=35.6892%2C51.3890"
              width="100%"
              height="100%"
              style="border:0"
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppTheme } from '@/composables/useAppTheme'

const { t } = useI18n()
const { isDark } = useAppTheme()

onMounted(() => {
  document.title = `${t('contact.title')} — Asoode`
})

const form = reactive({ name: '', email: '', subject: '', message: '' })
const submitted = ref(false)

const channels = [
  {
    titleKey: 'contact.ch_email_title',
    descKey: 'contact.ch_email_desc',
    linkKey: 'contact.ch_email_link',
    icon: 'mdi-email-fast-outline',
    gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)',
    glow: 'radial-gradient(circle, rgba(124, 58, 237, 0.12), transparent 70%)',
    href: 'mailto:hello@asoode.com',
  },
  {
    titleKey: 'contact.ch_chat_title',
    descKey: 'contact.ch_chat_desc',
    linkKey: 'contact.ch_chat_link',
    icon: 'mdi-chat-processing-outline',
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    glow: 'radial-gradient(circle, rgba(59, 130, 246, 0.12), transparent 70%)',
    href: 'https://app.asoode.com',
  },
  {
    titleKey: 'contact.ch_demo_title',
    descKey: 'contact.ch_demo_desc',
    linkKey: 'contact.ch_demo_link',
    icon: 'mdi-calendar-clock-outline',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    glow: 'radial-gradient(circle, rgba(139, 92, 246, 0.12), transparent 70%)',
    href: 'mailto:demo@asoode.com',
  },
]

const socials = [
  { name: 'Twitter', icon: 'mdi-twitter', url: '#', color: '#1DA1F2' },
  { name: 'LinkedIn', icon: 'mdi-linkedin', url: '#', color: '#0A66C2' },
  { name: 'GitHub', icon: 'mdi-github', url: '#', color: '#6e5494' },
  { name: 'Instagram', icon: 'mdi-instagram', url: '#', color: '#E4405F' },
]

// Scroll animations
const heroVisible = ref(false)
const channelsVisible = ref(false)
const formVisible = ref(false)
const mapVisible = ref(false)
const channelsEl = ref<HTMLElement>()
const formEl = ref<HTMLElement>()
const mapEl = ref<HTMLElement>()

onMounted(() => {
  heroVisible.value = true

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        if (entry.target === channelsEl.value) channelsVisible.value = true
        if (entry.target === formEl.value) formVisible.value = true
        if (entry.target === mapEl.value) mapVisible.value = true
      }
    },
    { threshold: 0.05 },
  )

  if (channelsEl.value) observer.observe(channelsEl.value)
  if (formEl.value) observer.observe(formEl.value)
  if (mapEl.value) observer.observe(mapEl.value)
})

function handleSubmit() {
  if (!form.name || !form.email || !form.message) return
  submitted.value = true
  setTimeout(() => {
    submitted.value = false
    Object.assign(form, { name: '', email: '', subject: '', message: '' })
  }, 3000)
}
</script>

<style scoped lang="scss">
// Using .dark class on root element for reliable scoped dark mode
$purple: #7c3aed;
$purple-dark: #6d28d9;

/* ===== CSS CUSTOM PROPERTIES ===== */
.contact-page {
  --page-bg: #f8f7fc;
  --card-bg: #ffffff;
  --card-border: rgba(0,0,0,0.04);
  --text-primary: #1a1a2e;
  --text-secondary: #5a576e;
  --text-muted: #9e9bb0;
  --input-bg: #ffffff;
  --input-border: #e8e5f0;
  --input-placeholder: #b5b3c4;
  --focus-color: #{$purple};
  --focus-shadow: rgba(124, 58, 237, 0.08);
  --hours-border: rgba(0,0,0,0.04);
  --link-color: #{$purple};
  --link-hover: #{$purple-dark};
  --icon-badge-bg: rgba(124, 58, 237, 0.08);
  --icon-badge-color: #{$purple};
  --social-bg: rgba(0,0,0,0.04);
  --social-color: #5a576e;

  &.dark {
    --page-bg: #0f0d1a;
    --card-bg: #161228;
    --card-border: rgba(255,255,255,0.05);
    --text-primary: #e8e6f0;
    --text-secondary: #9e9bb0;
    --text-muted: #706d82;
    --input-bg: #1e1a30;
    --input-border: rgba(255,255,255,0.06);
    --input-placeholder: #4a475e;
    --focus-color: #a78bfa;
    --focus-shadow: rgba(167, 139, 250, 0.1);
    --hours-border: rgba(255,255,255,0.04);
    --link-color: #a78bfa;
    --link-hover: #c4b5fd;
    --icon-badge-bg: rgba(167, 139, 250, 0.1);
    --icon-badge-color: #a78bfa;
    --social-bg: rgba(255,255,255,0.05);
    --social-color: #9e9bb0;
  }

  background: var(--page-bg);
  overflow-x: hidden;
}

/* ===== ANIMATIONS ===== */
.anim {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  &.show { opacity: 1; transform: none; }
}

/* ===== HERO ===== */
.contact-hero {
  position: relative;
  background: #0a0818;
  padding: 160px 0 120px;
  margin-bottom: 10px;
  overflow: hidden;
  text-align: center;
}

.hero-bg { position: absolute; inset: 0; }

.mesh {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 20% 30%, rgba(124, 58, 237, 0.18), transparent),
    radial-gradient(ellipse 50% 60% at 80% 60%, rgba(#3b82f6, 0.12), transparent),
    radial-gradient(ellipse 40% 40% at 50% 80%, rgba(#ec4899, 0.08), transparent);
}

.dot-matrix {
  position: absolute;
  inset: 0;
  color: rgba(255,255,255,0.04);
}

.ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.04);
}

.ring-1 {
  width: 600px; height: 600px;
  top: -200px; left: -100px;
  animation: ring-float 20s ease-in-out infinite;
}
.ring-2 {
  width: 400px; height: 400px;
  bottom: -100px; right: -50px;
  animation: ring-float 16s ease-in-out infinite reverse;
}

@keyframes ring-float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(20px, -15px) rotate(180deg); }
}

.hero-content { position: relative; z-index: 2; }

.badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px 8px 14px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 100px;
  color: rgba(255,255,255,0.75);
  font-size: 0.85rem;
  font-weight: 500;
  backdrop-filter: blur(12px);
  margin-bottom: 28px;
}

.badge-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
  50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
}

.contact-hero h1 {
  font-size: 3.8rem;
  font-weight: 800;
  line-height: 1.12;
  color: #fff;
  letter-spacing: -0.03em;
  margin: 0 0 20px;
}

.gradient-text {
  background: linear-gradient(135deg, #c4b5fd 0%, #f0abfc 30%, #93c5fd 60%, #c4b5fd 100%);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 6s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.hero-sub {
  font-size: 1.1rem;
  color: rgba(255,255,255,0.5);
  line-height: 1.7;
  max-width: 520px;
  margin: 0 auto;
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

/* ===== CHANNELS ===== */
.channels-section {
  padding: 0 0 64px;
  margin-top: -20px;
  position: relative;
  z-index: 3;
}

.channels-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.channel-card {
  position: relative;
  background: var(--card-bg);
  border-radius: 20px;
  padding: 32px 28px;
  border: 1px solid var(--card-border);
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s cubic-bezier(0.22,1,0.36,1);

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.08);

    .channel-glow { opacity: 1; }
    .channel-link svg { transform: translateX(4px); }
  }

  h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 16px 0 8px; }
  p { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin: 0 0 16px; }
}

.dark .channel-card:hover { box-shadow: 0 20px 60px rgba(0,0,0,0.3); }

.channel-glow {
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
}

.channel-icon {
  width: 52px; height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.channel-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.87rem;
  font-weight: 600;
  color: var(--link-color);
  text-decoration: none;

  svg { transition: transform 0.3s cubic-bezier(0.22,1,0.36,1); }
  &:hover { color: var(--link-hover); }
}

/* ===== FORM SECTION ===== */
.form-section { padding: 0 0 80px; }

.form-layout {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 28px;
  align-items: start;
}

.form-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 44px 40px;
  border: 1px solid var(--card-border);
}

.form-header {
  margin-bottom: 32px;

  h2 { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 8px; }
  p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }
}

.accent-line {
  width: 48px;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, $purple, #a78bfa);
  margin-bottom: 20px;
}

.the-form { display: flex; flex-direction: column; gap: 20px; }

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;

  label {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  pointer-events: none;
  z-index: 1;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid var(--input-border);
  border-radius: 12px;
  font-size: 0.9rem;
  font-family: inherit;
  background: var(--input-bg);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s;

  &::placeholder { color: var(--input-placeholder); }

  &:focus {
    border-color: var(--focus-color);
    box-shadow: 0 0 0 3px var(--focus-shadow);
  }
}

.input-wrap input,
.input-wrap select {
  padding-left: 42px;
}

.field select {
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239e9bb0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 16px;
  padding-right: 40px;
}

.field textarea {
  resize: vertical;
  min-height: 120px;
}

.submit-btn {
  width: 100%;
  padding: 14px 28px;
  border: none;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  background: linear-gradient(135deg, $purple, $purple-dark);
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.3s, transform 0.2s;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, $purple-dark, #4c1d95);
    opacity: 0;
    transition: opacity 0.3s;
  }

  & > * { position: relative; z-index: 1; }

  &:hover:not(:disabled) {
    box-shadow: 0 8px 32px rgba(124, 58, 237, 0.35);
    transform: translateY(-1px);
    &::before { opacity: 1; }
  }

  &:active:not(:disabled) { transform: translateY(0); }

  &.sent {
    background: linear-gradient(135deg, #10b981, #059669);
    &::before { display: none; }
  }
}

/* ===== INFO SIDEBAR ===== */
.info-side { display: flex; flex-direction: column; gap: 20px; }

.info-block {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 28px 24px;
  border: 1px solid var(--card-border);

  h4 { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 16px; }
}

.info-icon-badge {
  width: 40px; height: 40px;
  border-radius: 10px;
  background: var(--icon-badge-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  color: var(--icon-badge-color);
}

/* Hours */
.hours {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    font-size: 0.87rem;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--hours-border);

    &:last-child { border: none; }
  }

  .hours-val { font-weight: 600; color: var(--text-primary); }
  .closed { color: var(--text-muted); }
}

.tz { display: block; margin-top: 8px; font-size: 0.75rem; color: var(--text-muted); }

/* Location */
.location-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 6px;
}

.location-extra {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

/* Socials — compact row */
.socials-row {
  display: flex;
  gap: 8px;
}

.social-btn {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--social-bg);
  color: var(--social-color);
  text-decoration: none;
  transition: background 0.25s, color 0.25s, transform 0.25s;

  &:hover {
    background: var(--c);
    color: #fff;
    transform: translateY(-3px);
  }
}

/* ===== LOCATION + MAP ===== */
.location-section { padding: 0 0 100px; }

.location-card {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  background: var(--card-bg);
  border-radius: 20px;
  border: 1px solid var(--card-border);
  overflow: hidden;
}

.location-info {
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  h3 { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0 0 16px; }
}

.map-wrap {
  min-height: 320px;

  iframe {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.dark .map-wrap iframe {
  filter: invert(0.9) hue-rotate(180deg);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 960px) {
  .contact-hero { padding: 130px 0 100px; }
  .contact-hero h1 { font-size: 2.8rem; }
  .channels-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
  .form-layout { grid-template-columns: 1fr; }
  .location-card { grid-template-columns: 1fr; }
  .map-wrap { min-height: 260px; }
}

@media (max-width: 600px) {
  .contact-hero { padding: 110px 0 80px; }
  .contact-hero h1 { font-size: 2rem; }
  .hero-sub { font-size: 0.95rem; }
  .row-2 { grid-template-columns: 1fr; }
  .form-card { padding: 28px 20px; }
  .map-wrap { min-height: 200px; }
}
</style>
