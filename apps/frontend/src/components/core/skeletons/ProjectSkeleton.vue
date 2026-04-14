<template>
  <div class="project-skeleton">
    <div class="project-shell">
      <section class="project-overview project-skeleton__overview">
        <div class="project-overview__main">
          <div class="project-overview__identity project-skeleton__identity-wrap">
            <div class="project-overview__copy project-skeleton__identity">
              <div class="project-overview__eyebrow">
                <SkeletonPulse width="58px" height="10px" radius="3px" />
              </div>
              <div class="project-overview__title-row">
                <SkeletonPulse width="180px" height="24px" radius="6px" />
              </div>
              <div class="project-overview__desc">
                <SkeletonPulse width="68px" height="12px" radius="4px" />
              </div>
            </div>
          </div>

          <div class="project-overview__side project-skeleton__side">
            <div class="project-overview__topbar">
              <SkeletonPulse width="72px" height="12px" radius="4px" />
            </div>
            <div class="project-overview__chips project-skeleton__chips">
              <SkeletonPulse width="88px" height="26px" radius="999px" />
              <SkeletonPulse width="106px" height="26px" radius="999px" />
            </div>
          </div>
        </div>

        <div class="project-metrics project-skeleton__metrics">
          <div v-for="i in 3" :key="i" class="project-metrics__card project-skeleton__metric">
            <div class="project-metrics__meta project-skeleton__metric-head">
              <SkeletonPulse width="52px" height="9px" radius="3px" />
              <SkeletonPulse width="10px" height="14px" radius="3px" />
            </div>
            <div class="project-metrics__chart project-skeleton__metric-line">
              <SkeletonPulse width="100%" height="4px" radius="999px" />
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="project-tabs project-skeleton__tabs">
      <div class="project-tabs__inner project-skeleton__tabs-inner">
        <SkeletonPulse v-for="i in 5" :key="i" width="64px" height="22px" radius="8px" />
      </div>
    </div>

    <div class="project-content project-skeleton__content">
      <div class="project-skeleton__section-head">
        <div class="project-skeleton__section-copy">
          <SkeletonPulse width="54px" height="10px" radius="3px" />
          <SkeletonPulse width="86px" height="12px" radius="4px" />
        </div>
        <div class="project-skeleton__section-actions">
          <SkeletonPulse width="106px" height="26px" radius="999px" />
          <SkeletonPulse width="96px" height="26px" radius="999px" />
          <SkeletonPulse width="64px" height="26px" radius="8px" />
        </div>
      </div>

      <div class="project-skeleton__table">
        <div class="project-skeleton__table-head">
          <SkeletonPulse width="180px" height="9px" radius="3px" />
          <SkeletonPulse width="96px" height="9px" radius="3px" />
          <SkeletonPulse width="72px" height="9px" radius="3px" />
          <SkeletonPulse width="108px" height="9px" radius="3px" />
          <SkeletonPulse width="76px" height="9px" radius="3px" />
          <SkeletonPulse width="46px" height="9px" radius="3px" />
        </div>

        <div v-for="i in 3" :key="i" class="project-skeleton__row">
          <div class="project-skeleton__name-cell">
            <SkeletonPulse width="10px" height="10px" radius="5px" />
            <SkeletonPulse width="28px" height="28px" radius="9px" />
            <div class="project-skeleton__name-stack">
              <SkeletonPulse :width="nameWidths[i - 1]" height="13px" radius="4px" />
              <div class="project-skeleton__row-actions">
                <SkeletonPulse width="20px" height="20px" radius="7px" />
                <SkeletonPulse width="20px" height="20px" radius="7px" />
                <SkeletonPulse width="20px" height="20px" radius="7px" />
              </div>
            </div>
          </div>
          <SkeletonPulse width="70px" height="10px" radius="4px" />
          <div class="project-skeleton__avatars">
            <SkeletonPulse v-for="n in 3" :key="n" width="16px" height="16px" radius="6px" />
          </div>
          <div class="project-skeleton__progress">
            <SkeletonPulse width="88px" height="4px" radius="999px" />
            <SkeletonPulse width="18px" height="10px" radius="4px" />
          </div>
          <SkeletonPulse width="42px" height="10px" radius="4px" />
          <SkeletonPulse width="18px" height="10px" radius="4px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonPulse from '@/components/core/SkeletonPulse.vue';

const nameWidths = ['72px', '84px', '76px'];
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.project-skeleton {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 48px);
  background: $background;
  width: 100%;
}

.project-shell {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 18px 32px 10px;

  @media (max-width: 600px) {
    padding: 14px 12px 8px;
  }
}

.project-tabs__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 6px 32px;
  display: flex;
  gap: 4px;

  @media (max-width: 600px) {
    padding: 6px 12px;
  }
}

.project-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 32px 40px;
  width: 100%;

  @media (max-width: 600px) {
    padding: 12px;
  }
}

.project-skeleton__section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.project-skeleton__side,
.project-skeleton__section-copy,
.project-skeleton__name-stack,
.project-overview__copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-skeleton__side {
  align-items: flex-end;
}

.project-skeleton__section-actions,
.project-skeleton__row-actions,
.project-skeleton__avatars,
.project-skeleton__progress {
  display: flex;
  align-items: center;
  gap: 6px;
}

.project-skeleton__tabs {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  margin-top: 10px;
}

.project-skeleton__metrics {
  margin-top: 16px;
}

.project-overview__main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.project-overview__identity {
  min-width: 0;
  flex: 1;
}

.project-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.project-overview__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.project-overview__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.project-skeleton__table {
  border: 1px solid $divider;
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
}

.project-skeleton__table-head,
.project-skeleton__row {
  display: grid;
  grid-template-columns: minmax(320px, 3.6fr) minmax(190px, 1.35fr) minmax(110px, 0.8fr) minmax(160px, 0.95fr) minmax(120px, 0.75fr) minmax(72px, 0.42fr);
  gap: 10px;
}

.project-skeleton__table-head {
  padding: 10px 16px;
  border-bottom: 1px solid $divider;
  background: #fff;
}

.project-skeleton__row {
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.project-skeleton__row:last-child {
  border-bottom: none;
}

.project-skeleton__name-cell {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

@media (max-width: 900px) {
  .project-overview__main,
  .project-skeleton__section-head {
    flex-direction: column;
  }

  .project-skeleton__side {
    align-items: flex-start;
  }
}

@media (max-width: 600px) {
  .project-skeleton__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
