<template>
  <div class="about-page" :class="{ dark: isDark }">
    <!-- ===== HERO ===== -->
    <section class="about-hero">
      <div class="hero-bg">
        <div class="mesh"></div>
        <svg class="dot-matrix" width="100%" height="100%">
          <defs>
            <pattern id="aDots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#aDots)" />
        </svg>
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
      </div>

      <div class="hero-content site-container">
        <div class="badge anim" :class="{ show: heroVisible }">
          <span class="badge-dot"></span>
          {{ $t('about.badge') }}
        </div>
        <h1 class="anim" :class="{ show: heroVisible }" style="transition-delay:.08s">
          {{ $t('about.hero_line1') }}<br />
          <span class="gradient-text">{{ $t('about.hero_line2') }}</span>
        </h1>
        <p class="hero-sub anim" :class="{ show: heroVisible }" style="transition-delay:.16s">
          {{ $t('about.subtitle') }}
        </p>
      </div>

      <svg class="wave" viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
        <path d="M0 80L48 68C96 56 192 32 288 24C384 16 480 24 576 32C672 40 768 48 864 48C960 48 1056 40 1152 36C1248 32 1344 32 1392 32L1440 32V80H0Z" class="wave-fill" />
      </svg>
    </section>

    <!-- ===== MISSION ===== -->
    <section class="mission-section" ref="missionEl">
      <div class="site-container">
        <div class="mission-card anim" :class="{ show: missionVisible }">
          <div class="accent-line"></div>
          <h2>{{ $t('about.mission_title') }}</h2>
          <p>{{ $t('about.mission_text') }}</p>
        </div>
      </div>
    </section>

    <!-- ===== STORY ===== -->
    <section class="story-section" ref="storyEl">
      <div class="site-container">
        <div class="story-layout">
          <div class="story-visual anim" :class="{ show: storyVisible }">
            <div class="timeline-line"></div>
            <div v-for="(milestone, i) in milestones" :key="i" class="milestone" :style="{ transitionDelay: `${i * 0.12}s` }">
              <div class="milestone-dot"></div>
              <div class="milestone-content">
                <span class="milestone-year">{{ milestone.year }}</span>
                <p>{{ $t(milestone.textKey) }}</p>
              </div>
            </div>
          </div>
          <div class="story-text anim" :class="{ show: storyVisible }" style="transition-delay:.1s">
            <div class="section-label">
              <v-icon size="18">mdi-book-open-variant</v-icon>
              {{ $t('about.story_title') }}
            </div>
            <h2>{{ $t('about.story_heading') }}</h2>
            <p>{{ $t('about.story_text') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== WHAT MAKES US DIFFERENT ===== -->
    <section class="diff-section" ref="diffEl">
      <div class="site-container">
        <div class="section-head anim" :class="{ show: diffVisible }">
          <h2>{{ $t('about.different_title') }}</h2>
          <p>{{ $t('about.different_subtitle') }}</p>
        </div>
        <div class="diff-grid">
          <article
            v-for="(d, i) in differentiators"
            :key="d.titleKey"
            class="diff-card anim"
            :class="{ show: diffVisible }"
            :style="{ transitionDelay: `${0.08 + i * 0.08}s` }"
          >
            <div class="diff-icon" :style="{ background: d.gradient }">
              <v-icon size="22" color="white">{{ d.icon }}</v-icon>
            </div>
            <h3>{{ $t(d.titleKey) }}</h3>
            <p>{{ $t(d.descKey) }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ===== VALUES ===== -->
    <section class="values-section" ref="valuesEl">
      <div class="site-container">
        <div class="section-head anim" :class="{ show: valuesVisible }">
          <h2>{{ $t('about.values_title') }}</h2>
        </div>
        <div class="values-grid">
          <article
            v-for="(v, i) in values"
            :key="v.titleKey"
            class="value-card anim"
            :class="{ show: valuesVisible }"
            :style="{ transitionDelay: `${0.06 + i * 0.1}s` }"
          >
            <div class="value-number">{{ String(i + 1).padStart(2, '0') }}</div>
            <h3>{{ $t(v.titleKey) }}</h3>
            <p>{{ $t(v.descKey) }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ===== TEAM ===== -->
    <section class="team-section" ref="teamEl">
      <div class="site-container">
        <div class="section-head anim" :class="{ show: teamVisible }">
          <h2>{{ $t('about.team_title') }}</h2>
          <p>{{ $t('about.team_subtitle') }}</p>
        </div>
        <div class="team-grid">
          <article
            v-for="(m, i) in teamMembers"
            :key="m.nameKey"
            class="member-card anim"
            :class="{ show: teamVisible }"
            :style="{ transitionDelay: `${0.06 + i * 0.08}s` }"
          >
            <div class="member-avatar" :style="{ background: m.gradient }">
              <span>{{ m.initials }}</span>
            </div>
            <h3>{{ $t(m.nameKey) }}</h3>
            <span class="member-role">{{ $t(m.roleKey) }}</span>
            <p class="member-bio">{{ $t(m.bioKey) }}</p>
            <div class="member-socials">
              <a v-for="s in m.socials" :key="s.icon" :href="s.url" :title="s.label" class="member-social">
                <v-icon size="16">{{ s.icon }}</v-icon>
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ===== CTA ===== -->
    <section class="cta-section" ref="ctaEl">
      <div class="site-container">
        <div class="cta-card anim" :class="{ show: ctaVisible }">
          <div class="cta-bg">
            <div class="cta-orb cta-orb-1"></div>
            <div class="cta-orb cta-orb-2"></div>
          </div>
          <div class="cta-content">
            <h2>{{ $t('cta.title') }}</h2>
            <p>{{ $t('cta.subtitle') }}</p>
            <a href="https://app.asoode.com/register" class="cta-btn">
              {{ $t('cta.button') }}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
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

const { t } = useI18n()
const { isDark } = useAppTheme()

onMounted(() => {
  document.title = `${t('about.title')} — Asoode`
})

const milestones = [
  { year: '2020', textKey: 'about.ms1' },
  { year: '2021', textKey: 'about.ms2' },
  { year: '2023', textKey: 'about.ms3' },
  { year: '2024', textKey: 'about.ms4' },
]

const differentiators = [
  { titleKey: 'about.diff1_title', descKey: 'about.diff1_desc', icon: 'mdi-puzzle-outline', gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)' },
  { titleKey: 'about.diff2_title', descKey: 'about.diff2_desc', icon: 'mdi-translate', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
  { titleKey: 'about.diff3_title', descKey: 'about.diff3_desc', icon: 'mdi-sitemap-outline', gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
  { titleKey: 'about.diff4_title', descKey: 'about.diff4_desc', icon: 'mdi-shield-lock-outline', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  { titleKey: 'about.diff5_title', descKey: 'about.diff5_desc', icon: 'mdi-api', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
]

const values = [
  { titleKey: 'about.val1_title', descKey: 'about.val1_desc' },
  { titleKey: 'about.val2_title', descKey: 'about.val2_desc' },
  { titleKey: 'about.val3_title', descKey: 'about.val3_desc' },
  { titleKey: 'about.val4_title', descKey: 'about.val4_desc' },
]

const teamMembers = [
  {
    nameKey: 'about.m1_name', roleKey: 'about.m1_role', bioKey: 'about.m1_bio',
    initials: 'AK', gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)',
    socials: [
      { icon: 'mdi-linkedin', url: '#', label: 'LinkedIn' },
      { icon: 'mdi-twitter', url: '#', label: 'Twitter' },
    ],
  },
  {
    nameKey: 'about.m2_name', roleKey: 'about.m2_role', bioKey: 'about.m2_bio',
    initials: 'SR', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    socials: [
      { icon: 'mdi-linkedin', url: '#', label: 'LinkedIn' },
      { icon: 'mdi-github', url: '#', label: 'GitHub' },
    ],
  },
  {
    nameKey: 'about.m3_name', roleKey: 'about.m3_role', bioKey: 'about.m3_bio',
    initials: 'MH', gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    socials: [
      { icon: 'mdi-linkedin', url: '#', label: 'LinkedIn' },
      { icon: 'mdi-twitter', url: '#', label: 'Twitter' },
    ],
  },
  {
    nameKey: 'about.m4_name', roleKey: 'about.m4_role', bioKey: 'about.m4_bio',
    initials: 'NP', gradient: 'linear-gradient(135deg, #10b981, #059669)',
    socials: [
      { icon: 'mdi-linkedin', url: '#', label: 'LinkedIn' },
      { icon: 'mdi-dribbble', url: '#', label: 'Dribbble' },
    ],
  },
  {
    nameKey: 'about.m5_name', roleKey: 'about.m5_role', bioKey: 'about.m5_bio',
    initials: 'DM', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    socials: [
      { icon: 'mdi-linkedin', url: '#', label: 'LinkedIn' },
      { icon: 'mdi-github', url: '#', label: 'GitHub' },
    ],
  },
  {
    nameKey: 'about.m6_name', roleKey: 'about.m6_role', bioKey: 'about.m6_bio',
    initials: 'LZ', gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    socials: [
      { icon: 'mdi-linkedin', url: '#', label: 'LinkedIn' },
      { icon: 'mdi-twitter', url: '#', label: 'Twitter' },
    ],
  },
]

// Scroll animations
const heroVisible = ref(false)
const missionVisible = ref(false)
const storyVisible = ref(false)
const diffVisible = ref(false)
const valuesVisible = ref(false)
const teamVisible = ref(false)
const ctaVisible = ref(false)

const missionEl = ref<HTMLElement>()
const storyEl = ref<HTMLElement>()
const diffEl = ref<HTMLElement>()
const valuesEl = ref<HTMLElement>()
const teamEl = ref<HTMLElement>()
const ctaEl = ref<HTMLElement>()

onMounted(() => {
  heroVisible.value = true

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        if (entry.target === missionEl.value) missionVisible.value = true
        if (entry.target === storyEl.value) storyVisible.value = true
        if (entry.target === diffEl.value) diffVisible.value = true
        if (entry.target === valuesEl.value) valuesVisible.value = true
        if (entry.target === teamEl.value) teamVisible.value = true
        if (entry.target === ctaEl.value) ctaVisible.value = true
      }
    },
    { threshold: 0.05 },
  )

  ;[missionEl, storyEl, diffEl, valuesEl, teamEl, ctaEl].forEach((el) => {
    if (el.value) observer.observe(el.value)
  })
})
</script>

<style scoped lang="scss">
$purple: #7c3aed;
$purple-dark: #6d28d9;

/* ===== CUSTOM PROPERTIES ===== */
.about-page {
  --page-bg: #f8f7fc;
  --card-bg: #ffffff;
  --card-border: rgba(0,0,0,0.04);
  --text-primary: #1a1a2e;
  --text-secondary: #5a576e;
  --text-muted: #9e9bb0;
  --section-alt: #f1eef8;
  --accent: #{$purple};
  --accent-soft: rgba(124, 58, 237, 0.08);

  &.dark {
    --page-bg: #0f0d1a;
    --card-bg: #161228;
    --card-border: rgba(255,255,255,0.05);
    --text-primary: #e8e6f0;
    --text-secondary: #9e9bb0;
    --text-muted: #706d82;
    --section-alt: #120f20;
    --accent: #a78bfa;
    --accent-soft: rgba(167, 139, 250, 0.1);
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
.about-hero {
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
    radial-gradient(ellipse 50% 60% at 80% 60%, rgba(59, 130, 246, 0.12), transparent),
    radial-gradient(ellipse 40% 40% at 50% 80%, rgba(236, 72, 153, 0.08), transparent);
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
.ring-1 { width: 600px; height: 600px; top: -200px; left: -100px; animation: ring-float 20s ease-in-out infinite; }
.ring-2 { width: 400px; height: 400px; bottom: -100px; right: -50px; animation: ring-float 16s ease-in-out infinite reverse; }

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

.about-hero h1 {
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

/* ===== SECTION UTILITIES ===== */
.section-head {
  text-align: center;
  margin-bottom: 48px;

  h2 {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin: 0 0 12px;
  }

  p {
    font-size: 1rem;
    color: var(--text-secondary);
    max-width: 520px;
    margin: 0 auto;
    line-height: 1.7;
  }
}

.section-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
  margin-bottom: 16px;
}

.accent-line {
  width: 48px;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, $purple, #a78bfa);
  margin-bottom: 20px;
}

/* ===== MISSION ===== */
.mission-section {
  padding: 80px 0 0;
  margin-top: -20px;
  position: relative;
  z-index: 3;
}

.mission-card {
  max-width: 780px;
  margin: 0 auto;
  background: var(--card-bg);
  border-radius: 24px;
  padding: 48px 44px;
  border: 1px solid var(--card-border);

  h2 {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0 0 16px;
  }

  p {
    font-size: 1.05rem;
    color: var(--text-secondary);
    line-height: 1.8;
    margin: 0;
  }
}

/* ===== STORY ===== */
.story-section { padding: 80px 0; }

.story-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}

.story-text {
  h2 {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin: 0 0 16px;
  }

  p {
    font-size: 1rem;
    color: var(--text-secondary);
    line-height: 1.8;
    margin: 0;
  }
}

/* Timeline */
.story-visual {
  position: relative;
  padding-left: 32px;
}

.timeline-line {
  position: absolute;
  left: 7px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: linear-gradient(180deg, var(--accent), rgba(124, 58, 237, 0.1));
  border-radius: 1px;
}

.milestone {
  position: relative;
  padding: 0 0 28px 24px;

  &:last-child { padding-bottom: 0; }
}

.milestone-dot {
  position: absolute;
  left: -28px;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  border: 3px solid var(--page-bg);
  box-shadow: 0 0 0 2px var(--accent);
}

.milestone-year {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 2px 10px;
  border-radius: 6px;
  margin-bottom: 6px;
}

.milestone-content p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* ===== DIFFERENTIATORS ===== */
.diff-section {
  padding: 80px 0;
  background: var(--section-alt);
}

.diff-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.diff-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 32px 28px;
  border: 1px solid var(--card-border);
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s cubic-bezier(0.22,1,0.36,1);

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
  }

  h3 {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 16px 0 8px;
  }

  p {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.65;
    margin: 0;
  }
}

.dark .diff-card:hover { box-shadow: 0 20px 60px rgba(0,0,0,0.3); }

.diff-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== VALUES ===== */
.values-section { padding: 80px 0; }

.values-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.value-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 32px 24px;
  border: 1px solid var(--card-border);
  text-align: center;

  h3 {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 8px;
  }

  p {
    font-size: 0.87rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
  }
}

.value-number {
  font-size: 2.4rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--accent), rgba(124, 58, 237, 0.3));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  margin-bottom: 16px;
}

/* ===== TEAM ===== */
.team-section {
  padding: 80px 0;
  background: var(--section-alt);
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.member-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 36px 28px;
  border: 1px solid var(--card-border);
  text-align: center;
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s cubic-bezier(0.22,1,0.36,1);

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
  }

  h3 {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 16px 0 4px;
  }
}

