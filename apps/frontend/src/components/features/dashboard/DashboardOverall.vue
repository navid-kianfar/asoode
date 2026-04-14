<template>
  <div class="overall-report">
    <div class="circles-container">
      <div class="circle-1">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" stroke-width="5" />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="#b977f7"
            stroke-width="5"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="totalOffset"
            class="progress-ring"
            style="animation-duration: 400ms"
          />
        </svg>
      </div>
      <div class="circle-2">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" stroke-width="5" />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="#74d68c"
            stroke-width="5"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="doneOffset"
            class="progress-ring"
            style="animation-duration: 600ms"
          />
        </svg>
      </div>
      <div class="circle-3">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" stroke-width="5" />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="#ee6285"
            stroke-width="5"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="inProgressOffset"
            class="progress-ring"
            style="animation-duration: 800ms"
          />
        </svg>
      </div>
    </div>
    <div class="info">
      <div class="box box-1">
        <div class="label"></div>
        <div class="number">{{ model.total }}</div>
        <div class="title">{{ $t('CREATED_CARDS') }}</div>
      </div>
      <div class="box box-2">
        <div class="label"></div>
        <div class="number">{{ model.done }}</div>
        <div class="title">{{ $t('DONE_CARDS') }}</div>
      </div>
      <div class="box box-3">
        <div class="label"></div>
        <div class="number">{{ model.inProgress }}</div>
        <div class="title">{{ $t('IN_PROGRESS_CARDS') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { OverallViewModel } from '@asoode/shared';

const props = defineProps<{ model: OverallViewModel }>();

const circumference = 2 * Math.PI * 45;

const totalOffset = computed(() => {
  // Total circle is always full (100%)
  return 0;
});

const doneOffset = computed(() => {
  if (!props.model.total) return circumference;
  const ratio = props.model.done / props.model.total;
  return circumference * (1 - ratio);
});

const inProgressOffset = computed(() => {
  const max = props.model.total - props.model.done;
  if (!max) return circumference;
  const ratio = props.model.inProgress / max;
  return circumference * (1 - ratio);
});
</script>

<style scoped lang="scss">
.overall-report {
  .circles-container {
    width: 170px;
    height: 170px;
    position: relative;
    margin: 10px auto;

    .circle-1 {
      width: 150px;
      height: 150px;
      position: absolute;
      top: 15px;
      left: 15px;
      z-index: 1;
    }

    .circle-2 {
      width: 120px;
      height: 120px;
      position: absolute;
      top: 30px;
      left: 30px;
      z-index: 2;
    }

    .circle-3 {
      width: 90px;
      height: 90px;
      position: absolute;
      top: 45px;
      left: 45px;
      z-index: 3;
    }
  }

  .info {
    display: flex;
    text-align: center;
    justify-content: space-around;

    .box {
      .label {
        width: 40px;
        height: 3px;
        margin: 0 auto;
      }

      .number {
        font-size: 2rem;
        font-weight: 400;
        padding-inline-end: 10px;
      }

      .title {
        font-size: 0.7rem;
        padding-inline-end: 10px;
        font-weight: 500;
      }

      &.box-1 .label {
        background-color: #b977f7;
      }

      &.box-2 .label {
        background-color: #74d68c;
      }

      &.box-3 .label {
        background-color: #ee6285;
      }
    }
  }
}

.progress-ring {
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dashoffset 0.8s ease-in-out;
}

svg {
  width: 100%;
  height: 100%;
}

// Dark mode handled in _dashboard.scss
</style>
