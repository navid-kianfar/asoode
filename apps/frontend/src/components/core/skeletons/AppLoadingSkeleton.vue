<template>
  <div class="app-loading-skeleton">
    <!-- Fake header -->
    <div class="als-header">
      <div class="als-header__left">
        <SkeletonPulse width="28px" height="28px" radius="6px" />
        <SkeletonPulse width="70px" height="16px" radius="3px" />
      </div>
      <div class="als-header__center">
        <SkeletonPulse width="200px" height="30px" radius="8px" />
      </div>
      <div class="als-header__right">
        <SkeletonPulse v-for="i in 3" :key="i" width="28px" height="28px" radius="50%" />
        <SkeletonPulse width="32px" height="32px" radius="50%" />
      </div>
    </div>

    <!-- Content area -->
    <div class="als-content">
      <!-- Page title area -->
      <div class="als-title">
        <SkeletonPulse width="220px" height="22px" radius="4px" />
        <SkeletonPulse width="140px" height="13px" radius="3px" />
      </div>

      <!-- Toolbar row (tabs / filters) -->
      <div class="als-toolbar">
        <SkeletonPulse v-for="i in 4" :key="i" :width="pillWidths[i % pillWidths.length]" height="30px" radius="6px" />
      </div>

      <!-- Generic content card -->
      <div class="als-card">
        <div v-for="i in 6" :key="i" class="als-row">
          <SkeletonPulse width="32px" height="32px" radius="50%" />
          <div class="als-row__text">
            <SkeletonPulse :width="rowWidths[i % rowWidths.length]" height="12px" radius="3px" />
            <SkeletonPulse :width="subWidths[i % subWidths.length]" height="10px" radius="2px" />
          </div>
          <div class="als-row__spacer"></div>
          <SkeletonPulse width="60px" height="10px" radius="2px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonPulse from '@/components/core/SkeletonPulse.vue';

const pillWidths = ['80px', '100px', '70px', '90px'];
const rowWidths = ['200px', '160px', '240px', '180px', '220px', '150px'];
const subWidths = ['100px', '80px', '120px', '90px', '110px', '70px'];
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.app-loading-skeleton {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $background;

  body.dark-mode & {
    background: $dark-background;
  }
}

// ── Fake header ──────────────────────────────────────────────────────
.als-header {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: $surface;
  border-bottom: 1px solid $divider;
  flex-shrink: 0;

  body.dark-mode & {
    background: $dark-card;
    border-color: $dark-border;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 0 0 auto;
  }

  &__center {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 0 0 auto;
  }
}

// ── Content ──────────────────────────────────────────────────────────
.als-content {
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.als-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// ── Toolbar ─────────────────────────────────────────────────────────
.als-toolbar {
  display: flex;
  gap: 8px;
  padding-bottom: 14px;
  border-bottom: 1px solid $divider;

  body.dark-mode & {
    border-color: $dark-border;
  }
}

// ── Content card ────────────────────────────────────────────────────
.als-card {
  display: flex;
  flex-direction: column;
  background: $surface;
  border-radius: 12px;
  border: 1px solid $divider;
  padding: 8px;

  body.dark-mode & {
    background: $dark-card;
    border-color: $dark-border;
  }
}

.als-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);

  body.dark-mode & {
    border-color: rgba(255, 255, 255, 0.04);
  }

  &:last-child {
    border-bottom: none;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__spacer {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .als-content {
    padding: 20px 16px;
  }

  .als-toolbar {
    flex-wrap: wrap;
  }
}
</style>
