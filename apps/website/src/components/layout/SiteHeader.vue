<template>
  <header class="site-header" :class="{ scrolled }">
    <div class="site-container header-inner">
      <!-- Logo -->
      <router-link :to="localePath('/')" class="logo-link" aria-label="Asoode Home">
        <img
          :src="isDark ? '/images/logo-dark.svg' : '/images/logo-colored.svg'"
          alt="Asoode"
          class="logo-icon"
          height="36"
        />
        <span class="logo-text">Asoode</span>
      </router-link>

      <!-- Desktop Nav -->
      <nav class="desktop-nav">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="nav-link"
        >
          {{ link.label }}
        </router-link>
      </nav>

      <!-- Desktop Right Actions -->
      <div class="header-actions">
        <!-- Language Selector -->
        <div class="lang-wrap" v-click-outside="() => (langOpen = false)">
          <button class="icon-btn" @click="langOpen = !langOpen" :aria-label="'Language'">
            <v-icon size="18">mdi-translate</v-icon>
            <span class="lang-code">{{ locale.toUpperCase() }}</span>
            <v-icon size="14" class="chevron" :class="{ open: langOpen }">mdi-chevron-down</v-icon>
          </button>
          <Transition name="dropdown">
            <div v-if="langOpen" class="lang-dropdown">
              <router-link
                v-for="loc in availableLocales"
                :key="loc.code"
                :to="switchLocalePath(loc.code)"
                class="lang-option"
                :class="{ active: loc.code === locale }"
                @click="langOpen = false"
              >
                {{ loc.name }}
              </router-link>
            </div>
          </Transition>
        </div>

        <!-- Theme Toggle -->
        <button class="icon-btn theme-toggle" @click="toggleTheme" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <Transition name="theme-icon" mode="out-in">
            <v-icon v-if="isDark" key="sun" size="18">mdi-white-balance-sunny</v-icon>
            <v-icon v-else key="moon" size="18">mdi-weather-night</v-icon>
          </Transition>
        </button>

        <!-- Auth Buttons -->
        <a href="https://app.asoode.com/login" class="btn-ghost">{{ $t('nav.login') }}</a>
        <a href="https://app.asoode.com/register" class="btn-primary">{{ $t('nav.signup') }}</a>
      </div>

      <!-- Mobile Toggle -->
      <div class="mobile-actions">
        <button class="icon-btn theme-toggle" @click="toggleTheme" aria-label="Toggle theme">
          <v-icon size="18">{{ isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
        </button>
        <button class="hamburger" :class="{ active: drawer }" @click="drawer = !drawer" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <Transition name="drawer">
      <div v-if="drawer" class="mobile-drawer">
        <nav class="drawer-nav">
          <router-link
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="drawer-link"
            @click="drawer = false"
          >
            {{ link.label }}
          </router-link>
        </nav>

        <div class="drawer-divider"></div>

        <!-- Language in drawer -->
        <div class="drawer-section-title">Language</div>
        <div class="drawer-langs">
          <router-link
            v-for="loc in availableLocales"
            :key="loc.code"
            :to="switchLocalePath(loc.code)"
            class="drawer-lang"
            :class="{ active: loc.code === locale }"
            @click="drawer = false"
          >
            {{ loc.name }}
          </router-link>
        </div>

        <div class="drawer-divider"></div>

        <div class="drawer-auth">
          <a href="https://app.asoode.com/login" class="btn-ghost full">{{ $t('nav.login') }}</a>
          <a href="https://app.asoode.com/register" class="btn-primary full">{{ $t('nav.signup') }}</a>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppTheme } from '@/composables/useAppTheme'
import { useLocalePath, useSwitchLocalePath } from '@/composables/useLocalePath'
import { LOCALES } from '@/i18n'

const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localePath = useLocalePath()
const { isDark, toggle: toggleTheme } = useAppTheme()

const drawer = ref(false)
const langOpen = ref(false)
const scrolled = ref(false)

const navLinks = computed(() => [
  { to: localePath('/features'), label: t('nav.features') },
  { to: localePath('/pricing'), label: t('nav.pricing') },
  { to: localePath('/docs'), label: t('nav.docs') },
  { to: localePath('/about'), label: t('nav.about') },
  { to: localePath('/contact'), label: t('nav.contact') },
])

const availableLocales = LOCALES.map((l) => ({
  code: l.code,
  name: l.name,
}))

const vClickOutside = {
  mounted(el: HTMLElement, binding: { value: () => void }) {
    (el as any).__clickOutside = (e: Event) => {
      if (!el.contains(e.target as Node)) binding.value()
    }
    document.addEventListener('click', (el as any).__clickOutside)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', (el as any).__clickOutside)
  },
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

function onScroll() {
  scrolled.value = window.scrollY > 10
}
</script>

<style scoped lang="scss">
$header-h: 64px;
$primary-light: #6b3d8d;
$primary-dark: #59a8ef;

.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: $header-h;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid transparent;
  transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;

  &.scrolled {
    border-bottom-color: rgba(0, 0, 0, 0.06);
    box-shadow: 0 1px 12px rgba(0, 0, 0, 0.04);
  }
}

[data-theme='dark'] .site-header {
  background: rgba(15, 13, 26, 0.85);

  &.scrolled {
    border-bottom-color: rgba(255, 255, 255, 0.06);
    box-shadow: 0 1px 12px rgba(0, 0, 0, 0.2);
  }
}

.header-inner {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 8px;
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
  margin-right: 16px;
  gap: 8px;
}

.logo-icon {
  display: block;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #6b3d8d;
  letter-spacing: -0.01em;
}

[data-theme='dark'] .logo-text {
  color: #59a8ef;
}

/* Desktop Nav */
.desktop-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: auto;

  @media (max-width: 960px) {
    display: none;
  }
}

