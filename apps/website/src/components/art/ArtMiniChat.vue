<template>
  <div class="mini-chat">
    <div class="mc-row left">
      <div class="mc-avatar a1">A</div>
      <div class="mc-bubble left">
        <div class="mc-line w80" />
        <div class="mc-line w55" />
      </div>
    </div>
    <div class="mc-row right">
      <div class="mc-bubble right">
        <div class="mc-line w65" />
      </div>
      <div class="mc-avatar a2">B</div>
    </div>
    <div class="mc-row left">
      <div class="mc-avatar a1">A</div>
      <div class="mc-bubble left">
        <div class="mc-line w45" />
        <div class="mc-typing">
          <span /><span /><span />
        </div>
      </div>
    </div>
    <div class="mc-bar">
      <div class="mc-field" />
      <div class="mc-send">
        <svg viewBox="0 0 20 20" fill="none" width="12" height="12">
          <path d="M3 10l7-7 7 7M10 3v14" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-45 10 10)" />
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mini-chat {
  padding: 14px 18px; width: 100%;
  display: flex; flex-direction: column; gap: 8px;
}
.mc-row {
  display: flex; align-items: flex-end; gap: 6px;
  &.right { justify-content: flex-end; }
}
.mc-avatar {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.5rem; font-weight: 700; color: #fff;
  &.a1 { background: linear-gradient(135deg, #7c3aed, #6366f1); }
  &.a2 { background: linear-gradient(135deg, #3b82f6, #06b6d4); }
}
.mc-bubble {
  max-width: 65%; padding: 8px 12px; border-radius: 12px;
  display: flex; flex-direction: column; gap: 4px;
  &.left {
    background: var(--art-card); border: 1px solid var(--art-border);
    border-bottom-left-radius: 4px;
  }
  &.right {
    background: linear-gradient(135deg, #7c3aed, #6366f1);
    border-bottom-right-radius: 4px;
  }
}
.mc-line {
  height: 5px; border-radius: 3px; background: var(--art-elem);
  &.w80 { width: 80%; }
  &.w65 { width: 65%; }
  &.w55 { width: 55%; }
  &.w45 { width: 45%; }
}
.mc-bubble.right .mc-line { background: rgba(255,255,255,0.25); }
.mc-typing {
  display: flex; gap: 3px; padding: 2px 0;
  span {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--art-text-muted); opacity: 0.5;
    animation: typing 1.4s ease-in-out infinite;
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}
@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}
.mc-bar { display: flex; gap: 6px; margin-top: 2px; }
.mc-field {
  flex: 1; height: 22px; border-radius: 11px;
  background: var(--art-card); border: 1px solid var(--art-border);
}
.mc-send {
  width: 22px; height: 22px; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  display: flex; align-items: center; justify-content: center;
}
</style>
