<template>
  <section class="group-reports">
    <header class="group-reports__header">
      <div class="group-reports__heading">
        <p class="group-reports__eyebrow">{{ $t('REPORTS') }}</p>
        <p class="group-reports__summary">
          Track monthly delivery momentum with a quick view of completed work and day-by-day progress.
        </p>
      </div>

      <div class="group-reports__meta">
        <span class="group-reports__chip">
          <i class="mdi mdi-calendar-month-outline"></i>
          {{ formatMonthYear(beginDate) }}
        </span>
        <span v-if="model.length" class="group-reports__chip">
          <i class="mdi mdi-chart-line"></i>
          {{ overallProgress }}%
        </span>
      </div>
    </header>

    <article class="reports-panel">
      <div v-if="waiting" class="reports-loading">
        <i class="mdi mdi-loading mdi-spin"></i>
      </div>

      <template v-else-if="model.length">
        <div class="reports-overview">
          <div class="reports-overview__header">
            <div>
              <span class="reports-overview__label">{{ $t('OVERALL_PROGRESS') }}</span>
              <strong class="reports-overview__value">{{ overallProgress }}%</strong>
            </div>
            <span class="reports-overview__caption">{{ formatMonthYear(beginDate) }}</span>
          </div>
          <div class="reports-overview__track">
            <div class="reports-overview__fill" :style="{ width: `${overallProgress}%` }"></div>
          </div>
        </div>

        <div class="day-grid">
          <article
            v-for="day in model"
            :key="day.date || day.day"
            class="day-card"
          >
            <div class="day-card__date">{{ formatDayDate(day.date || day.day) }}</div>
            <div class="day-card__stats">
              <div class="day-card__stat">
                <span>{{ $t('TOTAL') }}</span>
                <strong>{{ day.total || day.totalTasks || 0 }}</strong>
              </div>
              <div class="day-card__stat">
                <span>{{ $t('DONE') }}</span>
                <strong class="day-card__done">{{ day.done || day.doneTasks || 0 }}</strong>
              </div>
            </div>
            <div class="day-card__track">
              <div class="day-card__fill" :style="{ width: `${dayProgress(day)}%` }"></div>
            </div>
          </article>
        </div>
      </template>

      <div v-else class="reports-empty">
        <i class="mdi mdi-chart-box-outline"></i>
        <span>{{ $t('NO_REPORT_DATA') }}</span>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useGroupStore } from '@/stores/group.store';
import { useCulturedDate } from '@/composables/useCulturedDate';
import { useCultureStore } from '@/stores/culture.store';
import { AccessType, OperationResultStatus, type GroupViewModel } from '@asoode/shared';

const props = defineProps<{
  group: GroupViewModel;
  permission: AccessType;
}>();

const groupStore = useGroupStore();
const { getConverter, formatDate } = useCulturedDate();
const cultureStore = useCultureStore();

const waiting = ref(true);
const model = ref<any[]>([]);
const endDate = ref<Date>(new Date());
const beginDate = ref<Date>(new Date());

const overallProgress = computed(() => {
  if (!model.value.length) return 0;
  const totalAll = model.value.reduce((sum, day) => sum + (day.total || day.totalTasks || 0), 0);
  const doneAll = model.value.reduce((sum, day) => sum + (day.done || day.doneTasks || 0), 0);
  if (totalAll === 0) return 0;
  return Math.round((doneAll / totalAll) * 100);
});

function thisMonth() {
  const converter = getConverter();
  const now = new Date();
  const parsed = converter.FromDateTime(now);
  beginDate.value = converter.ToDateTime({
    Year: parsed.Year,
    Month: parsed.Month,
    Day: 1,
    Hours: 0,
    Minutes: 0,
    Seconds: 0,
    Milliseconds: 0,
  });

  const lastDayInMonth = cultureStore.current.daysInMonths[parsed.Month - 1];
  endDate.value = converter.ToDateTime({
    Year: parsed.Year,
    Month: parsed.Month,
    Day: lastDayInMonth,
    Hours: 23,
    Minutes: 59,
    Seconds: 59,
    Milliseconds: 0,
  });
}

