<template>
  <div>
    <div class="color-legend" style="margin: 20px 0">
      <div class="item">
        <div class="blocked color"></div>
        &nbsp;{{ $t('BLOCKED_CARDS') }}
      </div>
      <div class="item">
        <div class="done color"></div>
        &nbsp;{{ $t('DONE_CARDS') }}
      </div>
      <div class="item">
        <div class="created color"></div>
        &nbsp;{{ $t('CREATED_CARDS') }}
      </div>
    </div>
    <div class="progress-report">
      <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ProgressDataItem {
  date: Date | string;
  total?: number;
  done?: number;
  blocked?: number;
  inProgress?: number;
  created?: number;
}

const props = defineProps<{
  data: ProgressDataItem[];
  begin?: Date;
  end?: Date;
  chartOptionsOverride?: Record<string, any>;
}>();

const chartData = computed(() => {
  if (!props.data?.length) return null;

  const labels: string[] = [];
  const blocked: number[] = [];
  const done: number[] = [];
  const created: number[] = [];

  const beginDate = props.begin ? new Date(props.begin) : new Date(Date.now() - 6 * 86400000);
  const endDate = props.end ? new Date(props.end) : new Date();

  const current = new Date(beginDate);
  while (current <= endDate) {
    const m = current.getMonth() + 1;
    const d = current.getDate();
    labels.push(`${m}/${d}`);

    const dayData = props.data.find((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getDate() === current.getDate() &&
        itemDate.getMonth() === current.getMonth() &&
        itemDate.getFullYear() === current.getFullYear()
      );
    });

    blocked.push(dayData?.blocked || 0);
    done.push(dayData?.done || 0);
    created.push(dayData?.total ?? dayData?.created ?? 0);

    current.setDate(current.getDate() + 1);
  }

  return {
    labels,
    datasets: [
      {
        label: 'Blocked',
        data: blocked,
        backgroundColor: '#ee6285',
        borderRadius: 2,
        barPercentage: 0.8,
        categoryPercentage: 0.7,
      },
      {
        label: 'Done',
        data: done,
        backgroundColor: '#74d68c',
        borderRadius: 2,
        barPercentage: 0.8,
        categoryPercentage: 0.7,
      },
      {
        label: 'Created',
        data: created,
        backgroundColor: '#59a8ef',
        borderRadius: 2,
        barPercentage: 0.8,
        categoryPercentage: 0.7,
      },
    ],
  };
});

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#808080',
        font: { size: 11, weight: 'normal' as const },
      },
    },
    y: {
      grid: {
        color: 'rgba(0,0,0,0.05)',
      },
      ticks: {
        color: '#808080',
        font: { size: 11, weight: 'normal' as const },
        callback: function (value: number | string) {
          const num = Number(value);
          if ((num * 10) % 10) return '';
          return Math.floor(num);
        },
      },
    },
  },
};

const chartOptions = computed(() => {
  if (!props.chartOptionsOverride) return defaultOptions;
  return { ...defaultOptions, ...props.chartOptionsOverride };
});
</script>

<style scoped lang="scss">
.progress-report {
  direction: ltr !important;
  height: 200px;
}

// Legend uses global .color-legend from _dashboard.scss
// Dark mode handled in _dashboard.scss
</style>
