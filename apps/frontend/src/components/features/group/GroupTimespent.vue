<template>
  <div class="group-timespent-view">
    <div class="timespent-header">
      <div v-if="waiting" class="loading-state">
        <i class="mdi mdi-loading mdi-spin"></i>
      </div>
      
      <div v-else class="filter-shell">
        <!-- Duration picker -->
        <div class="duration-filter">
          <div class="date-navigator">
            <button class="page-btn page-btn--subtle" @click="prev()">
              <i :class="rtl ? 'mdi mdi-chevron-right' : 'mdi mdi-chevron-left'"></i>
            </button>
            <div class="current-range">
              {{ formattedDate }}
              <i class="mdi mdi-calendar-month-outline"></i>
            </div>
            <button class="page-btn page-btn--subtle" @click="next()">
              <i :class="rtl ? 'mdi mdi-chevron-left' : 'mdi mdi-chevron-right'"></i>
            </button>
          </div>
          
          <button class="page-btn page-btn--subtle today-btn" @click="goToday()">
            <i class="mdi mdi-calendar-today"></i>
            {{ $t('GO_TODAY') }}
          </button>
        </div>
      </div>
    </div>

    <template v-if="!waiting && model">
      <!-- Summary Metrics -->
      <div v-if="model.length" class="group-metrics mb-6">
        <div class="group-metrics__card">
          <div class="group-metrics__meta">
            <span class="group-metrics__label">{{ $t('TOTAL_TIME') }}</span>
            <i class="mdi mdi-clock-check-outline"></i>
          </div>
          <div class="group-metrics__value">{{ formatDuration(totalTime) }}</div>
        </div>
        
        <div class="group-metrics__card">
          <div class="group-metrics__meta">
            <span class="group-metrics__label">{{ $t('MEMBERS_TRACKED') }}</span>
            <i class="mdi mdi-account-clock-outline"></i>
          </div>
          <div class="group-metrics__value">{{ memberEntries.length }}</div>
        </div>

        <div class="group-metrics__card">
          <div class="group-metrics__meta">
            <span class="group-metrics__label">{{ $t('AVG_PER_MEMBER') }}</span>
            <i class="mdi mdi-chart-line"></i>
          </div>
          <div class="group-metrics__value">{{ formatDuration(avgTime) }}</div>
        </div>
      </div>

      <!-- Time Spent Table -->
      <div v-if="model.length" class="timespent-table-shell">
        <table class="modern-table">
          <thead>
            <tr>
              <th>{{ $t('MEMBER') }}</th>
              <th class="text-center">{{ $t('TOTAL_HOURS') }}</th>
              <th class="text-center">{{ $t('SESSIONS') }}</th>
              <th>{{ $t('PROGRESS') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in memberEntries" :key="entry.userId">
              <td>
                <div class="member-cell">
                  <div class="member-avatar">
                    <img v-if="entry.avatar" :src="entry.avatar" alt="" />
                    <i v-else class="mdi mdi-account"></i>
                  </div>
                  <span class="member-name">{{ entry.fullName || entry.email || entry.userId }}</span>
                </div>
              </td>
              <td class="text-center font-bold">
                {{ formatDuration(entry.totalMinutes) }}
              </td>
              <td class="text-center">{{ entry.sessions || 0 }}</td>
              <td>
                <div class="progress-container">
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      :style="{ width: maxTime > 0 ? (entry.totalMinutes / maxTime) * 100 + '%' : '0%' }"
                    ></div>
                  </div>
                  <span class="progress-pct">{{ Math.round((entry.totalMinutes / maxTime) * 100) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="!model.length" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-clock-outline"></i>
        </div>
        <h3>{{ $t('NO_TIME_ENTRIES') }}</h3>
        <p>{{ $t('NO_DATA_DESCRIPTION') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useGroupStore } from '@/stores/group.store';
import { useCulturedDate } from '@/composables/useCulturedDate';
import { useCultureStore } from '@/stores/culture.store';
import { AccessType, OperationResultStatus, type GroupViewModel } from '@asoode/shared';

interface MemberTimeEntry {
  userId: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  totalMinutes: number;
  sessions: number;
}

const props = defineProps<{
  group: GroupViewModel;
  permission: AccessType;
}>();

const groupStore = useGroupStore();
const { getConverter } = useCulturedDate();
const cultureStore = useCultureStore();

const waiting = ref(false);
const model = ref<any[] | null>(null);
const beginDate = ref<Date>(new Date());
const endDate = ref<Date>(new Date());

const rtl = computed(() => cultureStore.current.rtl);

const formattedDate = computed(() => {
  if (!beginDate.value) return '';
  const converter = getConverter();
  const parsed = converter.FromDateTime(beginDate.value);
  const monthNames = cultureStore.current.monthNames;
  const monthName = monthNames[parsed.Month - 1] || '';
  return `${monthName} ${parsed.Year}`;
});

const memberEntries = computed<MemberTimeEntry[]>(() => {
  if (!model.value || !Array.isArray(model.value)) return [];

  const memberMap = new Map<string, MemberTimeEntry>();

  for (const item of model.value) {
    const time = item.time;
    if (!time) continue;

    const userId = time.userId || time.member?.id || '';
    if (!userId) continue;

    const beginMs = time.begin ? new Date(time.begin).getTime() : 0;
    const endMs = time.end ? new Date(time.end).getTime() : 0;
    const durationMinutes = beginMs && endMs ? Math.floor((endMs - beginMs) / 60000) : 0;

    const existing = memberMap.get(userId);
    if (existing) {
      existing.totalMinutes += durationMinutes;
      existing.sessions++;
    } else {
      memberMap.set(userId, {
        userId,
        fullName: time.member?.fullName || '',
        email: time.member?.email || '',
        avatar: time.member?.avatar || '',
        totalMinutes: durationMinutes,
        sessions: 1,
      });
    }
  }

  return Array.from(memberMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
});

const totalTime = computed(() =>
  memberEntries.value.reduce((sum, e) => sum + e.totalMinutes, 0)
);
const maxTime = computed(() =>
  Math.max(...memberEntries.value.map((e) => e.totalMinutes), 1)
);
const avgTime = computed(() => {
  if (!memberEntries.value.length) return 0;
  return Math.round(totalTime.value / memberEntries.value.length);
});

function formatDuration(minutes: number): string {
  if (!minutes) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function paintMonth() {
  const converter = getConverter();
  const parsed = converter.FromDateTime(beginDate.value || new Date());
  beginDate.value = converter.ToDateTime({
    Year: parsed.Year,
    Month: parsed.Month,
    Day: 1,
    Hours: 0,
    Minutes: 0,
  });
  const lastDayInMonth = cultureStore.current.daysInMonths[parsed.Month - 1];
  endDate.value = converter.ToDateTime({
    Year: parsed.Year,
    Month: parsed.Month,
    Day: lastDayInMonth,
    Hours: 23,
    Minutes: 59,
  });
}

function prev() {
  const converter = getConverter();
  const parsed = converter.FromDateTime(beginDate.value);
  let year = parsed.Year;
  let month = parsed.Month - 1;
  if (month === 0) {
    month = 12;
    year--;
  }
  beginDate.value = converter.ToDateTime({
    Year: year,
    Month: month,
    Day: 1,
    Hours: 0,
    Minutes: 0,
  });
  paintMonth();
  fetch();
}

function next() {
  const converter = getConverter();
  const parsed = converter.FromDateTime(beginDate.value);
  let year = parsed.Year;
  let month = parsed.Month + 1;
  if (month === 13) {
    month = 1;
    year++;
  }
  beginDate.value = converter.ToDateTime({
    Year: year,
    Month: month,
    Day: 1,
    Hours: 0,
    Minutes: 0,
  });
  paintMonth();
  fetch();
}

function goToday() {
  beginDate.value = new Date();
  paintMonth();
  fetch();
}

async function fetch() {
  model.value = [];
  waiting.value = true;
  const op = await groupStore.timeSpent(props.group.id, {
    begin: beginDate.value,
    end: endDate.value,
  });
  waiting.value = false;
  if (op.status === OperationResultStatus.Success) {
    model.value = op.data || [];
  }
}

onMounted(() => {
  paintMonth();
  fetch();
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.group-timespent-view {
  width: 100%;
}

.timespent-header {
  margin-bottom: 24px;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px;
  i { font-size: 28px; color: #6366f1; }
}

.duration-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  background: white;
  padding: 12px 16px;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.date-navigator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-range {
  font-size: 14px;
  font-weight: 700;
  color: $text-primary;
  min-width: 140px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  i { color: #6366f1; font-size: 16px; }
}

.today-btn {
  font-size: 12px;
  i { font-size: 16px; margin-inline-end: 4px; }
}

/* Updated Metrics Grid from GroupPage */
.group-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }

  &__card {
    padding: 14px 18px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: #cbd5e1;
      background: white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    i { font-size: 20px; color: #6366f1; opacity: 0.8; }
  }

  &__label {
    color: $text-secondary;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__value {
    color: $text-primary;
    font-size: 20px;
    font-weight: 700;
  }
}

/* Modern Table */
.timespent-table-shell {
  background: white;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  overflow: hidden;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;

  th {
    background: #fcfdfe;
    padding: 14px 20px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $text-secondary;
    border-bottom: 1px solid #f1f5f9;
  }

  td {
    padding: 14px 20px;
    font-size: 13.5px;
    color: $text-primary;
    border-bottom: 1px solid #f1f5f9;
  }

  tr:last-child td { border-bottom: none; }
  
  tr:hover td { background: #fafbff; }

  .member-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .member-avatar {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.05);

      img { width: 100%; height: 100%; object-fit: cover; }
      i { color: #6366f1; font-size: 16px; }
    }
    
    .member-name { font-weight: 600; }
  }
}

/* Modern Progress */
.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 140px;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: #f1f5f9;
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #818cf8);
  border-radius: 99px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-pct {
  font-size: 11px;
  font-weight: 700;
  color: $text-secondary;
  width: 30px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
  
  .empty-icon {
    width: 64px;
    height: 64px;
    background: #f8fafc;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    i { font-size: 32px; color: $text-disabled; }
  }

  h3 { font-size: 18px; font-weight: 700; color: $text-primary; margin-bottom: 8px; }
  p { font-size: 14px; color: $text-secondary; max-width: 320px; }
}

.mb-6 { margin-bottom: 24px; }
.text-center { text-align: center; }
.font-bold { font-weight: 700; }
</style>

<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .group-timespent-view {
    .duration-filter {
      background: rgba(30, 41, 59, 0.4);
      border-color: rgba(71, 85, 105, 0.4);
      .current-range { color: $dark-text-light; }
    }

    .group-metrics__card {
      background: rgba(30, 41, 59, 0.7);
      border-color: rgba(71, 85, 105, 0.7);
      &:hover { background: rgba(30, 41, 59, 0.9); border-color: rgba(99, 102, 241, 0.4); }
      .group-metrics__label { color: $dark-text-muted; }
      .group-metrics__value { color: $dark-text-light; }
    }

    .timespent-table-shell {
      background: rgba(30, 41, 59, 0.4);
      border-color: rgba(71, 85, 105, 0.5);
    }

    .modern-table {
      th { background: rgba(15, 23, 42, 0.3); color: $dark-text-muted; border-bottom-color: rgba(71, 85, 105, 0.4); }
      td { color: $dark-text-muted; border-bottom-color: rgba(71, 85, 105, 0.4); }
      tr:hover td { background: rgba(255, 255, 255, 0.03); color: $dark-text-light; }
      
      .member-cell .member-avatar { background: #0f172a; border-color: rgba(71, 85, 105, 0.5); i { color: #818cf8; } }
      .member-name { color: $dark-text-light; }
    }

    .progress-track { background: #1e293b; }
    .progress-fill { background: linear-gradient(90deg, #4f46e5, #6366f1); }
    .progress-pct { color: $dark-text-muted; }

    .empty-icon { background: rgba(30, 41, 59, 0.6); i { color: $dark-text-muted; } }
    .empty-state h3 { color: $dark-text-light; }
    .empty-state p { color: $dark-text-muted; }
  }
}
</style>
