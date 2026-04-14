<template>
  <div class="error-page error-404">
    <!-- Animated background -->
    <div class="error-bg">
      <div class="grid-lines">
        <div v-for="i in 12" :key="i" class="grid-line" :style="{ '--i': i }"></div>
      </div>
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="particles">
        <div v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)"></div>
      </div>
    </div>

    <div class="error-content">
      <!-- Glitch code -->
      <div class="error-code-wrap">
        <span class="error-code" :data-text="errorCode">{{ errorCode }}</span>
      </div>

      <!-- Icon -->
      <div class="error-icon-wrap">
        <div class="icon-ring">
          <div class="icon-ring-inner">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path d="M8 11h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>
        </div>
      </div>

      <h1>{{ errorTitle }}</h1>
      <p class="error-desc">{{ errorDescription }}</p>

      <div class="error-actions">
        <button class="btn-primary" @click="goHome">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
            <path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          </svg>
          Back to Home
        </button>
        <button class="btn-ghost" @click="goBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Go Back
        </button>
      </div>

      <!-- Decorative terminal -->
      <div class="terminal">
        <div class="terminal-bar">
          <span class="terminal-dot" style="background:#ff5f57"></span>
          <span class="terminal-dot" style="background:#ffbd2e"></span>
          <span class="terminal-dot" style="background:#28c840"></span>
          <span class="terminal-title">asoode-debug</span>
        </div>
        <div class="terminal-body">
          <div class="term-line"><span class="term-prompt">$</span> <span class="term-cmd">{{ terminalLine1 }}</span></div>
          <div class="term-line term-error"><span class="term-prompt">!</span> <span>{{ terminalLine2 }}</span></div>
          <div class="term-line"><span class="term-prompt">$</span> <span class="term-cmd term-blink">_</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const errorCode = 404

const errorTitle = 'Page Not Found'
const errorDescription = "The page you're looking for doesn't exist or has been moved. Let's get you back on track."

const terminalLine1 = computed(() => 'curl -I asoode.com' + window.location.pathname)
const terminalLine2 = 'HTTP/1.1 404 — resource not found'

function particleStyle(i: number) {
  const x = Math.random() * 100
  const y = Math.random() * 100
  const size = Math.random() * 3 + 1
  const delay = Math.random() * 6
  const duration = Math.random() * 4 + 4
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}

function goHome() {
  router.push('/')
}

function goBack() {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    router.push('/')
  }
}
</script>

<style scoped lang="scss">
$bg: #07050f;
$purple: #7c3aed;
$blue: #3b82f6;
$pink: #ec4899;
$cyan: #06b6d4;
$text: #e8e6f0;
$text-muted: #706d82;

.error-page {
  min-height: 100vh;
  background: $bg;
  color: $text;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 40px 24px;
}

// Background
.error-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.grid-lines {
  position: absolute;
  inset: 0;
  overflow: hidden;

  .grid-line {
    position: absolute;
    left: calc(var(--i) * 8.33%);
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(255, 255, 255, 0.02);

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 200px;
      background: linear-gradient(180deg, transparent, rgba(124, 58, 237, 0.08), transparent);
      animation: scanline 8s ease-in-out infinite;
      animation-delay: calc(var(--i) * 0.5s);
    }
  }
}

@keyframes scanline {
  0%, 100% { transform: translateY(-200px); }
  50% { transform: translateY(calc(100vh + 200px)); }
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
}

.error-404 .orb-1 {
  width: 500px; height: 500px;
  top: -150px; left: -100px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 70%);
  animation: float1 12s ease-in-out infinite;
}
.error-404 .orb-2 {
  width: 400px; height: 400px;
  bottom: -100px; right: -80px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.15), transparent 70%);
  animation: float2 15s ease-in-out infinite;
}

@keyframes float1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -40px) scale(1.05); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-25px, 30px) scale(1.08); }
}

.particles .particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(124, 58, 237, 0.4);
  animation: twinkle var(--duration, 4s) ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1); }
}

// Content
.error-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 560px;
  width: 100%;
}

// Error code with glitch
.error-code-wrap {
  margin-bottom: 24px;
}

.error-code {
  font-size: 8rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  background: linear-gradient(135deg, $purple, $blue, $pink);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 4s ease-in-out infinite;
  position: relative;
  display: inline-block;

  &::before,
  &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    background: inherit;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &::before {
    animation: glitch-1 3s infinite linear alternate-reverse;
    clip-path: inset(0 0 65% 0);
  }

  &::after {
    animation: glitch-2 3s infinite linear alternate-reverse;
    clip-path: inset(65% 0 0 0);
  }
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes glitch-1 {
  0%, 95% { transform: translateX(0); }
  96% { transform: translateX(-3px); }
  97% { transform: translateX(3px); }
  98% { transform: translateX(-1px); }
  99% { transform: translateX(2px); }
}

@keyframes glitch-2 {
  0%, 95% { transform: translateX(0); }
  96% { transform: translateX(3px); }
  97% { transform: translateX(-2px); }
  98% { transform: translateX(1px); }
  99% { transform: translateX(-3px); }
}

// Icon ring
.error-icon-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}

.icon-ring {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, $purple, $blue, $cyan, $purple);
  padding: 3px;
  animation: ring-spin 6s linear infinite;
}

.icon-ring-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: $bg;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text;
}

@keyframes ring-spin {
  to { transform: rotate(360deg); }
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.error-desc {
  font-size: 1rem;
  color: $text-muted;
  line-height: 1.7;
  margin: 0 0 36px;
  max-width: 440px;
  margin-left: auto;
  margin-right: auto;
}

// Actions
.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 48px;
}

.btn-primary,
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  border: none;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, $purple, #6525c7);
  color: #fff;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(124, 58, 237, 0.4);
  }
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.05);
  color: $text;
  border: 1px solid rgba(255, 255, 255, 0.08);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
}

// Terminal
.terminal {
  border-radius: 12px;
  overflow: hidden;
  background: #111020;
  border: 1px solid rgba(255, 255, 255, 0.06);
  text-align: left;
  max-width: 460px;
  margin: 0 auto;
}

.terminal-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.terminal-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.terminal-title {
  font-size: 0.72rem;
  color: $text-muted;
  margin-left: 8px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.terminal-body {
  padding: 14px 16px;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.78rem;
  line-height: 1.8;
}

.term-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.term-prompt {
  color: #10b981;
  margin-right: 8px;
  font-weight: 700;
}

.term-cmd {
  color: #94a3b8;
}

.term-error {
  color: #f87171;

  .term-prompt {
    color: #f87171;
  }
}

.term-blink {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

// Responsive
@media (max-width: 600px) {
  .error-code {
    font-size: 5rem;
  }

  h1 {
    font-size: 1.4rem;
  }

  .error-desc {
    font-size: 0.9rem;
  }

  .icon-ring {
    width: 72px;
    height: 72px;

    svg {
      width: 32px;
      height: 32px;
    }
  }

  .terminal {
    font-size: 0.7rem;
  }
}
</style>
