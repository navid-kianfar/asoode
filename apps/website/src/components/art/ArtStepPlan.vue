<template>
  <div class="sart">
    <div class="sart-bar"><div class="sart-dots"><i /><i /><i /></div></div>
    <div class="sart-body">
      <div class="sp-title-line" />
      <div
        v-for="(item, i) in items"
        :key="i"
        :class="['sp-item', { done: item.done }]"
        :style="{ paddingLeft: `${12 + item.indent * 16}px` }"
      >
        <div class="sp-check" />
        <div class="sp-text" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const items = [
  { indent: 0, done: true }, { indent: 1, done: true },
  { indent: 1, done: false }, { indent: 0, done: false }, { indent: 1, done: false },
]
</script>

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
.sp-title-line { height: 8px; width: 70%; border-radius: 4px; background: var(--art-elem); margin-bottom: 10px; }
.sp-item { display: flex; align-items: center; gap: 8px; padding: 5px 12px; }
.sp-check {
  width: 12px; height: 12px; border-radius: 3px;
  border: 2px solid var(--art-line); flex-shrink: 0;
}
.sp-item.done .sp-check { background: #10b981; border-color: #10b981; }
.sp-text { height: 6px; border-radius: 3px; background: var(--art-elem); flex: 1; }
</style>
