<template>
  <div class="features-page" :class="{ dark: isDark }">
    <!-- ===== HERO ===== -->
    <section class="features-hero">
      <div class="hero-bg">
        <div class="mesh"></div>
        <svg class="dot-matrix" width="100%" height="100%">
          <defs>
            <pattern id="fDots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fDots)" />
        </svg>
      </div>
      <div class="hero-content site-container">
        <div class="badge anim" :class="{ show: heroVisible }">
          <span class="badge-dot"></span>
          {{ $t('feat.badge') }}
        </div>
        <h1 class="anim" :class="{ show: heroVisible }" style="transition-delay:.08s">
          {{ $t('feat.hero_line1') }}<br />
          <span class="gradient-text">{{ $t('feat.hero_line2') }}</span>
        </h1>
        <p class="hero-sub anim" :class="{ show: heroVisible }" style="transition-delay:.16s">
          {{ $t('feat.hero_sub') }}
        </p>
      </div>
      <svg class="wave" viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
        <path d="M0 80L48 68C96 56 192 32 288 24C384 16 480 24 576 32C672 40 768 48 864 48C960 48 1056 40 1152 36C1248 32 1344 32 1392 32L1440 32V80H0Z" class="wave-fill" />
      </svg>
    </section>

    <!-- ===== FEATURE ROWS ===== -->
    <section
      v-for="(f, idx) in features"
      :key="f.titleKey"
      class="feature-section"
      :class="{ alt: idx % 2 === 1 }"
      :ref="el => setRef(el, idx)"
    >
      <div class="site-container">
        <div class="feature-row" :class="{ reversed: idx % 2 === 1 }">
          <!-- Text side -->
          <div class="feature-text anim" :class="{ show: featureVisible[idx] }">
            <div class="section-label">
              <v-icon size="18">{{ f.icon }}</v-icon>
              {{ $t(f.labelKey) }}
            </div>
            <h2>{{ $t(f.titleKey) }}</h2>
            <p>{{ $t(f.descKey) }}</p>
            <ul class="feature-points">
              <li v-for="p in f.pointKeys" :key="p">
                <v-icon size="16" color="green">mdi-check-circle</v-icon>
                {{ $t(p) }}
              </li>
            </ul>
          </div>
          <!-- CSS Art side -->
          <div class="feature-art anim" :class="{ show: featureVisible[idx] }" style="transition-delay:.12s">
            <component :is="f.artComponent" />
          </div>
        </div>
      </div>
    </section>

    <!-- ===== CTA ===== -->
    <section class="cta-section" ref="ctaEl">
      <div class="site-container">
        <div class="cta-card anim" :class="{ show: ctaVisible }">
          <div class="cta-bg"><div class="cta-orb cta-orb-1"></div><div class="cta-orb cta-orb-2"></div></div>
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
import { ref, reactive, onMounted, defineComponent, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppTheme } from '@/composables/useAppTheme'

const { t } = useI18n()
const { isDark } = useAppTheme()

onMounted(() => {
  document.title = `${t('feat.title')} — Asoode`
})

// CSS Art components — pure CSS illustrations rendered via render functions
const ArtKanban = defineComponent({
  setup() {
    return () => h('div', { class: 'art-kanban' }, [
      h('div', { class: 'kanban-col' }, [
        h('div', { class: 'kanban-header', style: 'background: #7c3aed' }),
        h('div', { class: 'kanban-card' }),
        h('div', { class: 'kanban-card short' }),
        h('div', { class: 'kanban-card' }),
      ]),
      h('div', { class: 'kanban-col' }, [
        h('div', { class: 'kanban-header', style: 'background: #3b82f6' }),
        h('div', { class: 'kanban-card' }),
        h('div', { class: 'kanban-card' }),
      ]),
      h('div', { class: 'kanban-col' }, [
        h('div', { class: 'kanban-header', style: 'background: #10b981' }),
        h('div', { class: 'kanban-card short' }),
        h('div', { class: 'kanban-card' }),
        h('div', { class: 'kanban-card short' }),
        h('div', { class: 'kanban-card' }),
      ]),
    ])
  },
})

