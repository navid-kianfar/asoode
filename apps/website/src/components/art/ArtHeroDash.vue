<template>
  <div class="dash">
    <div class="dash-bar">
      <div class="dash-dots"><i /><i /><i /></div>
      <span>Asoode</span>
    </div>
    <div class="dash-body">
      <div class="dash-side">
        <div class="dash-nav on" />
        <div class="dash-nav" />
        <div class="dash-nav" />
        <div class="dash-nav" />
        <div class="dash-nav" />
      </div>
      <div class="dash-main">
        <div class="dash-stats">
          <div class="dash-st"><b>24</b><div class="dash-st-bar w75" /></div>
          <div class="dash-st"><b>12</b><div class="dash-st-bar w50" /></div>
          <div class="dash-st"><b>87%</b><div class="dash-st-bar w87" /></div>
        </div>
        <div class="dash-kanban">
          <div class="dash-col">
            <div class="dash-ch" /><div class="dash-cd" /><div class="dash-cd" /><div class="dash-cd" />
          </div>
          <div class="dash-col">
            <div class="dash-ch mid" /><div class="dash-cd" /><div class="dash-cd" />
          </div>
          <div class="dash-col">
            <div class="dash-ch done" /><div class="dash-cd" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dash {
  position: relative; z-index: 1;
  background: var(--art-bg);
  border-radius: 16px;
  border: 1px solid var(--art-border);
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,0.2);
  transform: rotateY(-4deg) rotateX(2deg);
  transition: transform 0.6s cubic-bezier(0.22,1,0.36,1);
  &:hover { transform: rotateY(0) rotateX(0); }
}
.dash-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: var(--art-card);
  border-bottom: 1px solid var(--art-border);
  span { font-size: 0.68rem; font-weight: 700; color: var(--art-text-muted); letter-spacing: 0.04em; }
}
.dash-dots {
  display: flex; gap: 5px;
  i {
    display: block; width: 8px; height: 8px; border-radius: 50%;
    &:nth-child(1) { background: #ff5f57; }
    &:nth-child(2) { background: #ffbd2e; }
    &:nth-child(3) { background: #28c840; }
  }
}
.dash-body { display: flex; min-height: 220px; }
.dash-side {
  width: 44px; border-right: 1px solid var(--art-border);
  padding: 10px 6px; display: flex; flex-direction: column; gap: 6px;
}
.dash-nav {
  width: 32px; height: 32px; border-radius: 8px; background: var(--art-elem);
  &.on { background: linear-gradient(135deg, #7c3aed, #6366f1); }
}
.dash-main { flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.dash-stats { display: flex; gap: 6px; }
.dash-st {
  flex: 1; background: var(--art-card); border-radius: 8px; padding: 8px;
  border: 1px solid var(--art-border);
  b { font-size: 0.78rem; color: var(--art-text); display: block; margin-bottom: 4px; }
}
.dash-st-bar {
  height: 3px; border-radius: 2px;
  &.w75 { width: 75%; background: linear-gradient(90deg, #7c3aed, #a78bfa); }
  &.w50 { width: 50%; background: linear-gradient(90deg, #3b82f6, #60a5fa); }
  &.w87 { width: 87%; background: linear-gradient(90deg, #10b981, #34d399); }
}
.dash-kanban { display: flex; gap: 6px; flex: 1; }
.dash-col { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.dash-ch {
  height: 3px; border-radius: 2px;
  background: linear-gradient(90deg, #7c3aed, #a78bfa);
  &.mid { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  &.done { background: linear-gradient(90deg, #10b981, #34d399); }
}
.dash-cd { flex: 1; min-height: 24px; border-radius: 6px; background: var(--art-card); border: 1px solid var(--art-border); }
</style>
