<template>
  <div class="tasks-skeleton">
    <!-- Hero -->
    <div class="tasks-skeleton__hero">
      <div class="tasks-skeleton__hero-text">
        <SkeletonPulse width="220px" height="22px" radius="4px" />
        <SkeletonPulse width="160px" height="13px" radius="3px" />
      </div>
      <SkeletonPulse width="200px" height="32px" radius="8px" />
    </div>

    <!-- Tabs -->
    <div class="tasks-skeleton__tabs">
      <SkeletonPulse v-for="i in 3" :key="i" width="100px" height="30px" radius="6px" />
    </div>

    <!-- Calendar grid -->
    <div class="tasks-skeleton__grid">
      <!-- Day headers -->
      <div class="tasks-skeleton__day-headers">
        <SkeletonPulse v-for="i in 7" :key="i" width="40px" height="12px" radius="2px" />
      </div>
      <!-- Calendar cells -->
      <div class="tasks-skeleton__cells">
        <div v-for="i in 35" :key="i" class="tasks-skeleton__cell">
          <SkeletonPulse width="20px" height="12px" radius="2px" />
          <SkeletonPulse v-if="i % 3 === 0" width="80%" height="8px" radius="2px" />
          <SkeletonPulse v-if="i % 5 === 0" width="60%" height="8px" radius="2px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonPulse from '@/components/core/SkeletonPulse.vue';
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.tasks-skeleton {
  display: flex;
  flex-direction: column;

  &__hero {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 24px;
  }

  &__hero-text {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__tabs {
    display: flex;
    gap: 8px;
    padding: 0 24px 14px;
    border-bottom: 1px solid $divider;
    body.dark-mode & { border-color: $dark-border; }
  }

  &__grid {
    padding: 16px 24px;
  }

  &__day-headers {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 12px;

    > * {
      justify-self: center;
    }
  }

  &__cells {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  &__cell {
    min-height: 70px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 6px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    body.dark-mode & {
      border-color: rgba(255, 255, 255, 0.06);
    }
  }
}
</style>