const ArtProject = defineComponent({
  setup() {
    return () => h('div', { class: 'art-project' }, [
      h('div', { class: 'proj-bar-group' }, [
        h('div', { class: 'proj-label' }),
        h('div', { class: 'proj-bar', style: 'width:85%;background:linear-gradient(90deg,#7c3aed,#a78bfa)' }),
      ]),
      h('div', { class: 'proj-bar-group' }, [
        h('div', { class: 'proj-label short' }),
        h('div', { class: 'proj-bar', style: 'width:60%;background:linear-gradient(90deg,#3b82f6,#93c5fd)' }),
      ]),
      h('div', { class: 'proj-bar-group' }, [
        h('div', { class: 'proj-label' }),
        h('div', { class: 'proj-bar', style: 'width:45%;background:linear-gradient(90deg,#8b5cf6,#c4b5fd)' }),
      ]),
      h('div', { class: 'proj-bar-group' }, [
        h('div', { class: 'proj-label short' }),
        h('div', { class: 'proj-bar', style: 'width:72%;background:linear-gradient(90deg,#06b6d4,#67e8f9)' }),
      ]),
    ])
  },
})

const ArtTask = defineComponent({
  setup() {
    return () => h('div', { class: 'art-task' }, [
      h('div', { class: 'task-title-bar' }),
      h('div', { class: 'task-body' }, [
        h('div', { class: 'task-line w80' }),
        h('div', { class: 'task-line w60' }),
        h('div', { class: 'task-sep' }),
        h('div', { class: 'task-meta' }, [
          h('div', { class: 'task-avatar' }),
          h('div', { class: 'task-avatar' }),
          h('div', { class: 'task-tag' }),
          h('div', { class: 'task-tag green' }),
        ]),
        h('div', { class: 'task-progress' }, [
          h('div', { class: 'task-progress-fill' }),
        ]),
      ]),
    ])
  },
})

const ArtOrg = defineComponent({
  setup() {
    return () => h('div', { class: 'art-org' }, [
      h('div', { class: 'org-node root' }),
      h('div', { class: 'org-line' }),
      h('div', { class: 'org-row' }, [
        h('div', { class: 'org-node' }),
        h('div', { class: 'org-node' }),
        h('div', { class: 'org-node' }),
      ]),
      h('div', { class: 'org-branches' }),
      h('div', { class: 'org-row bottom' }, [
        h('div', { class: 'org-node small' }),
        h('div', { class: 'org-node small' }),
        h('div', { class: 'org-node small' }),
        h('div', { class: 'org-node small' }),
      ]),
    ])
  },
})

const ArtMessenger = defineComponent({
  setup() {
    return () => h('div', { class: 'art-messenger' }, [
      h('div', { class: 'msg msg-left' }, [
        h('div', { class: 'msg-avatar' }),
        h('div', { class: 'msg-bubble' }, [h('div', { class: 'msg-line' }), h('div', { class: 'msg-line short' })]),
      ]),
      h('div', { class: 'msg msg-right' }, [
        h('div', { class: 'msg-bubble sent' }, [h('div', { class: 'msg-line' })]),
      ]),
      h('div', { class: 'msg msg-left' }, [
        h('div', { class: 'msg-avatar' }),
        h('div', { class: 'msg-bubble' }, [h('div', { class: 'msg-line long' })]),
      ]),
      h('div', { class: 'msg-input' }, [
        h('div', { class: 'msg-input-line' }),
        h('div', { class: 'msg-send-btn' }),
      ]),
    ])
  },
})

