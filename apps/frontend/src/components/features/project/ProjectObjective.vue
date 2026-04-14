<template>
  <section class="project-objectives">
    <div class="project-objectives__header">
      <div>
        <p class="project-objectives__eyebrow">{{ $t('OBJECTIVES') }}</p>
        <p class="project-objectives__summary">
          The objectives in work packages help organize priorities and review estimated cost based on time spent.
        </p>
      </div>
      <div class="project-objectives__stats">
        <span class="project-objectives__chip">
          <i class="mdi mdi-target"></i>
          <strong>{{ objectives.length }}</strong>
          <span>{{ $t('OBJECTIVES') }}</span>
        </span>
        <span class="project-objectives__chip">
          <i class="mdi mdi-timer-outline"></i>
          <strong>{{ selected ? msToDuration(estimatedTotalTime) : '0h' }}</strong>
          <span>{{ $t('TIME_SPENT') }}</span>
        </span>
      </div>
    </div>

    <div v-if="!objectives.length" class="project-objectives__empty">
      <div class="project-objectives__empty-icon">
        <i class="mdi mdi-target"></i>
      </div>
      <h4>{{ $t('NO_OBJECTIVE_DEFINED_TITLE') }}</h4>
      <p>{{ $t('NO_OBJECTIVE_DEFINED') }}</p>
    </div>

    <div v-else class="project-objectives__list">
      <article
        v-for="objective in objectives"
        :key="objective.id"
        class="objective-row"
        :class="{ 'objective-row--expanded': selected?.id === objective.id }"
      >
        <button class="objective-row__summary" @click="toggleObjective(objective)">
          <div class="objective-row__main">
            <div class="objective-row__icon">
              <i class="mdi mdi-target"></i>
            </div>
            <div class="objective-row__content">
              <div class="objective-row__title-line">
                <h4>{{ objective.title }}</h4>
                <span class="objective-row__package">
                  <i class="mdi mdi-package-variant"></i>
                  {{ objective.workPackage }}
                </span>
              </div>
              <p class="objective-row__description">
                {{ truncate(objective.description, selected?.id === objective.id ? 400 : 140) || $t('OBJECTIVE_USE_DESCRIPTION') }}
              </p>
            </div>
          </div>
          <div class="objective-row__toggle">
            <i :class="selected?.id === objective.id ? 'mdi mdi-chevron-up' : 'mdi mdi-chevron-down'"></i>
          </div>
        </button>

        <div v-if="selected?.id === objective.id" class="objective-row__detail">
          <div v-if="detailWaiting" class="project-objectives__loading">
            <div class="spinner"></div>
          </div>

          <template v-else>
            <div class="objective-detail">
              <div class="objective-detail__header">
                <div>
                  <h5>{{ $t('ESTIMATED_PRICE') }}</h5>
                  <p>{{ $t('TOTAL_SUM') }}</p>
                </div>
              </div>

              <div class="objective-detail__totals">
                <div class="objective-detail__total-card">
                  <span>{{ $t('TIME_SPENT') }}</span>
                  <strong>{{ msToDuration(estimatedTotalTime) }}</strong>
                </div>
                <div class="objective-detail__total-card">
                  <span>{{ $t('AMOUNT') }}</span>
                  <strong>{{ formatNumber(estimatedTotalAmount) }}</strong>
                </div>
                <div class="objective-detail__total-card">
                  <span>{{ $t('NAME') }}</span>
                  <strong>{{ estimated.length }}</strong>
                </div>
              </div>

              <div v-if="estimated.length" class="objective-detail__table-wrap">
                <table class="objective-detail__table">
                  <thead>
                    <tr>
                      <th>{{ $t('NAME') }}</th>
                      <th>{{ $t('DATE') }}</th>
                      <th>{{ $t('SPENT_TIME') }}</th>
                      <th>{{ $t('AMOUNT') }}</th>
                      <th>{{ $t('GROUP') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in estimated" :key="idx">
                      <td>{{ item.user }}</td>
                      <td>{{ formatDate(item.date) }}</td>
                      <td>{{ msToDuration(item.time) }}</td>
                      <td>{{ formatNumber(item.amount) }}</td>
                      <td>{{ item.group }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="objective-detail__empty">
                <i class="mdi mdi-receipt-text-outline"></i>
                <span>{{ $t('TOTAL_SUM') }}</span>
              </div>
            </div>
          </template>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  type ProjectViewModel,
  type WorkPackageObjectiveViewModel,
  type ProjectObjectiveEstimatedPriceViewModel,
  OperationResultStatus,
} from '@asoode/shared';
import { useProjectStore } from '@/stores/project.store';
import { useCulturedDate } from '@/composables/useCulturedDate';

const props = defineProps<{ project: ProjectViewModel }>();

const projectStore = useProjectStore();
const { formatDate } = useCulturedDate();

const detailWaiting = ref(false);
const objectives = ref<WorkPackageObjectiveViewModel[]>([]);
const selected = ref<WorkPackageObjectiveViewModel | null>(null);
const estimated = ref<ProjectObjectiveEstimatedPriceViewModel[]>([]);
const estimatedTotalTime = ref(0);
const estimatedTotalAmount = ref(0);

function truncate(text: string | undefined, length: number): string {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function msToDuration(ms: number): string {
  if (!ms) return '0h';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function formatNumber(num: number): string {
  if (!num) return '0';
  return num.toLocaleString();
}

async function loadObjectiveDetails(objective: WorkPackageObjectiveViewModel) {
  selected.value = objective;
  detailWaiting.value = true;
  const op = await projectStore.objectiveDetails(objective.id);
  detailWaiting.value = false;
  if (op.status !== OperationResultStatus.Success) return;

  estimated.value = Array.isArray(op.data) ? op.data : [];
  estimatedTotalAmount.value = estimated.value
    .map((e) => e.amount || 0)
    .reduce((p, c) => p + c, 0);
  estimatedTotalTime.value = estimated.value
    .map((e) => e.time || 0)
    .reduce((p, c) => p + c, 0);
}

async function toggleObjective(objective: WorkPackageObjectiveViewModel) {
  if (selected.value?.id === objective.id) {
    selected.value = null;
    estimated.value = [];
    estimatedTotalAmount.value = 0;
    estimatedTotalTime.value = 0;
    detailWaiting.value = false;
    return;
  }

  await loadObjectiveDetails(objective);
}

watch(
  () => props.project.objectives,
  (nextObjectives) => {
    objectives.value = Array.isArray(nextObjectives) ? nextObjectives : [];
    if (selected.value) {
      selected.value = objectives.value.find((objective) => objective.id === selected.value?.id) || null;
    }
    if (!selected.value) {
      estimated.value = [];
      estimatedTotalAmount.value = 0;
      estimatedTotalTime.value = 0;
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.project-objectives {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 18px;
    padding: 6px 2px 10px;
    border-bottom: 1px solid #edf2f7;
  }

  &__eyebrow {
    margin: 0 0 6px;
    color: #64748b;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__summary {
    margin: 0;
    max-width: 720px;
    color: #475569;
    line-height: 1.55;
    font-size: 0.92rem;
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
    padding-top: 4px;
  }

  &__chip {
    min-height: 34px;
    padding: 0 11px;
    border-radius: 999px;
    background: #fff;
    border: 1px solid #e2e8f0;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #64748b;
    white-space: nowrap;

    i {
      font-size: 0.88rem;
    }

    span {
      font-size: 0.78rem;
      font-weight: 600;
    }

    strong {
      font-size: 0.82rem;
      line-height: 1;
      font-weight: 700;
      color: #0f172a;
    }
  }

  &__list,
  &__empty {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.03);
  }

  &__list {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__empty {
    min-height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
    padding: 32px;

    h4 {
      margin: 0 0 8px;
      color: #0f172a;
      font-size: 1.15rem;
    }

    p {
      margin: 0;
      color: #64748b;
      max-width: 420px;
      line-height: 1.6;
    }
  }

  &__empty-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #eef2ff;
    color: #4f46e5;
    margin-bottom: 16px;

    .mdi {
      font-size: 24px;
    }
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: 36px 0;

    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid #e2e8f0;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }
}

.objective-row {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    border-color: #cbd5e1;
  }

  &--expanded {
    border-color: #c7d2fe;
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.08);
  }

  &__summary {
    width: 100%;
    border: none;
    background: transparent;
    padding: 10px 12px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    text-align: left;
    cursor: pointer;
  }

  &__main {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
    flex: 1;
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: #eef2ff;
    color: #4f46e5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .mdi {
      font-size: 15px;
    }
  }

  &__content {
    min-width: 0;
    flex: 1;
  }

  &__title-line {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 3px;

    h4 {
      margin: 0;
      color: #0f172a;
      font-size: 0.92rem;
      font-weight: 700;
      line-height: 1.35;
    }
  }

  &__package {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 999px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #475569;
    font-size: 0.7rem;
    font-weight: 700;
  }

  &__description {
    margin: 0;
    color: #64748b;
    font-size: 0.8rem;
    line-height: 1.45;
  }

  &__toggle {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    color: #64748b;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__detail {
    padding: 0 12px 12px;
  }
}

.objective-detail {
  border-top: 1px solid #eef2f7;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;

    h5 {
      margin: 0;
      color: #0f172a;
      font-size: 0.95rem;
    }

    p {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 0.78rem;
    }
  }

  &__totals {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  &__total-card {
    padding: 10px 12px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;

    span {
      display: block;
      color: #64748b;
      font-size: 0.66rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    strong {
      color: #0f172a;
      font-size: 0.88rem;
    }
  }

  &__table-wrap {
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    min-width: 680px;

    th {
      background: #f8fafc;
      color: #64748b;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    td {
      padding: 10px 12px;
      color: #334155;
      font-size: 0.8rem;
      border-bottom: 1px solid #eef2f7;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }
  }

  &__empty {
    min-height: 120px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 8px;

    .mdi {
      font-size: 20px;
      color: #94a3b8;
    }
  }
}

@media (max-width: 900px) {
  .project-objectives {
    &__header {
      flex-direction: column;
      align-items: stretch;
    }

    &__stats {
      padding-top: 0;
    }
  }

  .objective-row {
    &__summary {
      align-items: flex-start;
    }
  }

  .objective-detail {
    &__totals {
      grid-template-columns: 1fr;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
