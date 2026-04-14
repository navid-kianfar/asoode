<template>
  <div class="mini-files">
    <div v-for="f in files" :key="f.ext" :class="['mf-file', f.cls]">
      <div class="mf-fold" />
      <span>{{ f.ext }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const files = [
  { ext: 'DOC', cls: 'doc' }, { ext: 'IMG', cls: 'img' }, { ext: 'XLS', cls: 'xls' },
  { ext: 'PDF', cls: 'pdf' }, { ext: 'ZIP', cls: 'zip' }, { ext: 'PPT', cls: 'ppt' },
]
</script>

<style scoped lang="scss">
.mini-files { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 16px 20px; width: 100%; }
.mf-file {
  position: relative;
  height: 44px; border-radius: 8px;
  display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: 6px;
  border: 1px solid var(--art-border);
  background: var(--art-card);
  span { font-size: 0.55rem; font-weight: 700; color: var(--art-text-muted); }
  &.doc { border-top: 3px solid #3b82f6; }
  &.img { border-top: 3px solid #10b981; }
  &.xls { border-top: 3px solid #059669; }
  &.pdf { border-top: 3px solid #ef4444; }
  &.zip { border-top: 3px solid #f59e0b; }
  &.ppt { border-top: 3px solid #ec4899; }
}
.mf-fold {
  position: absolute; top: -1px; right: -1px;
  width: 12px; height: 12px;
  background: var(--art-bg);
  border-bottom-left-radius: 4px;
  border-left: 1px solid var(--art-border);
  border-bottom: 1px solid var(--art-border);
}
</style>