const ArtHR = defineComponent({
  setup() {
    return () => h('div', { class: 'art-hr' }, [
      h('div', { class: 'hr-row' }, [
        h('div', { class: 'hr-day active' }),
        h('div', { class: 'hr-day active' }),
        h('div', { class: 'hr-day active' }),
        h('div', { class: 'hr-day active' }),
        h('div', { class: 'hr-day active' }),
        h('div', { class: 'hr-day off' }),
        h('div', { class: 'hr-day off' }),
      ]),
      h('div', { class: 'hr-stat-row' }, [
        h('div', { class: 'hr-stat' }, [
          h('div', { class: 'hr-stat-val' }),
          h('div', { class: 'hr-stat-label' }),
        ]),
        h('div', { class: 'hr-stat' }, [
          h('div', { class: 'hr-stat-val green' }),
          h('div', { class: 'hr-stat-label' }),
        ]),
        h('div', { class: 'hr-stat' }, [
          h('div', { class: 'hr-stat-val orange' }),
          h('div', { class: 'hr-stat-label' }),
        ]),
      ]),
    ])
  },
})

const ArtFiles = defineComponent({
  setup() {
    return () => h('div', { class: 'art-files' }, [
      h('div', { class: 'file-item folder' }),
      h('div', { class: 'file-item folder' }),
      h('div', { class: 'file-item doc' }),
      h('div', { class: 'file-item img' }),
      h('div', { class: 'file-item pdf' }),
      h('div', { class: 'file-item doc' }),
    ])
  },
})

const ArtDashboard = defineComponent({
  setup() {
    return () => h('div', { class: 'art-dashboard' }, [
      h('div', { class: 'dash-stats' }, [
        h('div', { class: 'dash-stat' }),
        h('div', { class: 'dash-stat' }),
        h('div', { class: 'dash-stat' }),
      ]),
      h('div', { class: 'dash-chart' }, [
        h('div', { class: 'chart-bar', style: 'height:40%' }),
        h('div', { class: 'chart-bar', style: 'height:65%' }),
        h('div', { class: 'chart-bar', style: 'height:50%' }),
        h('div', { class: 'chart-bar', style: 'height:80%' }),
        h('div', { class: 'chart-bar', style: 'height:70%' }),
        h('div', { class: 'chart-bar', style: 'height:90%' }),
        h('div', { class: 'chart-bar', style: 'height:60%' }),
      ]),
    ])
  },
})

const ArtGlobal = defineComponent({
  setup() {
    return () => h('div', { class: 'art-global' }, [
      h('div', { class: 'globe' }, [
        h('div', { class: 'globe-line' }),
        h('div', { class: 'globe-line v' }),
        h('div', { class: 'globe-eq' }),
      ]),
      h('div', { class: 'lang-tags' }, [
        h('div', { class: 'lang-tag' }, 'EN'),
        h('div', { class: 'lang-tag fa' }, 'فا'),
        h('div', { class: 'lang-tag' }, 'AR'),
        h('div', { class: 'lang-tag' }, 'TR'),
      ]),
    ])
  },
})

