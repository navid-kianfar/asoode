<template>
  <div class="mini-project">
    <div v-for="(w, i) in [85, 60, 75, 40]" :key="i" class="mp-row">
      <div :class="['mp-bar', `c${i}`]" :style="{ width: `${w}%` }" />
      <span>{{ w }}%</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mini-project { padding: 20px 24px; width: 100%; }
.mp-row {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px;
  &:last-child { margin-bottom: 0; }
  span { font-size: 0.65rem; font-weight: 600; color: var(--art-text-muted); width: 28px; text-align: right; }
}
.mp-bar {
  height: 10px; border-radius: 5px;
  transition: width 0.6s cubic-bezier(0.22,1,0.36,1);
  &.c0 { background: linear-gradient(90deg, #7c3aed, #a78bfa); }
  &.c1 { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
  &.c2 { background: linear-gradient(90deg, #10b981, #34d399); }
  &.c3 { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
}
</style>
