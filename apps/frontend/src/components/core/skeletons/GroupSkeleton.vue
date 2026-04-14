<template>
  <div class="group-skeleton">
    <!-- Hero -->
    <div class="group-skeleton__hero">
      <div class="group-skeleton__hero-bg"></div>
      <div class="group-skeleton__hero-content">
        <SkeletonPulse width="56px" height="56px" radius="14px" />
        <div class="group-skeleton__hero-info">
          <SkeletonPulse width="200px" height="22px" radius="4px" />
          <SkeletonPulse width="140px" height="12px" radius="3px" />
          <div class="group-skeleton__hero-badges">
            <SkeletonPulse width="100px" height="22px" radius="12px" />
            <SkeletonPulse width="80px" height="22px" radius="12px" />
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="group-skeleton__tabs">
      <SkeletonPulse v-for="i in 5" :key="i" width="80px" height="28px" radius="4px" />
    </div>

    <!-- Content -->
    <div class="group-skeleton__content">
      <div v-for="i in 5" :key="i" class="group-skeleton__row">
        <SkeletonPulse width="36px" height="36px" radius="50%" />
        <div class="group-skeleton__row-text">
          <SkeletonPulse :width="rowWidths[i % rowWidths.length]" height="13px" radius="3px" />
          <SkeletonPulse width="100px" height="10px" radius="2px" />
        </div>
        <div style="flex:1"></div>
        <SkeletonPulse width="90px" height="26px" radius="6px" />
        <SkeletonPulse width="70px" height="26px" radius="6px" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonPulse from '@/components/core/SkeletonPulse.vue';

const rowWidths = ['160px', '200px', '140px', '180px', '150px'];
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.group-skeleton {
  display: flex;
  flex-direction: column;

  &__hero {
    position: relative;
    padding: 28px 24px 20px;
  }

  &__hero-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba($primary, 0.12), rgba($primary, 0.04));
    body.dark-mode & {
      background: linear-gradient(135deg, rgba($primary-light, 0.08), rgba($primary-light, 0.02));
    }
  }

  &__hero-content {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  &__hero-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__hero-badges {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  &__tabs {
    display: flex;
    gap: 10px;
    padding: 14px 24px;
    border-bottom: 1px solid $divider;
    body.dark-mode & { border-color: $dark-border; }
  }

  &__content {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    body.dark-mode & { border-color: rgba(255, 255, 255, 0.04); }
  }

  &__row-text {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
}
</style>
