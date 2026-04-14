<template>
  <div class="mini-time">
    <div class="mtime-track" />
    <div class="mtime-progress" />
    <div
      v-for="(d, i) in days"
      :key="d"
      :class="['mtime-dot', { done: i <= 2 }]"
      :style="{ left: `${i * 25}%` }"
    />
    <span
      v-for="(d, i) in days"
      :key="`l-${d}`"
      class="mtime-label"
      :style="{ left: `${i * 25}%` }"
    >{{ d }}</span>
  </div>
</template>

<script setup lang="ts">
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
</script>

<style scoped lang="scss">
.mini-time { position: relative; padding: 40px 28px 36px; width: 100%; }
.mtime-track { height: 4px; border-radius: 2px; background: var(--art-elem); width: 100%; }
.mtime-progress {
  position: absolute; top: 40px; left: 28px;
  height: 4px; border-radius: 2px; width: 50%;
  background: linear-gradient(90deg, #7c3aed, #a78bfa);
}
.mtime-dot {
  position: absolute; top: 36px;
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--art-elem);
  border: 2px solid var(--art-bg);
  transform: translateX(-50%);
  &.done { background: #7c3aed; }
}
.mtime-label {
  position: absolute; top: 56px;
  font-size: 0.6rem; font-weight: 600;
  color: var(--art-text-muted);
  transform: translateX(-50%);
}
</style>
