<template>
  <div class="mte">
    <div class="mte__header">
      <span class="mte__title">{{ existingEntry ? $t('EDIT_TIME_ENTRY') : $t('ADD_TIME_ENTRY') }}</span>
      <button class="mte__close" @click="$emit('cancelled')">
        <i class="mdi mdi-close"></i>
      </button>
    </div>

    <div class="mte__form">
      <!-- Begin -->
      <div class="mte__row">
        <label class="mte__field-label">{{ $t('START') }}</label>
        <div class="mte__datetime">
          <TaskDatePicker v-model="beginDate" :placeholder="$t('SELECT_DATE')" />
          <input type="time" v-model="beginTime" class="mte__time-input" />
        </div>
      </div>

      <!-- End -->
      <div class="mte__row">
        <label class="mte__field-label">{{ $t('END') }}</label>
        <div class="mte__datetime">
          <TaskDatePicker v-model="endDate" :placeholder="$t('SELECT_DATE')" :clearable="true" />
          <input type="time" v-model="endTime" class="mte__time-input" />
        </div>
      </div>

      <!-- Duration preview -->
      <div v-if="durationPreview" class="mte__duration">
        <i class="mdi mdi-clock-outline"></i>
        <span>{{ durationPreview }}</span>
      </div>

      <!-- Error -->
      <div v-if="error" class="mte__error">
        <i class="mdi mdi-alert-circle-outline"></i>
        <span>{{ error }}</span>
      </div>
    </div>

    <div class="mte__actions">
      <button class="mte__btn mte__btn--save" :disabled="saving || !isValid" @click="save">
        <i v-if="saving" class="mdi mdi-loading mdi-spin"></i>
        <template v-else>{{ $t('SAVE') }}</template>
      </button>
      <button class="mte__btn mte__btn--cancel" @click="$emit('cancelled')">
        {{ $t('CANCEL') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { WorkPackageTaskTimeViewModel } from '@asoode/shared';
import { useTaskStore } from '@/stores/task.store';
import TaskDatePicker from '@/components/core/TaskDatePicker.vue';

const props = defineProps<{
  taskId: string;
  existingEntry?: WorkPackageTaskTimeViewModel;
}>();

const emit = defineEmits<{ saved: []; cancelled: [] }>();

const taskStore = useTaskStore();
const saving = ref(false);
const error = ref('');

const beginDate = ref<Date | null>(null);
const beginTime = ref('09:00');
const endDate = ref<Date | null>(null);
const endTime = ref('17:00');

// Pre-fill if editing
onMounted(() => {
  if (props.existingEntry) {
    const begin = new Date(props.existingEntry.begin);
    beginDate.value = begin;
    beginTime.value = `${String(begin.getHours()).padStart(2, '0')}:${String(begin.getMinutes()).padStart(2, '0')}`;

    if (props.existingEntry.end) {
      const end = new Date(props.existingEntry.end);
      endDate.value = end;
      endTime.value = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    }
  }
});

const isValid = computed(() => {
  if (!beginDate.value || !beginTime.value) return false;
  if (endDate.value && endTime.value) {
    const begin = buildDateTime(beginDate.value, beginTime.value);
    const end = buildDateTime(endDate.value, endTime.value);
    return end > begin;
  }
  return true;
});

const durationPreview = computed(() => {
  if (!beginDate.value || !beginTime.value || !endDate.value || !endTime.value) return '';
  const begin = buildDateTime(beginDate.value, beginTime.value);
  const end = buildDateTime(endDate.value, endTime.value);
  const diff = end.getTime() - begin.getTime();
  if (diff <= 0) return '';
  const totalMinutes = Math.floor(diff / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
});

function buildDateTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(hours || 0, minutes || 0, 0, 0);
  return d;
}

async function save() {
  if (!isValid.value || saving.value) return;
  error.value = '';
  saving.value = true;

  const begin = buildDateTime(beginDate.value!, beginTime.value);
  const end = endDate.value && endTime.value ? buildDateTime(endDate.value, endTime.value) : undefined;

  const result = await taskStore.spendTime(props.taskId, { begin, end });
  saving.value = false;

  if (result.status === 1) { // OperationResultStatus.Success
    emit('saved');
  } else {
    error.value = 'Failed to save time entry';
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.mte {
  background: rgba($primary, 0.03);
  border: 1px solid rgba($primary, 0.12);
  border-radius: $border-radius-md;
  padding: 12px;
  margin-top: 8px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &__title {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: $primary;
  }

  &__close {
    width: 22px;
    height: 22px;
    border: none;
    background: none;
    cursor: pointer;
    color: $text-disabled;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all $transition-fast;

    i { font-size: 0.8rem; }
    &:hover { background: rgba(0, 0, 0, 0.06); color: $text-primary; }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__row {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__field-label {
    font-size: 0.62rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: $text-secondary;
  }

  &__datetime {
    display: flex;
    gap: 6px;
    align-items: flex-start;

    > :first-child { flex: 1; }
  }

  &__time-input {
    width: 80px;
    padding: 7px 8px;
    border: 1px solid $divider;
    border-radius: $border-radius-sm;
    font-size: 0.78rem;
    font-family: inherit;
    color: $text-primary;
    background: $surface;
    outline: none;
    flex-shrink: 0;

    &:focus { border-color: $primary; }
  }

  &__duration {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: $success;
    font-weight: 500;
    padding: 4px 0;

    i { font-size: 0.85rem; }
  }

  &__error {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: $warn;
    padding: 4px 0;

    i { font-size: 0.85rem; }
  }

  &__actions {
    display: flex;
    gap: 6px;
    margin-top: 8px;
  }

  &__btn {
    padding: 6px 14px;
    border: none;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all $transition-fast;

    &--save {
      background: $primary;
      color: #fff;
      flex: 1;

      &:hover { background: $primary-dark; }
      &:disabled { opacity: 0.4; cursor: default; }
    }

    &--cancel {
      background: rgba(0, 0, 0, 0.06);
      color: $text-secondary;

      &:hover { background: rgba(0, 0, 0, 0.1); }
    }
  }
}
</style>

<!-- Dark mode -->
<style lang="scss">
body.dark-mode {
  .mte {
    background: rgba(#9575CD, 0.06);
    border-color: rgba(#9575CD, 0.15);
  }

  .mte__title { color: #9575CD; }
  .mte__close { color: #666; &:hover { background: rgba(255, 255, 255, 0.06); color: #ccc; } }
  .mte__field-label { color: #888; }
  .mte__time-input { background: #444; border-color: #555; color: #ddd; &:focus { border-color: #9575CD; } }
  .mte__duration { color: #5eb258; }
  .mte__error { color: #ef5350; }

  .mte__btn--save { background: #9575CD; &:hover { background: lighten(#9575CD, 8%); } }
  .mte__btn--cancel { background: rgba(255, 255, 255, 0.06); color: #888; &:hover { background: rgba(255, 255, 255, 0.1); } }
}
</style>
