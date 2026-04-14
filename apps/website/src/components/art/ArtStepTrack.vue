<template>
  <div class="sart">
    <div class="sart-bar"><div class="sart-dots"><i /><i /><i /></div></div>
    <div class="sart-body">
      <div class="strk-top">
        <div class="strk-ring"><span>87%</span></div>
        <div class="strk-stats">
          <div class="strk-mini"><div class="strk-mini-bar g" /><b>24</b></div>
          <div class="strk-mini"><div class="strk-mini-bar b" /><b>12</b></div>
        </div>
      </div>
      <div class="strk-chart">
        <div v-for="(ht, i) in [40, 65, 45, 80, 60, 90, 75]" :key="i" class="strk-bar" :style="{ height: `${ht}%` }" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sart {
  width: 220px; background: var(--art-bg); border-radius: 12px;
  border: 1px solid var(--art-border); overflow: hidden;
}
.sart-bar {
  display: flex; align-items: center; padding: 8px 10px;
  background: var(--art-card); border-bottom: 1px solid var(--art-border);
}
.sart-dots {
  display: flex; gap: 4px;
  i {
    display: block; width: 6px; height: 6px; border-radius: 50%;
    &:nth-child(1) { background: #ff5f57; }
    &:nth-child(2) { background: #ffbd2e; }
    &:nth-child(3) { background: #28c840; }
  }
}
.sart-body { padding: 12px; }
.strk-top { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.strk-ring {
  width: 52px; height: 52px; border-radius: 50%;
  border: 4px solid var(--art-elem);
  border-top-color: #7c3aed; border-right-color: #7c3aed; border-bottom-color: #7c3aed;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  span { font-size: 0.62rem; font-weight: 700; color: var(--art-text); }
}
.strk-stats { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.strk-mini {
  display: flex; align-items: center; gap: 6px;
  b { font-size: 0.6rem; color: var(--art-text-muted); }
}
.strk-mini-bar {
  height: 6px; border-radius: 3px; flex: 1;
  &.g { background: linear-gradient(90deg, #10b981, #34d399); }
  &.b { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
}
.strk-chart { display: flex; gap: 4px; align-items: flex-end; height: 60px; }
.strk-bar {
  flex: 1; border-radius: 3px 3px 0 0;
  background: linear-gradient(180deg, #7c3aed, #a78bfa); opacity: 0.7;
}
</style>
