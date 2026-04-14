<template>
  <div class="time-spent-container">
    <div v-if="!data.length" class="no-item">
      <h3>{{ $t('NO_TIME_SPENT_YET') }}</h3>
      <h4>{{ $t('START_RECORDING_TIME') }}</h4>
    </div>
    <div v-if="data.length" class="grid-container">
      <div class="grid">
        <div :class="['grid-col', 'date-col', rtl ? 'grid-col--fixed-right' : 'grid-col--fixed-left']">
          <div class="grid-item grid-item--header">
            <div class="wrapper">
              <div class="ico">
                <i class="mdi mdi-timer-outline"></i>
              </div>
            </div>
          </div>
          <div v-for="(day, dIdx) in data" :key="'date-' + dIdx" class="grid-item">
            <div class="wrapper">
              <div class="num">{{ day.date.Day }}</div>
              <div class="month">{{ day.date.MonthName }}</div>
            </div>
          </div>
        </div>
        <div v-for="hour in hours" :key="'hour-' + hour" class="grid-col time-col">
          <div class="grid-item grid-item--header">
            <div class="hour">{{ pad(hour, 2) }}:00</div>
          </div>
          <div v-for="(day, dIdx) in data" :key="'cell-' + hour + '-' + dIdx" class="grid-item">
            <div class="members-records">
              <div v-for="(member, mIdx) in day.members" :key="'member-' + mIdx" class="member-record">
                <template v-for="(record, rIdx) in member.times" :key="'record-' + rIdx">
                  <div
                    v-if="record.parsed.Hours === hour"
                    :style="record.style"
                    :class="['member-time', 'color-' + record.task.state]"
                    @click.stop.prevent="$emit('open-task', record.task.id)"
                  >
                    <div class="time-line"></div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useCulturedDate } from '@/composables/useCulturedDate';
import { useCultureStore } from '@/stores/culture.store';
import type {
  TimeSpentViewModel,
  TimeSpentMappedViewModel,
  TimeSpentMappedMembersViewModel,
  IDateTimeProperties,
} from '@asoode/shared';

const props = defineProps<{
  beginDate: Date;
  endDate: Date;
  model: any[];
}>();

const emit = defineEmits<{
  (e: 'open-task', taskId: string): void;
}>();

const { getConverter } = useCulturedDate();
const cultureStore = useCultureStore();

const hours = ref<number[]>([]);
const data = ref<TimeSpentMappedViewModel[]>([]);

const rtl = computed(() => cultureStore.current.rtl);