const features = [
  {
    labelKey: 'feat.label_projects', titleKey: 'feat.f1_title', descKey: 'feat.f1_desc', icon: 'mdi-folder-multiple-outline',
    pointKeys: ['feat.f1_p1', 'feat.f1_p2', 'feat.f1_p3', 'feat.f1_p4'],
    artComponent: ArtProject,
  },
  {
    labelKey: 'feat.label_kanban', titleKey: 'feat.f2_title', descKey: 'feat.f2_desc', icon: 'mdi-view-column-outline',
    pointKeys: ['feat.f2_p1', 'feat.f2_p2', 'feat.f2_p3', 'feat.f2_p4'],
    artComponent: ArtKanban,
  },
  {
    labelKey: 'feat.label_tasks', titleKey: 'feat.f3_title', descKey: 'feat.f3_desc', icon: 'mdi-checkbox-marked-circle-outline',
    pointKeys: ['feat.f3_p1', 'feat.f3_p2', 'feat.f3_p3', 'feat.f3_p4'],
    artComponent: ArtTask,
  },
  {
    labelKey: 'feat.label_org', titleKey: 'feat.f4_title', descKey: 'feat.f4_desc', icon: 'mdi-account-group-outline',
    pointKeys: ['feat.f4_p1', 'feat.f4_p2', 'feat.f4_p3', 'feat.f4_p4'],
    artComponent: ArtOrg,
  },
  {
    labelKey: 'feat.label_messenger', titleKey: 'feat.f5_title', descKey: 'feat.f5_desc', icon: 'mdi-chat-outline',
    pointKeys: ['feat.f5_p1', 'feat.f5_p2', 'feat.f5_p3', 'feat.f5_p4'],
    artComponent: ArtMessenger,
  },
  {
    labelKey: 'feat.label_hr', titleKey: 'feat.f6_title', descKey: 'feat.f6_desc', icon: 'mdi-account-clock-outline',
    pointKeys: ['feat.f6_p1', 'feat.f6_p2', 'feat.f6_p3', 'feat.f6_p4'],
    artComponent: ArtHR,
  },
  {
    labelKey: 'feat.label_files', titleKey: 'feat.f7_title', descKey: 'feat.f7_desc', icon: 'mdi-folder-open-outline',
    pointKeys: ['feat.f7_p1', 'feat.f7_p2', 'feat.f7_p3', 'feat.f7_p4'],
    artComponent: ArtFiles,
  },
  {
    labelKey: 'feat.label_dashboard', titleKey: 'feat.f8_title', descKey: 'feat.f8_desc', icon: 'mdi-chart-box-outline',
    pointKeys: ['feat.f8_p1', 'feat.f8_p2', 'feat.f8_p3', 'feat.f8_p4'],
    artComponent: ArtDashboard,
  },
  {
    labelKey: 'feat.label_global', titleKey: 'feat.f9_title', descKey: 'feat.f9_desc', icon: 'mdi-earth',
    pointKeys: ['feat.f9_p1', 'feat.f9_p2', 'feat.f9_p3', 'feat.f9_p4'],
    artComponent: ArtGlobal,
  },
]

// Scroll
const heroVisible = ref(false)
const featureVisible = reactive<boolean[]>(features.map(() => false))
const ctaVisible = ref(false)
const featureEls: HTMLElement[] = []
const ctaEl = ref<HTMLElement>()

function setRef(el: any, idx: number) {
  if (el) featureEls[idx] = el as HTMLElement
}

onMounted(() => {
  heroVisible.value = true
  document.title = `${t('feat.title')} — Asoode`
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        if (e.target === ctaEl.value) { ctaVisible.value = true; continue }
        const idx = featureEls.indexOf(e.target as HTMLElement)
        if (idx !== -1) featureVisible[idx] = true
      }
    },
    { threshold: 0.08 },
  )
  featureEls.forEach((el) => { if (el) observer.observe(el) })
  if (ctaEl.value) observer.observe(ctaEl.value)
})
</script>

<style scoped lang="scss">
$purple: #7c3aed;

.features-page {
  --page-bg: #f8f7fc;
  --card-bg: #ffffff;
  --card-border: rgba(0,0,0,0.04);
  --text-primary: #1a1a2e;
  --text-secondary: #5a576e;
  --text-muted: #9e9bb0;
  --section-alt: #f1eef8;
  --accent: #{$purple};
  --art-bg: #f1eef8;
  --art-elem: rgba(124, 58, 237, 0.1);
  --art-elem2: rgba(59, 130, 246, 0.1);
  --art-card: #ffffff;
  --art-line: rgba(0,0,0,0.06);

  &.dark {
    --page-bg: #0f0d1a;
    --card-bg: #161228;
    --card-border: rgba(255,255,255,0.05);
    --text-primary: #e8e6f0;
    --text-secondary: #9e9bb0;
    --text-muted: #706d82;
    --section-alt: #120f20;
    --accent: #a78bfa;
    --art-bg: #1a1630;
    --art-elem: rgba(167, 139, 250, 0.15);
    --art-elem2: rgba(59, 130, 246, 0.12);
    --art-card: #1e1a30;
    --art-line: rgba(255,255,255,0.06);
  }

  background: var(--page-bg);
  overflow-x: hidden;
}