async function fetch() {
  model.value = [];
  waiting.value = true;
  const op = await groupStore.report(props.group.id, {
    begin: beginDate.value,
    end: endDate.value,
  });
  waiting.value = false;
  if (op.status === OperationResultStatus.Success) {
    model.value = op.data || [];
  }
}

function formatMonthYear(date: Date): string {
  if (!date) return '';
  const converter = getConverter();
  const parsed = converter.FromDateTime(date);
  const monthNames = cultureStore.current.monthNames;
  const monthName = monthNames[parsed.Month - 1] || '';
  return `${monthName} ${parsed.Year}`;
}

function formatDayDate(date: string | Date | undefined): string {
  if (!date) return '';
  const value = typeof date === 'string' ? new Date(date) : date;
  return formatDate(value, 'dd');
}

function dayProgress(day: any): number {
  const total = day.total || day.totalTasks || 0;
  const done = day.done || day.doneTasks || 0;
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

onMounted(() => {
  thisMonth();
  fetch();
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.group-reports {
  display: grid;
  gap: 18px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding-top: 4px;

    @media (max-width: 900px) {
      flex-direction: column;
    }
  }

  &__heading {
    max-width: 620px;
  }

  &__eyebrow {
    margin: 0 0 6px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $text-secondary;
  }

  &__summary {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: $text-secondary;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-radius: 999px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: $text-secondary;
    font-size: 12px;
    font-weight: 600;
  }
}

.reports-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.05);
}

.reports-loading,
.reports-empty {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: $text-secondary;

  .mdi {
    font-size: 28px;
    color: #6366f1;
  }
}

.reports-overview {
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 12px;
    margin-bottom: 10px;
  }

  &__label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $text-secondary;
  }

  &__value {
    display: block;
    margin-top: 4px;
    font-size: 24px;
    line-height: 1;
    color: $text-primary;
  }

  &__caption {
    font-size: 12px;
    color: $text-secondary;
  }

  &__track {
    height: 10px;
    border-radius: 999px;
    background: #e2e8f0;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    transition: width 200ms ease;
  }
}

.day-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.day-card {
  display: block;
  padding: 14px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);

  &__date {
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
    color: $text-primary;
    margin-bottom: 12px;
  }

  &__stats {
    display: grid;
    gap: 6px;
  }

  &__stat {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: $text-secondary;

    strong {
      color: $text-primary;
    }
  }

  &__done {
    color: #16a34a !important;
  }

  &__track {
    margin-top: 12px;
    height: 6px;
    border-radius: 999px;
    background: #e2e8f0;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    border-radius: inherit;
  }
}
</style>

<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .group-reports {
    &__eyebrow,
    &__summary,
    &__chip {
      color: $dark-text-muted;
    }

    &__chip {
      background: rgba(30, 41, 59, 0.85);
      border-color: rgba(71, 85, 105, 0.7);
    }
  }

  .reports-panel,
  .day-card {
    background: rgba(30, 41, 59, 0.72);
    border-color: rgba(71, 85, 105, 0.68);
    box-shadow: none;
  }

  .reports-overview {
    background: rgba(15, 23, 42, 0.46);
    border-color: rgba(71, 85, 105, 0.68);

    &__label,
    &__caption {
      color: $dark-text-muted;
    }

    &__value {
      color: $dark-text-light;
    }

    &__track {
      background: rgba(71, 85, 105, 0.58);
    }
  }

  .day-card {
    &__date {
      color: $dark-text-light;
    }

    &__stat {
      color: $dark-text-muted;

      strong {
        color: $dark-text-light;
      }
    }

    &__track {
      background: rgba(71, 85, 105, 0.58);
    }
  }

  .reports-loading,
  .reports-empty {
    color: $dark-text-muted;
  }
}
</style>
