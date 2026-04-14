<template>
  <div class="sart">
    <div class="sart-bar"><div class="sart-dots"><i /><i /><i /></div></div>
    <div class="sart-body">
      <div class="ss-title-line" />
      <div class="ss-members">
        <div class="ss-av a0" />
        <div class="ss-av a1" />
        <div class="ss-av a2" />
        <div class="ss-add">+</div>
      </div>
      <div class="ss-fields">
        <div class="ss-field" />
        <div class="ss-field short" />
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
.ss-title-line { height: 8px; width: 60%; border-radius: 4px; background: var(--art-elem); margin-bottom: 14px; }
.ss-members { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.ss-av {
  width: 32px; height: 32px; border-radius: 50%;
  &.a0 { background: linear-gradient(135deg, #7c3aed, #6366f1); }
  &.a1 { background: linear-gradient(135deg, #3b82f6, #06b6d4); }
  &.a2 { background: linear-gradient(135deg, #10b981, #059669); }
}
.ss-add {
  width: 32px; height: 32px; border-radius: 50%;
  border: 2px dashed var(--art-line);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 600; color: var(--art-text-muted);
}
.ss-fields { display: flex; flex-direction: column; gap: 6px; }
.ss-field {
  height: 8px; border-radius: 4px; background: var(--art-elem);
  &.short { width: 50%; }
}
</style>
