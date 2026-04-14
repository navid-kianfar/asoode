<template>
  <div class="dsk">
    <!-- Header + Mode Switch -->
    <div class="dsk-header">
      <div class="dsk-header__left">
        <SkeletonPulse width="220px" height="22px" radius="4px" />
        <SkeletonPulse width="180px" height="14px" radius="3px" />
      </div>
      <SkeletonPulse width="210px" height="38px" radius="10px" />
    </div>

    <!-- Focus Strip -->
    <div class="dsk-section">
      <div class="dsk-section__head">
        <SkeletonPulse width="100px" height="12px" radius="3px" />
        <SkeletonPulse width="60px" height="18px" radius="9px" />
      </div>
      <div class="dsk-focus-grid">
        <div v-for="i in 5" :key="i" class="dsk-focus-card">
          <SkeletonPulse width="18px" height="18px" radius="50%" />
          <div class="dsk-focus-card__body">
            <SkeletonPulse :width="focusWidths[i % focusWidths.length]" height="12px" radius="3px" />
            <SkeletonPulse width="80px" height="10px" radius="2px" />
            <SkeletonPulse width="50px" height="8px" radius="2px" />
          </div>
        </div>
      </div>
    </div>

    <!-- Stats + Heatmap Row -->
    <div class="dsk-stats-row">
      <div class="dsk-card dsk-card--hero">
        <div class="dsk-card__head">
          <SkeletonPulse width="70px" height="12px" radius="3px" />
          <SkeletonPulse width="90px" height="20px" radius="10px" />
        </div>
        <div class="dsk-stat-metrics">
          <div v-for="i in 3" :key="i" class="dsk-stat-item">
            <SkeletonPulse width="56px" height="32px" radius="4px" />
            <SkeletonPulse width="68px" height="10px" radius="2px" />
            <SkeletonPulse width="100%" height="36px" radius="4px" />
          </div>
        </div>
      </div>
      <div class="dsk-card">
        <SkeletonPulse width="120px" height="12px" radius="3px" />
        <SkeletonPulse width="100%" height="90px" radius="4px" />
        <div class="dsk-heatmap-legend">
          <SkeletonPulse width="24px" height="8px" radius="2px" />
          <SkeletonPulse v-for="i in 5" :key="i" width="10px" height="10px" radius="2px" />
          <SkeletonPulse width="24px" height="8px" radius="2px" />
        </div>
      </div>
    </div>

    <!-- 2-col grid -->
    <div class="dsk-grid">
      <!-- Schedule -->
      <div class="dsk-card">
        <SkeletonPulse width="90px" height="12px" radius="3px" />
        <div class="dsk-schedule-items">
          <SkeletonPulse width="50px" height="10px" radius="2px" />
          <div v-for="i in 3" :key="'a' + i" class="dsk-schedule-row">
            <SkeletonPulse width="7px" height="7px" radius="50%" />
            <SkeletonPulse :width="scheduleWidths[i % scheduleWidths.length]" height="10px" radius="2px" />
            <div style="flex:1"></div>
            <SkeletonPulse width="60px" height="10px" radius="2px" />
          </div>
          <SkeletonPulse width="66px" height="10px" radius="2px" style="margin-top: 10px" />
          <div v-for="i in 2" :key="'b' + i" class="dsk-schedule-row">
            <SkeletonPulse width="7px" height="7px" radius="50%" />
            <SkeletonPulse :width="scheduleWidths[(i + 2) % scheduleWidths.length]" height="10px" radius="2px" />
            <div style="flex:1"></div>
            <SkeletonPulse width="60px" height="10px" radius="2px" />
          </div>
        </div>
      </div>

      <!-- Activity -->
      <div class="dsk-card">
        <SkeletonPulse width="80px" height="12px" radius="3px" />
        <div class="dsk-activity-items">
          <div v-for="i in 5" :key="i" class="dsk-activity-row">
            <SkeletonPulse width="8px" height="8px" radius="50%" />
            <div class="dsk-activity-row__body">
              <SkeletonPulse :width="actWidths[i % actWidths.length]" height="10px" radius="2px" />
              <SkeletonPulse width="60px" height="8px" radius="2px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonPulse from '@/components/core/SkeletonPulse.vue';

const focusWidths = ['110px', '90px', '100px', '80px'];
const scheduleWidths = ['120px', '100px', '140px', '110px', '130px'];
const actWidths = ['180px', '150px', '200px', '160px', '170px'];
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.dsk {
  padding: 28px 32px;
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dsk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  &__left {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}

.dsk-section__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dsk-focus-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.dsk-focus-card {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-left: 4px solid rgba(0, 0, 0, 0.06);
  background: $surface;
  display: flex;
  gap: 10px;
  align-items: flex-start;

  body.dark-mode & {
    background: $dark-card;
    border-color: $dark-border;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}

.dsk-stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.dsk-card {
  background: $surface;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  body.dark-mode & {
    background: $dark-card;
    border-color: $dark-border;
  }

  &--hero {
    border-top: 3px solid rgba(0, 0, 0, 0.06);
    body.dark-mode & { border-top-color: $dark-border; }
  }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.dsk-stat-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.dsk-stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dsk-heatmap-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.dsk-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.dsk-schedule-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dsk-schedule-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0 8px 18px;
}

.dsk-activity-items {
  display: flex;
  flex-direction: column;
}

.dsk-activity-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 11px 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    body.dark-mode & { border-color: rgba(255, 255, 255, 0.04); }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

@media (max-width: 1100px) {
  .dsk-focus-grid { grid-template-columns: repeat(3, 1fr); }
  .dsk-stats-row,
  .dsk-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dsk-focus-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .dsk { padding: 16px; }
  .dsk-stat-metrics { grid-template-columns: 1fr; }
  .dsk-focus-grid { grid-template-columns: 1fr; }
}
</style>
