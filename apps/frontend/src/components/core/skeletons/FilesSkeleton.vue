<template>
  <div class="fsk">
    <div v-if="mode === 'grid'" class="fsk-grid">
      <div v-for="i in 12" :key="i" class="fsk-card">
        <SkeletonPulse width="64px" height="64px" radius="8px" />
        <SkeletonPulse :width="cardWidths[i % cardWidths.length]" height="12px" radius="3px" />
        <SkeletonPulse width="60px" height="10px" radius="2px" />
      </div>
    </div>
    <div v-else class="fsk-list">
      <div v-for="i in 10" :key="i" class="fsk-row">
        <SkeletonPulse width="32px" height="32px" radius="4px" />
        <SkeletonPulse :width="rowWidths[i % rowWidths.length]" height="12px" radius="3px" />
        <SkeletonPulse width="60px" height="10px" radius="2px" />
        <SkeletonPulse width="80px" height="10px" radius="2px" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonPulse from '@/components/core/SkeletonPulse.vue';

defineProps<{ mode?: 'grid' | 'list' }>();

const cardWidths = ['120px', '90px', '110px', '80px', '100px'];
const rowWidths = ['200px', '160px', '180px', '140px', '220px'];
</script>

<style lang="scss">
.fsk {
  padding: 20px;
}

.fsk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}

.fsk-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
}

.fsk-list {
  display: flex;
  flex-direction: column;
}

.fsk-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
}

body.dark-mode {
  .fsk-row {
    border-bottom-color: #444;
  }
}
</style>