.nav-link {
  padding: 6px 14px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #5a576e;
  text-decoration: none;
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;

  &:hover,
  &.router-link-active {
    color: $primary-light;
    background: rgba(107, 61, 141, 0.06);
  }
}

[data-theme='dark'] .nav-link {
  color: #b0adc0;

  &:hover,
  &.router-link-active {
    color: $primary-dark;
    background: rgba(89, 168, 239, 0.08);
  }
}

/* Right actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;

  @media (max-width: 960px) {
    display: none;
  }
}

.mobile-actions {
  display: none;
  align-items: center;
  gap: 4px;
  margin-left: auto;

  @media (max-width: 960px) {
    display: flex;
  }
}

/* Icon Button */
.icon-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #5a576e;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  font-family: inherit;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

[data-theme='dark'] .icon-btn {
  color: #b0adc0;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
}

.lang-code {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.chevron {
  transition: transform 0.2s;

  &.open {
    transform: rotate(180deg);
  }
}

/* Theme Toggle */
.theme-toggle {
  padding: 7px;

  .theme-icon-enter-active,
  .theme-icon-leave-active {
    transition: transform 0.25s, opacity 0.2s;
  }

  .theme-icon-enter-from {
    transform: rotate(-90deg) scale(0);
    opacity: 0;
  }

  .theme-icon-leave-to {
    transform: rotate(90deg) scale(0);
    opacity: 0;
  }
}

/* Language Dropdown */
.lang-wrap {
  position: relative;
}

.lang-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 140px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 10;
}

[data-theme='dark'] .lang-dropdown {
  background: #1a1726;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.lang-option {
  display: block;
  padding: 10px 16px;
  font-size: 0.87rem;
  color: #5a576e;
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  &.active {
    font-weight: 600;
    color: $primary-light;
  }
}

[data-theme='dark'] .lang-option {
  color: #b0adc0;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  &.active {
    color: $primary-dark;
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Auth Buttons */
.btn-ghost,
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
  font-family: inherit;
  border: none;
  cursor: pointer;
}

.btn-ghost {
  color: #5a576e;
  background: transparent;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: $primary-light;
  }
}

[data-theme='dark'] .btn-ghost {
  color: #b0adc0;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    color: $primary-dark;
  }
}

.btn-primary {
  color: #fff;
  background: $primary-light;

  &:hover {
    background: #5a3078;
    box-shadow: 0 4px 16px rgba(107, 61, 141, 0.3);
    transform: translateY(-1px);
  }
}

[data-theme='dark'] .btn-primary {
  background: $primary-dark;
  color: #0f0d1a;

  &:hover {
    box-shadow: 0 4px 16px rgba(89, 168, 239, 0.3);
  }
}

/* Hamburger */
.hamburger {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;

  span {
    display: block;
    width: 20px;
    height: 2px;
    background: #5a576e;
    border-radius: 2px;
    transition: transform 0.3s, opacity 0.3s;
  }

  &.active {
    span:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }

    span:nth-child(2) {
      opacity: 0;
    }

    span:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }
  }
}

[data-theme='dark'] .hamburger span {
  background: #b0adc0;
}

/* Mobile Drawer */
.mobile-drawer {
  position: fixed;
  top: $header-h;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  padding: 16px 24px 32px;
  overflow-y: auto;
  z-index: 99;
}

[data-theme='dark'] .mobile-drawer {
  background: #0f0d1a;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.drawer-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.drawer-link {
  display: block;
  padding: 12px 16px;
  font-size: 1rem;
  font-weight: 500;
  color: #3a3750;
  text-decoration: none;
  border-radius: 10px;
  transition: background 0.15s;

  &:hover,
  &.router-link-active {
    background: rgba(107, 61, 141, 0.06);
    color: $primary-light;
  }
}

[data-theme='dark'] .drawer-link {
  color: #d0cee0;

  &:hover,
  &.router-link-active {
    background: rgba(89, 168, 239, 0.08);
    color: $primary-dark;
  }
}

.drawer-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 12px 0;
}

[data-theme='dark'] .drawer-divider {
  background: rgba(255, 255, 255, 0.06);
}

.drawer-section-title {
  padding: 4px 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9e9bb0;
}

.drawer-langs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px;
}

.drawer-lang {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #5a576e;
  text-decoration: none;
  background: rgba(0, 0, 0, 0.03);
  transition: background 0.15s;

  &.active {
    background: rgba(107, 61, 141, 0.1);
    color: $primary-light;
    font-weight: 600;
  }
}

[data-theme='dark'] .drawer-lang {
  color: #b0adc0;
  background: rgba(255, 255, 255, 0.04);

  &.active {
    background: rgba(89, 168, 239, 0.12);
    color: $primary-dark;
  }
}

.drawer-auth {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

.full {
  width: 100%;
  text-align: center;
  padding: 12px 16px;
}
</style>