.anim {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1);
  &.show { opacity: 1; transform: none; }
}

/* ===== HERO ===== */
.features-hero {
  position: relative; background: #0a0818; padding: 160px 0 120px; overflow: hidden; text-align: center; margin-bottom: 10px;
}
.hero-bg { position: absolute; inset: 0; }
.mesh {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 60% 50% at 25% 30%, rgba(124,58,237,0.18), transparent),
    radial-gradient(ellipse 50% 60% at 75% 60%, rgba(59,130,246,0.12), transparent),
    radial-gradient(ellipse 40% 40% at 50% 80%, rgba(236,72,153,0.08), transparent);
}
.dot-matrix { position: absolute; inset: 0; color: rgba(255,255,255,0.04); }
.hero-content { position: relative; z-index: 2; }

.badge {
  display: inline-flex; align-items: center; gap: 10px; padding: 8px 20px 8px 14px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 100px; color: rgba(255,255,255,0.75); font-size: 0.85rem; font-weight: 500;
  backdrop-filter: blur(12px); margin-bottom: 28px;
}
.badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse-dot 2s ease-in-out infinite; }
@keyframes pulse-dot { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); } }

.features-hero h1 { font-size: 3.4rem; font-weight: 800; line-height: 1.12; color: #fff; letter-spacing: -0.03em; margin: 0 0 20px; }
.gradient-text {
  background: linear-gradient(135deg, #c4b5fd 0%, #f0abfc 30%, #93c5fd 60%, #c4b5fd 100%);
  background-size: 300% 100%; -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; animation: shimmer 6s ease-in-out infinite;
}
@keyframes shimmer { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
.hero-sub { font-size: 1.05rem; color: rgba(255,255,255,0.5); line-height: 1.7; max-width: 540px; margin: 0 auto; }

.wave { position: absolute; bottom: -1px; left: 0; width: 100%; height: 60px; z-index: 2; }
.wave-fill { fill: var(--page-bg); }

/* ===== FEATURE ROWS ===== */
.feature-section {
  padding: 80px 0;
  &.alt { background: var(--section-alt); }
}

.feature-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: center;

  &.reversed { direction: rtl; > * { direction: ltr; } }
}

.section-label {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--accent); margin-bottom: 12px;
}

.feature-text {
  h2 { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin: 0 0 14px; }
  > p { font-size: 1rem; color: var(--text-secondary); line-height: 1.8; margin: 0 0 24px; }
}

.feature-points {
  list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px;
  li {
    display: flex; align-items: center; gap: 10px;
    font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;
  }
}

/* CSS Art Container */
.feature-art {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ===== CSS ART ILLUSTRATIONS ===== */

/* Shared art frame */
.feature-art > :deep(*) {
  background: var(--art-bg);
  border-radius: 20px;
  border: 1px solid var(--card-border);
  padding: 32px;
  width: 100%;
  max-width: 420px;
}

/* Kanban Board Art */
:deep(.art-kanban) {
  display: flex;
  gap: 12px;
}
:deep(.kanban-col) {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
:deep(.kanban-header) {
  height: 6px;
  border-radius: 3px;
  opacity: 0.8;
}
:deep(.kanban-card) {
  height: 48px;
  background: var(--art-card);
  border-radius: 8px;
  border: 1px solid var(--art-line);
  &.short { height: 32px; }
}

/* Project / Gantt Art */
:deep(.art-project) {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
:deep(.proj-bar-group) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
:deep(.proj-label) {
  width: 60px;
  height: 8px;
  border-radius: 4px;
  background: var(--art-line);
  &.short { width: 40px; }
}
:deep(.proj-bar) {
  height: 24px;
  border-radius: 6px;
  opacity: 0.85;
}

/* Task Detail Art */
:deep(.art-task) {
  display: flex;
  flex-direction: column;
}
:deep(.task-title-bar) {
  height: 12px;
  width: 60%;
  border-radius: 6px;
  background: var(--art-elem);
  margin-bottom: 16px;
}
:deep(.task-body) {
  background: var(--art-card);
  border-radius: 12px;
  border: 1px solid var(--art-line);
  padding: 20px;
}
:deep(.task-line) {
  height: 8px;
  border-radius: 4px;
  background: var(--art-line);
  margin-bottom: 8px;
  &.w80 { width: 80%; }
  &.w60 { width: 60%; }
}
:deep(.task-sep) {
  height: 1px;
  background: var(--art-line);
  margin: 12px 0;
}
:deep(.task-meta) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
:deep(.task-avatar) {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--art-elem);
}
:deep(.task-tag) {
  height: 20px;
  width: 48px;
  border-radius: 4px;
  background: var(--art-elem2);
  &.green { background: rgba(16, 185, 129, 0.15); }
}
:deep(.task-progress) {
  height: 6px;
  border-radius: 3px;
  background: var(--art-line);
  overflow: hidden;
}
:deep(.task-progress-fill) {
  width: 65%;
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #7c3aed, #a78bfa);
}

/* Org Chart Art */
:deep(.art-org) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
:deep(.org-node) {
  width: 56px;
  height: 28px;
  border-radius: 8px;
  background: var(--art-elem);
  border: 1.5px solid var(--accent);
  &.root { width: 72px; height: 32px; background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.2)); }
  &.small { width: 44px; height: 22px; border-color: var(--art-line); }
}
:deep(.org-line) {
  width: 2px;
  height: 16px;
  background: var(--art-line);
}
:deep(.org-row) {
  display: flex;
  gap: 20px;
  &.bottom { gap: 12px; }
}
:deep(.org-branches) {
  width: 200px;
  height: 2px;
  background: var(--art-line);
  position: relative;
  &::before, &::after {
    content: '';
    position: absolute;
    width: 2px;
    height: 16px;
    background: var(--art-line);
    top: 0;
  }
  &::before { left: 0; }
  &::after { right: 0; }
}

/* Messenger Art */
:deep(.art-messenger) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
:deep(.msg) {
  display: flex;
  gap: 8px;
  &.msg-right { justify-content: flex-end; }
}
:deep(.msg-avatar) {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--art-elem);
  flex-shrink: 0;
}
:deep(.msg-bubble) {
  padding: 12px 16px;
  border-radius: 14px 14px 14px 4px;
  background: var(--art-card);
  border: 1px solid var(--art-line);
  max-width: 70%;
  &.sent {
    border-radius: 14px 14px 4px 14px;
    background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(99,102,241,0.08));
    border-color: rgba(124,58,237,0.15);
  }
}
:deep(.msg-line) {
  height: 6px;
  width: 120px;
  border-radius: 3px;
  background: var(--art-line);
  & + & { margin-top: 6px; }
  &.short { width: 80px; }
  &.long { width: 160px; }
}
:deep(.msg-input) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--art-card);
  border: 1px solid var(--art-line);
}
:deep(.msg-input-line) {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--art-line);
}
:deep(.msg-send-btn) {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  flex-shrink: 0;
}

