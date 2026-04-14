<template>
  <div class="api-hub">
    <svg class="hub-svg" viewBox="0 0 320 320" fill="none">
      <circle cx="160" cy="160" :r="radius" class="hub-ring-svg" />
      <line
        v-for="(n, i) in nodes"
        :key="`l-${i}`"
        x1="160" y1="160"
        :x2="String(Math.round(n.x))"
        :y2="String(Math.round(n.y))"
        class="hub-line-svg"
      />
    </svg>
    <div class="hub-center">API</div>
    <div class="hub-pulse p1" />
    <div class="hub-pulse p2" />
    <div
      v-for="(n, i) in nodes"
      :key="`n-${i}`"
      class="hub-node"
      :style="{ left: `${Math.round(n.x)}px`, top: `${Math.round(n.y)}px` }"
    >{{ n.label }}</div>
  </div>
</template>

<script setup lang="ts">
const labels = ['Google OAuth', 'Email', 'Push', 'WebSocket', 'REST API', 'Storage']
const angles = [-90, -30, 30, 90, 150, 210]
const radius = 120
const nodes = labels.map((label, i) => {
  const rad = angles[i] * Math.PI / 180
  return { label, x: 160 + radius * Math.cos(rad), y: 160 + radius * Math.sin(rad) }
})
</script>

<style scoped lang="scss">
.api-hub { position: relative; width: 320px; height: 320px; overflow: hidden; }
.hub-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.hub-ring-svg { fill: none; stroke: var(--art-line); stroke-width: 1.5; stroke-dasharray: 6 4; }
.hub-line-svg { stroke: var(--art-line); stroke-width: 1; opacity: 0.5; }
.hub-center {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 800; font-size: 0.82rem;
  z-index: 3; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
}
.hub-pulse {
  position: absolute; top: 50%; left: 50%;
  width: 64px; height: 64px;
  border-radius: 50%; border: 2px solid rgba(124, 58, 237, 0.3);
  transform: translate(-50%, -50%); z-index: 2;
  &.p1 { animation: hub-ripple 3s ease-out infinite; }
  &.p2 { animation: hub-ripple 3s ease-out 1.5s infinite; }
}
@keyframes hub-ripple {
  0% { width: 64px; height: 64px; opacity: 0.5; }
  100% { width: 200px; height: 200px; opacity: 0; }
}
.hub-node {
  position: absolute; transform: translate(-50%, -50%);
  padding: 8px 14px; background: var(--art-card);
  border: 1px solid var(--art-border); border-radius: 10px;
  font-size: 0.72rem; font-weight: 600; color: var(--art-text);
  white-space: nowrap; z-index: 3;
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover {
    transform: translate(-50%, -50%) scale(1.08);
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  }
}
</style>