function pad(num: number, size: number): string {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

function calculateStyle(begin: Date, end: Date): Record<string, string> {
  const style: Record<string, string> = {};
  if (rtl.value) {
    style.right = begin.getMinutes() + 'px';
  } else {
    style.left = begin.getMinutes() + 'px';
  }
  const gap = end.getTime() - begin.getTime();
  style.width = gap / 60 / 1000 + 'px';
  return style;
}

function paint() {
  const converter = getConverter();
  const grouped: Record<string, any[]> = {};

  (props.model || []).forEach((m: any) => {
    const copy = { ...m, time: { ...m.time } };
    copy.time.begin = new Date(copy.time.begin);
    copy.time.end = new Date(copy.time.end);
    copy.style = calculateStyle(copy.time.begin, copy.time.end);
    copy.parsed = converter.FromDateTime(copy.time.begin);
    const key = `${copy.parsed.Day}/${copy.parsed.Month}`;
    grouped[key] = grouped[key] || [];
    grouped[key].push(copy);
  });

  const mappedByDate = Object.keys(grouped).map((k) => ({
    date: k,
    data: grouped[k],
  }));

  data.value = mappedByDate.map((m) => {
    const byUser: Record<string, any[]> = {};
    m.data.forEach((d: any) => {
      byUser[d.time.userId] = byUser[d.time.userId] || [];
      byUser[d.time.userId].push(d);
    });
    return {
      members: Object.keys(byUser).map((k) => ({
        userId: k,
        times: byUser[k],
      })),
      title: m.date,
      date: m.data[0].parsed,
    } as TimeSpentMappedViewModel;
  });
}

watch(
  () => props.model,
  () => paint(),
  { deep: true },
);

onMounted(() => {
  hours.value = Array(24)
    .fill(0)
    .map((_, i) => i);
  paint();
});
</script>

<style lang="scss">
.time-spent-container {
  .no-item {
    padding: 20px;
    background: #efefef;
    border-radius: 10px;

    h3 {
      font-weight: 500;
      font-size: 0.9rem;
    }
    h4 {
      font-weight: 400;
      font-size: 0.8rem;
    }
  }

  .grid-container {
    display: grid;
    overflow: auto;
    height: calc(100vh - 283px);
    max-width: 100%;
  }

  .grid {
    display: flex;
    flex-wrap: nowrap;
  }

  .grid-col {
    width: 200px;
    min-width: 200px;

    &.time-col {
      width: 60px;
      min-width: 60px;
    }

    &.date-col {
      width: 70px;
      min-width: 70px;

      .wrapper {
        color: #666666;
        display: flex;
        flex-direction: column;
        text-align: center;
        padding: 5px 0;

        .num {
          font-weight: 500;
          font-size: 1.2rem;
          margin-bottom: 5px;
        }
        .month {
          font-size: 0.8rem;
          margin-bottom: 5px;
        }
        .ico {
          padding: 10px 0 5px;
          i {
            font-size: 2.2rem;
          }
        }
      }
    }
  }

  .grid-item--header {
    height: 50px;
    min-height: 50px;
    position: sticky;
    position: -webkit-sticky;
    background: white;
    top: 0;

    .hour {
      color: #666666;
      font-weight: 500;
      font-size: 0.9rem;
      width: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .grid-col--fixed-left {
    position: sticky;
    left: 0;
    z-index: 998;
    background: white;
  }

  .grid-col--fixed-right {
    position: sticky;
    right: 0;
    z-index: 998;
    background: white;
  }

  .grid-item {
    min-height: 70px;
    border: 1px dashed #e6e6e6;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .members-records {
      .member-record {
        cursor: pointer;
        height: 5px;
        min-width: 5px;
        margin-bottom: 10px;

        .member-time {
          right: 100px;
          width: 150px;
          position: absolute;
          z-index: 2;
          height: 5px;

          .time-line {
            width: 7px;
            height: 7px;
            position: relative;
            top: -1px;
          }

          &.color-1 {
            background: #cccccc;
            .time-line {
              background: #999999;
            }
          }
          &.color-2 {
            background: #59a8ef;
            .time-line {
              background: #1a7cd9;
            }
          }
          &.color-3 {
            background: #5eb258;
            .time-line {
              background: #3d7e39;
            }
          }
          &.color-4 {
            background: #666666;
            .time-line {
              background: #333333;
            }
          }
          &.color-5 {
            background: #b33634;
            .time-line {
              background: #7a2524;
            }
          }
          &.color-6 {
            background: #666666;
            .time-line {
              background: #333333;
            }
          }
          &.color-7 {
            background: #808080;
            .time-line {
              background: #4d4d4d;
            }
          }
          &.color-8 {
            background: #b3b3b3;
            .time-line {
              background: #808080;
            }
          }
          &.color-9 {
            background: #eb973e;
            .time-line {
              background: #c67418;
            }
          }
        }
      }
    }
  }
}

body.dark-mode {
  .time-spent-container {
    .no-item {
      background: #3b3b3b;

      h3,
      h4 {
        color: #999999;
      }
    }

    .grid-item--header {
      background: #313131;
    }

    .grid-col--fixed-left,
    .grid-col--fixed-right {
      background: #313131;
    }

    .grid-col.date-col .wrapper {
      color: #999999;
    }

    .grid-item {
      border-color: #444444;
    }

    .grid-item--header .hour {
      color: #999999;
    }
  }
}
</style>