/* HR Art */
:deep(.art-hr) {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
:deep(.hr-row) {
  display: flex;
  gap: 6px;
}
:deep(.hr-day) {
  flex: 1;
  height: 36px;
  border-radius: 8px;
  background: var(--art-card);
  border: 1px solid var(--art-line);
  &.active { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.25); }
  &.off { background: rgba(239, 68, 68, 0.06); border-color: rgba(239, 68, 68, 0.12); }
}
:deep(.hr-stat-row) {
  display: flex;
  gap: 12px;
}
:deep(.hr-stat) {
  flex: 1;
  background: var(--art-card);
  border-radius: 10px;
  border: 1px solid var(--art-line);
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
:deep(.hr-stat-val) {
  width: 48px;
  height: 18px;
  border-radius: 4px;
  background: var(--art-elem);
  &.green { background: rgba(16, 185, 129, 0.15); }
  &.orange { background: rgba(245, 158, 11, 0.15); }
}
:deep(.hr-stat-label) {
  width: 64px;
  height: 6px;
  border-radius: 3px;
  background: var(--art-line);
}

/* Files Art */
:deep(.art-files) {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
:deep(.file-item) {
  aspect-ratio: 1;
  border-radius: 12px;
  background: var(--art-card);
  border: 1px solid var(--art-line);
  position: relative;
  &.folder { background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.15); }
  &.doc { background: rgba(59, 130, 246, 0.06); border-color: rgba(59, 130, 246, 0.12); }
  &.img { background: rgba(124, 58, 237, 0.06); border-color: rgba(124, 58, 237, 0.12); }
  &.pdf { background: rgba(239, 68, 68, 0.06); border-color: rgba(239, 68, 68, 0.12); }
}

/* Dashboard Art */
:deep(.art-dashboard) {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
:deep(.dash-stats) {
  display: flex;
  gap: 10px;
}
:deep(.dash-stat) {
  flex: 1;
  height: 52px;
  border-radius: 10px;
  background: var(--art-card);
  border: 1px solid var(--art-line);
}
:deep(.dash-chart) {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 120px;
  padding: 12px;
  border-radius: 12px;
  background: var(--art-card);
  border: 1px solid var(--art-line);
}
:deep(.chart-bar) {
  flex: 1;
  border-radius: 6px 6px 3px 3px;
  background: linear-gradient(180deg, #7c3aed, #a78bfa);
  opacity: 0.7;
}

/* Globe Art */
:deep(.art-global) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
:deep(.globe) {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  position: relative;
  opacity: 0.6;
}
:deep(.globe-line) {
  position: absolute;
  inset: 15%;
  border: 1.5px solid var(--accent);
  border-radius: 50%;
  &.v { transform: scaleX(0.5); }
}
:deep(.globe-eq) {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1.5px;
  background: var(--accent);
  transform: translateY(-50%);
}
:deep(.lang-tags) {
  display: flex;
  gap: 8px;
}
:deep(.lang-tag) {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  background: var(--art-elem);
  color: var(--accent);
  &.fa { direction: rtl; }
}

/* ===== CTA ===== */
.cta-section { padding: 0 0 100px; }
.cta-card { position: relative; border-radius: 24px; overflow: hidden; padding: 72px 40px; text-align: center; background: #0a0818; }
.cta-bg { position: absolute; inset: 0; }
.cta-orb { position: absolute; border-radius: 50%; filter: blur(80px); }
.cta-orb-1 { width: 400px; height: 400px; top: -100px; left: -50px; background: rgba(124,58,237,0.25); }
.cta-orb-2 { width: 300px; height: 300px; bottom: -80px; right: -30px; background: rgba(59,130,246,0.2); }
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
  &:hover { box-shadow: 0 8px 32px rgba(124,58,237,0.45); transform: translateY(-2px); }
}
.cta-note { display: block; margin-top: 14px; font-size: 0.82rem; color: rgba(255,255,255,0.35); }

/* ===== RESPONSIVE ===== */
@media (max-width: 960px) {
  .features-hero { padding: 130px 0 100px; }
  .features-hero h1 { font-size: 2.6rem; }
  .feature-row { grid-template-columns: 1fr; gap: 32px; &.reversed { direction: ltr; } }
  .feature-art { order: -1; }
}

@media (max-width: 600px) {
  .features-hero { padding: 110px 0 80px; }
  .features-hero h1 { font-size: 2rem; }
  .hero-sub { font-size: 0.95rem; }
  .feature-section { padding: 48px 0; }
  .cta-card { padding: 48px 24px; }
}
</style>
