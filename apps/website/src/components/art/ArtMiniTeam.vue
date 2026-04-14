<template>
  <div class="mini-team">
    <div class="mt-row">
      <div class="mt-av c0" /><div class="mt-line-h" /><div class="mt-av c1" />
    </div>
    <div class="mt-mid">
      <div class="mt-line-v" /><div /><div class="mt-line-v" />
    </div>
    <div class="mt-row">
      <div class="mt-av c2" /><div class="mt-line-h" /><div class="mt-av c3" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.mini-team { display: flex; flex-direction: column; align-items: center; padding: 24px; }
.mt-row { display: flex; align-items: center; }
.mt-av {
  width: 36px; height: 36px; border-radius: 50%;
  &.c0 { background: linear-gradient(135deg, #7c3aed, #6366f1); }
  &.c1 { background: linear-gradient(135deg, #3b82f6, #06b6d4); }
  &.c2 { background: linear-gradient(135deg, #10b981, #059669); }
  &.c3 { background: linear-gradient(135deg, #f59e0b, #ef4444); }
}
.mt-line-h { width: 28px; height: 2px; background: var(--art-line); }
.mt-mid {
  display: flex;
  width: calc(36px + 28px + 36px);
  justify-content: space-between;
  padding: 0 17px;
}
.mt-line-v { width: 2px; height: 20px; background: var(--art-line); }
</style>
