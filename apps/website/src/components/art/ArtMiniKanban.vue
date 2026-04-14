<template>
  <div class="mini-kanban">
    <div v-for="(n, ci) in [3, 2, 1]" :key="ci" class="mk-col">
      <div :class="['mk-header', `c${ci}`]" />
      <div v-for="j in n" :key="j" class="mk-card" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.mini-kanban { display: flex; gap: 8px; padding: 20px 24px; width: 100%; }
.mk-col { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.mk-header {
  height: 4px; border-radius: 2px;
  &.c0 { background: linear-gradient(90deg, #7c3aed, #a78bfa); }
  &.c1 { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  &.c2 { background: linear-gradient(90deg, #10b981, #34d399); }
}
.mk-card { height: 28px; border-radius: 6px; background: var(--art-card); border: 1px solid var(--art-border); }
</style>