.dark .member-card:hover { box-shadow: 0 20px 60px rgba(0,0,0,0.3); }

.member-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;

  span {
    font-size: 1.4rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: 0.02em;
  }
}

.member-role {
  display: block;
  font-size: 0.82rem;
  color: var(--accent);
  font-weight: 500;
}

.member-bio {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 12px 0 16px;
}

.member-socials {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.member-social {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  color: var(--accent);
  text-decoration: none;
  transition: background 0.25s, transform 0.25s;

  &:hover {
    background: var(--accent);
    color: #fff;
    transform: translateY(-2px);
  }
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

.cta-bg {
  position: absolute;
  inset: 0;
}

.cta-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}

.cta-orb-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -50px;
  background: rgba(124, 58, 237, 0.25);
}

.cta-orb-2 {
  width: 300px;
  height: 300px;
  bottom: -80px;
  right: -30px;
  background: rgba(59, 130, 246, 0.2);
}

.cta-content {
  position: relative;
  z-index: 2;

  h2 {
    font-size: 2rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
    margin: 0 0 12px;
  }

  p {
    font-size: 1rem;
    color: rgba(255,255,255,0.55);
    max-width: 480px;
    margin: 0 auto 28px;
    line-height: 1.7;
  }
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  text-decoration: none;
  background: linear-gradient(135deg, $purple, $purple-dark);
  transition: box-shadow 0.3s, transform 0.2s;

  &:hover {
    box-shadow: 0 8px 32px rgba(124, 58, 237, 0.45);
    transform: translateY(-2px);
  }
}

.cta-note {
  display: block;
  margin-top: 14px;
  font-size: 0.82rem;
  color: rgba(255,255,255,0.35);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 960px) {
  .about-hero { padding: 130px 0 100px; }
  .about-hero h1 { font-size: 2.8rem; }
  .story-layout { grid-template-columns: 1fr; }
  .story-visual { order: 2; }
  .diff-grid { grid-template-columns: 1fr 1fr; }
  .values-grid { grid-template-columns: 1fr 1fr; }
  .team-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 600px) {
  .about-hero { padding: 110px 0 80px; }
  .about-hero h1 { font-size: 2rem; }
  .hero-sub { font-size: 0.95rem; }
  .mission-card { padding: 32px 24px; }
  .diff-grid { grid-template-columns: 1fr; }
  .values-grid { grid-template-columns: 1fr; }
  .team-grid { grid-template-columns: 1fr; }
  .cta-card { padding: 48px 24px; }
}
</style>
