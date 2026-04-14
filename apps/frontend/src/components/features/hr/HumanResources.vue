<template>
  <section class="human-resources">
    <header class="human-resources__header">
      <div class="human-resources__heading">
        <p class="human-resources__eyebrow">{{ $t('HUMAN_RESOURCES') }}</p>
        <p class="human-resources__summary">
          Manage attendance, time off, and shift rules with one consistent workspace for the whole group.
        </p>
      </div>

      <div class="human-resources__meta">
        <span class="human-resources__chip">
          <i class="mdi mdi-timeline-clock-outline"></i>
          <strong>{{ entryData.length }}</strong>
          <span>{{ $t('ENTRY_LOGS') }}</span>
        </span>
        <span class="human-resources__chip">
          <i class="mdi mdi-calendar-account-outline"></i>
          <strong>{{ timeOffData.length }}</strong>
          <span>{{ $t('TIME_OFF') }}</span>
        </span>
        <span class="human-resources__chip">
          <i class="mdi mdi-timetable"></i>
          <strong>{{ shiftData.length }}</strong>
          <span>{{ $t('SHIFTS') }}</span>
        </span>
      </div>
    </header>

    <div v-if="autoUpgrading" class="hr-loading-panel">
      <i class="mdi mdi-loading mdi-spin"></i>
    </div>

    <template v-else-if="group.complex">
      <article class="hr-panel">
        <div class="hr-panel__header">
          <div class="hr-panel__title">
            <div class="hr-panel__icon">
              <i class="mdi mdi-timeline-clock-outline"></i>
            </div>
            <div>
              <h3>{{ $t('ENTRY_LOGS') }}</h3>
              <p>{{ $t('ENTRY_LOGS') }} {{ $t('REPORTS') }}</p>
            </div>
          </div>

          <div class="hr-panel__actions">
            <button class="settings-btn settings-btn--secondary" :disabled="!!group.archivedAt" @click="toggleEntry">
              <i class="mdi mdi-clock-start"></i>
              {{ isWorking ? $t('END_ENTRY') : $t('BEGIN_ENTRY') }}
            </button>
            <button
              v-if="isAdminOrOwner"
              class="settings-btn settings-btn--primary"
              :disabled="!!group.archivedAt"
              @click="showManualEntryModal = true; prepareManualEntry()"
            >
              <i class="mdi mdi-plus"></i>
              {{ $t('MANUAL_ENTRY') }}
            </button>
          </div>
        </div>

        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>{{ $t('DATE') }}</th>
                <th>{{ $t('NAME') }}</th>
                <th>{{ $t('BEGIN_TIME') }}</th>
                <th>{{ $t('END_TIME') }}</th>
                <th>{{ $t('DURATION') }}</th>
                <th v-if="isAdminOrOwner"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!entryData.length">
                <td :colspan="isAdminOrOwner ? 6 : 5" class="data-table__empty">{{ $t('NO_DATA') }}</td>
              </tr>
              <tr v-for="entry in entryData" :key="entry.id">
                <td>{{ formatEntryDate(entry.beginAt) }}</td>
                <td>{{ entry.fullName }}</td>
                <td>{{ formatTime(entry.beginAt) }}</td>
                <td>{{ entry.endAt ? formatTime(entry.endAt) : '-' }}</td>
                <td>{{ entry.duration }}</td>
                <td v-if="isAdminOrOwner" class="data-table__ops">
                  <button @click="prepareEditEntry(entry)"><i class="mdi mdi-pencil-outline"></i></button>
                  <button @click="deleteEntry(entry)"><i class="mdi mdi-delete-outline"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="entryTotalPages > 1" class="data-pagination">
            <button :disabled="entryPage <= 1" @click="entryPage--; loadEntries()"><i class="mdi mdi-chevron-left"></i></button>
            <span>{{ entryPage }} / {{ entryTotalPages }}</span>
            <button :disabled="entryPage >= entryTotalPages" @click="entryPage++; loadEntries()"><i class="mdi mdi-chevron-right"></i></button>
          </div>
        </div>
      </article>

      <article class="hr-panel">
        <div class="hr-panel__header">
          <div class="hr-panel__title">
            <div class="hr-panel__icon hr-panel__icon--mint">
              <i class="mdi mdi-calendar-account-outline"></i>
            </div>
            <div>
              <h3>{{ $t('TIME_OFF') }}</h3>
              <p>{{ $t('REQUEST_TIME_OFF') }}</p>
            </div>
          </div>

          <div class="hr-panel__actions">
            <button
              class="settings-btn settings-btn--primary"
              :disabled="!!group.archivedAt"
              @click="showTimeOffModal = true; prepareTimeOff()"
            >
              <i class="mdi mdi-plus"></i>
              {{ $t('REQUEST_TIME_OFF') }}
            </button>
          </div>
        </div>

        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>{{ $t('NAME') }}</th>
                <th>{{ $t('TIME_OFF_AT') }}</th>
                <th>{{ $t('REQUESTED_AT') }}</th>
                <th>{{ $t('STATUS') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!timeOffData.length">
                <td colspan="5" class="data-table__empty">{{ $t('NO_DATA') }}</td>
              </tr>
              <tr v-for="item in timeOffData" :key="item.id">
                <td>{{ item.fullName }}</td>
                <td>
                  <template v-if="item.isHourly">
                    {{ formatDateTime(item.beginAt) }} - {{ formatTime(item.endAt) }}
                  </template>
                  <template v-else>
                    {{ formatEntryDate(item.beginAt) }}
                  </template>
                </td>
                <td>{{ formatEntryDate(item.createdAt) }}</td>
                <td>{{ formatRequestStatus(item.status) }}</td>
                <td class="data-table__ops">
                  <template v-if="item.status === RequestStatus.Pending && isAdminOrOwner">
                    <button @click="approveTimeOff(item)"><i class="mdi mdi-check"></i></button>
                    <button @click="declineTimeOff(item)"><i class="mdi mdi-close"></i></button>
                  </template>
                  <button @click="historyTimeOff(item)"><i class="mdi mdi-magnify"></i></button>
                  <button @click="deleteTimeOff(item)"><i class="mdi mdi-delete-outline"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="timeOffTotalPages > 1" class="data-pagination">
            <button :disabled="timeOffPage <= 1" @click="timeOffPage--; loadTimeOffs()"><i class="mdi mdi-chevron-left"></i></button>
            <span>{{ timeOffPage }} / {{ timeOffTotalPages }}</span>
            <button :disabled="timeOffPage >= timeOffTotalPages" @click="timeOffPage++; loadTimeOffs()"><i class="mdi mdi-chevron-right"></i></button>
          </div>
        </div>
      </article>

      <article class="hr-panel">
        <div class="hr-panel__header">
          <div class="hr-panel__title">
            <div class="hr-panel__icon hr-panel__icon--amber">
              <i class="mdi mdi-timetable"></i>
            </div>
            <div>
              <h3>{{ $t('SHIFTS') }}</h3>
              <p>{{ $t('CREATE_SHIFT') }}</p>
            </div>
          </div>

          <div class="hr-panel__actions">
            <button
              class="settings-btn settings-btn--primary"
              :disabled="!!group.archivedAt"
              @click="showShiftModal = true; prepareCreateShift()"
            >
              <i class="mdi mdi-plus"></i>
              {{ $t('CREATE_SHIFT') }}
            </button>
          </div>
        </div>

        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>{{ $t('TITLE') }}</th>
                <th>{{ $t('SHIFT_RANGE') }}</th>
                <th>{{ $t('SHIFT_TYPE') }}</th>
                <th>{{ $t('SHIFT_FLOAT_LIMIT') }}</th>
                <th>{{ $t('WORKING_HOURS') }}</th>
                <th>{{ $t('RESTING_HOURS') }}</th>
                <th v-if="isAdminOrOwner"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!shiftData.length">
                <td :colspan="isAdminOrOwner ? 7 : 6" class="data-table__empty">{{ $t('NO_DATA') }}</td>
              </tr>
              <tr v-for="shift in shiftData" :key="shift.id">
                <td>{{ shift.title }}</td>
                <td>
                  <template v-if="shift.type !== ShiftType.Open">
                    {{ shift.start }} - {{ shift.end }}
                  </template>
                </td>
                <td>{{ formatShiftType(shift.type) }}</td>
                <td>{{ shift.float }}</td>
                <td>{{ shift.workingHours }}</td>
                <td>{{ shift.restHours }}</td>
                <td v-if="isAdminOrOwner" class="data-table__ops">
                  <button @click="prepareEditShift(shift)"><i class="mdi mdi-pencil-outline"></i></button>
                  <button @click="deleteShift(shift)"><i class="mdi mdi-delete-outline"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <AppModal v-model="showEditEntryModal" :title="$t(editEntryTitle)" :width="500" @close="showEditEntryModal = false">
        <div class="pa-2">
          <div v-if="editEntryTitle === 'MANUAL_ENTRY'" class="mb-4">
            <label class="text-caption text-disabled d-block mb-1">{{ $t('MANUAL_ENTRY_FOR') }}</label>
            <AppSelect v-model="entryForm.userId" :items="memberItems" />
          </div>
          <div class="d-flex ga-4 mb-4">
            <div class="flex-1">
              <label class="text-caption text-disabled d-block mb-1">{{ $t('BEGIN_AT') }}</label>
              <AppInput v-model="entryForm.beginDate" type="date" />
            </div>
            <div class="flex-1">
              <label class="text-caption text-disabled d-block mb-1">&nbsp;</label>
              <AppInput v-model="entryForm.beginTime" type="time" />
            </div>
          </div>
          <div class="d-flex ga-4">
            <div class="flex-1">
              <label class="text-caption text-disabled d-block mb-1">{{ $t('END_AT') }}</label>
              <AppInput v-model="entryForm.endDate" type="date" />
            </div>
            <div class="flex-1">
              <label class="text-caption text-disabled d-block mb-1">&nbsp;</label>
              <AppInput v-model="entryForm.endTime" type="time" />
            </div>
          </div>
        </div>
        <template #footer>
          <v-btn variant="text" @click="showEditEntryModal = false">{{ $t('CANCEL') }}</v-btn>
          <v-btn color="primary" :loading="entryFormWaiting" @click="onSaveEntry">{{ $t(editEntryTitle) }}</v-btn>
        </template>
      </AppModal>

      <AppModal v-model="showTimeOffModal" :title="$t('REQUEST_TIME_OFF')" :width="560" @close="showTimeOffModal = false">
        <div class="pa-2">
          <AppSelect v-model="timeOffForm.isHourly" :items="timeOffTypeItems" class="mb-4" />
          <div class="mb-4">
            <label class="text-caption text-disabled d-block mb-1">{{ $t('TIME_OFF_BEGIN_AT') }}</label>
            <AppInput v-model="timeOffForm.beginDate" type="date" />
          </div>
          <div v-if="timeOffForm.isHourly" class="d-flex ga-4 mb-4">
            <div class="flex-1">
              <label class="text-caption text-disabled d-block mb-1">{{ $t('TIME_OFF_BEGIN_AT_TIME') }}</label>
              <AppInput v-model="timeOffForm.beginTime" type="time" />
            </div>
            <div class="flex-1">
              <label class="text-caption text-disabled d-block mb-1">{{ $t('TIME_OFF_END_AT_TIME') }}</label>
              <AppInput v-model="timeOffForm.endTime" type="time" />
            </div>
          </div>
          <div>
            <label class="text-caption text-disabled d-block mb-1">{{ $t('TIME_OFF_DESCRIPTION') }}</label>
            <AppInput v-model="timeOffForm.description" textarea :rows="3" />
          </div>
        </div>
        <template #footer>
          <v-btn variant="text" @click="showTimeOffModal = false">{{ $t('CANCEL') }}</v-btn>
          <v-btn color="primary" :loading="timeOffFormWaiting" @click="onSubmitTimeOff">{{ $t('REQUEST_TIME_OFF') }}</v-btn>
        </template>
      </AppModal>

      <AppModal v-model="showShiftModal" :title="$t(shiftModalTitle)" :width="640" @close="showShiftModal = false">
        <div class="pa-2">
          <AppInput v-model="shiftForm.title" :placeholder="$t('TITLE')" class="mb-4" />
          <div class="d-flex ga-4 mb-4">
            <div class="flex-1">
              <label class="text-caption text-disabled d-block mb-1">{{ $t('SHIFTS_WORKING_HOURS') }}</label>
              <AppInput v-model.number="shiftForm.workingHours" type="number" min="1" max="12" />
            </div>
            <div class="flex-1">
              <label class="text-caption text-disabled d-block mb-1">{{ $t('SHIFTS_REST_HOURS') }}</label>
              <AppInput v-model.number="shiftForm.restHours" type="number" min="1" max="5" />
            </div>
          </div>
          <div class="d-flex ga-4 mb-4">
            <div class="flex-1">
              <label class="text-caption text-disabled d-block mb-1">{{ $t('SHIFTS_PENALTY_RATE') }}</label>
              <AppInput v-model.number="shiftForm.penaltyRate" type="number" min="1" max="10" step="0.1" />
            </div>
            <div class="flex-1">
              <label class="text-caption text-disabled d-block mb-1">{{ $t('SHIFTS_REWARD_RATE') }}</label>
              <AppInput v-model.number="shiftForm.rewardRate" type="number" min="1" max="10" step="0.1" />
            </div>
          </div>
          <AppSelect v-model="shiftForm.type" :items="shiftTypeItems" :label="$t('SHIFT_TYPE')" class="mb-4" />
          <div v-if="shiftForm.type !== ShiftType.Open" class="d-flex ga-4 mb-4">
            <div class="flex-1">
              <label class="text-caption text-disabled d-block mb-1">{{ $t('SHIFT_START') }}</label>
              <AppInput v-model="shiftForm.start" type="time" />
            </div>
            <div class="flex-1">
              <label class="text-caption text-disabled d-block mb-1">{{ $t('SHIFT_END') }}</label>
              <AppInput v-model="shiftForm.end" type="time" />
            </div>
            <div v-if="shiftForm.type === ShiftType.Float" class="flex-1">
              <label class="text-caption text-disabled d-block mb-1">{{ $t('SHIFT_FLOAT') }}</label>
              <AppInput v-model="shiftForm.float" type="time" />
            </div>
          </div>
          <div class="d-flex flex-wrap ga-4 mb-4">
            <AppCheckbox v-for="day in weekDays" :key="day.field" v-model="shiftForm[day.field]" :label="$t(day.label)" />
          </div>
          <AppInput v-model="shiftForm.description" :placeholder="$t('DESCRIPTION')" textarea :rows="2" />
        </div>
        <template #footer>
          <v-btn variant="text" @click="showShiftModal = false">{{ $t('CANCEL') }}</v-btn>
          <v-btn color="primary" :loading="shiftFormWaiting" @click="onSaveShift">{{ $t(shiftModalTitle) }}</v-btn>
        </template>
      </AppModal>

      <AppModal v-model="showHistoryModal" :title="$t('TIME_OFF_DETAIL')" :width="560" @close="showHistoryModal = false">
        <div class="pa-2">
          <AppWaiting v-if="historyLoading" />
          <div v-else-if="historyData">
            <div v-if="historyData.description" class="mb-4">
              <label class="text-caption text-disabled d-flex">{{ $t('DESCRIPTION') }}</label>
              <p class="text-body-2">{{ historyData.description }}</p>
            </div>
            <div class="mb-2">
              <label class="text-caption text-disabled d-flex">{{ $t('STATUS') }}</label>
              <p class="text-body-2 font-weight-bold">{{ formatRequestStatus(historyData.status) }}</p>
            </div>
          </div>
          <div v-else class="text-center text-disabled py-4">{{ $t('NO_DATA') }}</div>
        </div>
        <template #footer>
          <v-btn variant="text" @click="showHistoryModal = false">{{ $t('CLOSE') }}</v-btn>
        </template>
      </AppModal>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type GroupViewModel,
  AccessType,
  RequestStatus,
  ShiftType,
  OperationResultStatus,
} from '@asoode/shared';
import { useGroupStore } from '@/stores/group.store';
import { useAuthStore } from '@/stores/auth.store';
import { useCulturedDate } from '@/composables/useCulturedDate';
import { httpService } from '@/services/http.service';
import { stringFormat } from '@/plugins/i18n';
import AppWaiting from '@/components/core/AppWaiting.vue';
import AppModal from '@/components/core/AppModal.vue';
import AppSelect from '@/components/core/AppSelect.vue';
import AppInput from '@/components/core/AppInput.vue';
import AppCheckbox from '@/components/core/AppCheckbox.vue';
import { useModal } from '@/composables/useModal';

const props = defineProps<{
  group: GroupViewModel;
  permission: AccessType;
}>();

const { t } = useI18n();
const groupStore = useGroupStore();
const authStore = useAuthStore();
const { getConverter, formatDate, formatDateTime } = useCulturedDate();
const modal = useModal();

const pageSize = 5;
const autoUpgrading = ref(false);

async function autoUpgrade() {
  if (props.group.complex) return;
  autoUpgrading.value = true;
  const op = await groupStore.upgrade(props.group.id);
  if (op.status === OperationResultStatus.Success) {
    (props.group as any).complex = true;
    loadEntries();
    loadTimeOffs();
    loadShifts();
  }
  autoUpgrading.value = false;
}

onMounted(() => {
  if (props.group.complex) {
    loadEntries();
    loadTimeOffs();
    loadShifts();
  } else {
    autoUpgrade();
  }
});

const memberItems = computed(() =>
  (props.group.members || []).map(member => ({
    text: member.member?.fullName || member.userId,
    value: member.userId,
  })),
);

const timeOffTypeItems = computed(() => [
  { text: t('TIME_OFF_HOURLY'), value: true },
  { text: t('TIME_OFF_DAILY'), value: false },
]);

const shiftTypeItems = computed(() => [
  { text: t('ENUMS_SHIFT_TYPE_FIXED'), value: ShiftType.Fixed },
  { text: t('ENUMS_SHIFT_TYPE_FLOAT'), value: ShiftType.Float },
  { text: t('ENUMS_SHIFT_TYPE_OPEN'), value: ShiftType.Open },
]);

const isAdminOrOwner = computed(
  () => props.permission === AccessType.Admin || props.permission === AccessType.Owner,
);

const isWorking = computed(
  () => authStore.profile?.workingGroupId === props.group.id,
);

const entryData = ref<any[]>([]);
const entryPage = ref(1);
const entryTotalPages = ref(0);

async function loadEntries() {
  const result = await httpService.post<any>(`/groups/entry-logs/${props.group.id}`, {
    page: entryPage.value,
    pageSize,
  });
  if (result.status === OperationResultStatus.Success && result.data) {
    entryData.value = result.data.items || result.data || [];
    entryTotalPages.value = result.data.totalPages || 1;
  }
}

function formatEntryDate(date: string | Date): string {
  if (!date) return '';
  return formatDate(date);
}

function formatTime(date: string | Date): string {
  if (!date) return '';
  const value = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(value.getTime())) return '';
  const h = String(value.getHours()).padStart(2, '0');
  const m = String(value.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

async function toggleEntry() {
  const canStart = !isWorking.value;
  const heading = stringFormat(t(canStart ? 'BEGIN_ENTRY_CONFIRM_HEADING' : 'END_ENTRY_CONFIRM_HEADING'), props.group.title);

  modal.confirm({
    title: canStart ? 'BEGIN_ENTRY' : 'END_ENTRY',
    heading,
    message: canStart ? 'BEGIN_ENTRY_CONFIRM' : 'END_ENTRY_CONFIRM',
    actionLabel: canStart ? 'BEGIN_ENTRY' : 'END_ENTRY',
    async action() {
      const op = await groupStore.toggleEntry(props.group.id);
      if (op.status === OperationResultStatus.Success) {
        await loadEntries();
      }
      return op;
    },
  });
}

const showEditEntryModal = ref(false);
const showManualEntryModal = ref(false);
const editEntryTitle = ref('EDIT_ENTRY');
const editingEntryId = ref<string | null>(null);
const entryFormWaiting = ref(false);

const entryForm = reactive({
  userId: '',
  beginDate: '',
  beginTime: '08:00',
  endDate: '',
  endTime: '17:00',
});

function prepareEditEntry(entry: any) {
  editEntryTitle.value = 'EDIT_ENTRY';
  editingEntryId.value = entry.id;
  const begin = new Date(entry.beginAt);
  const end = entry.endAt ? new Date(entry.endAt) : new Date();
  entryForm.beginDate = toDateInputValue(begin);
  entryForm.beginTime = toTimeInputValue(begin);
  entryForm.endDate = toDateInputValue(end);
  entryForm.endTime = toTimeInputValue(end);
  entryForm.userId = '';
  showEditEntryModal.value = true;
}

function prepareManualEntry() {
  editEntryTitle.value = 'MANUAL_ENTRY';
  editingEntryId.value = null;
  const now = new Date();
  entryForm.beginDate = toDateInputValue(now);
  entryForm.beginTime = '08:00';
  entryForm.endDate = toDateInputValue(now);
  entryForm.endTime = '17:00';
  entryForm.userId = authStore.userId || (props.group.members?.[0]?.userId ?? '');
  showEditEntryModal.value = true;
}

async function onSaveEntry() {
  entryFormWaiting.value = true;
  const beginAt = parseDateTimeInputs(entryForm.beginDate, entryForm.beginTime);
  const endAt = parseDateTimeInputs(entryForm.endDate, entryForm.endTime);

  let op;
  if (editingEntryId.value) {
    op = await groupStore.editEntry(editingEntryId.value, { begin: beginAt, end: endAt });
  } else {
    op = await groupStore.manualEntry(props.group.id, {
      begin: beginAt,
      end: endAt,
      userId: entryForm.userId,
    });
  }

  entryFormWaiting.value = false;
  if (op.status === OperationResultStatus.Success) {
    showEditEntryModal.value = false;
    await loadEntries();
  }
}

function deleteEntry(entry: any) {
  const heading = stringFormat(t('REMOVE_ENTRY_CONFIRM_HEADING'), entry.fullName);
  modal.confirm({
    title: 'REMOVE_ENTRY',
    heading,
    message: 'REMOVE_ENTRY_CONFIRM',
    actionLabel: 'REMOVE_ENTRY',
    async action() {
      const op = await groupStore.removeEntry(entry.id);
      if (op.status === OperationResultStatus.Success) {
        await loadEntries();
      }
      return op;
    },
  });
}

const timeOffData = ref<any[]>([]);
const timeOffPage = ref(1);
const timeOffTotalPages = ref(0);
const showTimeOffModal = ref(false);
const timeOffFormWaiting = ref(false);

const timeOffForm = reactive({
  isHourly: true as boolean,
  beginDate: '',
  beginTime: '10:00',
  endTime: '13:00',
  description: '',
});

async function loadTimeOffs() {
  const result = await httpService.post<any>(`/groups/time-offs/${props.group.id}`, {
    page: timeOffPage.value,
    pageSize,
  });
  if (result.status === OperationResultStatus.Success && result.data) {
    timeOffData.value = result.data.items || result.data || [];
    timeOffTotalPages.value = result.data.totalPages || 1;
  }
}

function prepareTimeOff() {
  const now = new Date();
  timeOffForm.isHourly = true;
  timeOffForm.beginDate = toDateInputValue(now);
  timeOffForm.beginTime = '10:00';
  timeOffForm.endTime = '13:00';
  timeOffForm.description = '';
}

async function onSubmitTimeOff() {
  timeOffFormWaiting.value = true;
  const converter = getConverter();
  const dateObj = new Date(`${timeOffForm.beginDate}T00:00:00`);
  const parsed = converter.FromDateTime(dateObj);

  const beginParts = (timeOffForm.isHourly ? timeOffForm.beginTime : '00:00').split(':');
  const endParts = (timeOffForm.isHourly ? timeOffForm.endTime : '23:59').split(':');

  const beginAt = converter.ToDateTime({
    Year: parsed.Year,
    Month: parsed.Month,
    Day: parsed.Day,
    Hours: +beginParts[0],
    Minutes: +beginParts[1],
  });
  const endAt = converter.ToDateTime({
    Year: parsed.Year,
    Month: parsed.Month,
    Day: parsed.Day,
    Hours: +endParts[0],
    Minutes: +endParts[1],
  });

  const op = await groupStore.timeOffRequest(props.group.id, {
    beginAt,
    endAt,
    isHourly: timeOffForm.isHourly,
    description: timeOffForm.description,
  });

  timeOffFormWaiting.value = false;
  if (op.status === OperationResultStatus.Success) {
    showTimeOffModal.value = false;
    await loadTimeOffs();
  }
}

function deleteTimeOff(item: any) {
  modal.confirm({
    title: 'TIME_OFF_DELETE',
    heading: t('TIME_OFF_DELETE_HEADING'),
    message: 'TIME_OFF_DELETE_CONFIRM',
    actionLabel: 'TIME_OFF_DELETE',
    async action() {
      const op = await groupStore.timeOffDelete(item.id);
      if (op.status === OperationResultStatus.Success) {
        await loadTimeOffs();
      }
      return op;
    },
  });
}

function approveTimeOff(item: any) {
  modal.confirm({
    title: 'TIME_OFF_APPROVE',
    message: 'TIME_OFF_APPROVE_CONFIRM',
    actionLabel: 'TIME_OFF_APPROVE',
    async action() {
      const op = await groupStore.timeOffApprove(item.id);
      if (op.status === OperationResultStatus.Success) {
        await loadTimeOffs();
      }
      return op;
    },
  });
}

function declineTimeOff(item: any) {
  modal.confirm({
    title: 'TIME_OFF_DECLINE',
    heading: t('TIME_OFF_DECLINE_HEADING'),
    message: 'TIME_OFF_DECLINE_CONFIRM',
    actionLabel: 'TIME_OFF_DECLINE',
    async action() {
      const op = await groupStore.timeOffDecline(item.id);
      if (op.status === OperationResultStatus.Success) {
        await loadTimeOffs();
      }
      return op;
    },
  });
}

const showHistoryModal = ref(false);
const historyLoading = ref(false);
const historyData = ref<any>(null);

async function historyTimeOff(item: any) {
  showHistoryModal.value = true;
  historyLoading.value = true;
  const result = await groupStore.timeOffDetail(item.id);
  if (result.status === OperationResultStatus.Success) {
    historyData.value = result.data;
  }
  historyLoading.value = false;
}

function formatRequestStatus(status: number): string {
  switch (status) {
    case RequestStatus.Pending:
      return t('ENUMS_REQUEST_STATUS_PENDING');
    case RequestStatus.Approved:
      return t('ENUMS_REQUEST_STATUS_APPROVED');
    case RequestStatus.Canceled:
      return t('ENUMS_REQUEST_STATUS_CANCELED');
    default:
      return '';
  }
}

const shiftData = ref<any[]>([]);
const shiftPage = ref(1);
const shiftTotalPages = ref(0);
const showShiftModal = ref(false);
const shiftModalTitle = ref('CREATE_SHIFT');
const editingShiftId = ref<string | null>(null);
const shiftFormWaiting = ref(false);

const weekDays = [
  { field: 'saturday' as const, label: 'ENUMS_WEEKDAY_SATURDAY' },
  { field: 'sunday' as const, label: 'ENUMS_WEEKDAY_SUNDAY' },
  { field: 'monday' as const, label: 'ENUMS_WEEKDAY_MONDAY' },
  { field: 'tuesday' as const, label: 'ENUMS_WEEKDAY_TUESDAY' },
  { field: 'wednesday' as const, label: 'ENUMS_WEEKDAY_WEDNESDAY' },
  { field: 'thursday' as const, label: 'ENUMS_WEEKDAY_THURSDAY' },
  { field: 'friday' as const, label: 'ENUMS_WEEKDAY_FRIDAY' },
];

const shiftForm = reactive({
  title: '',
  workingHours: 8,
  restHours: 1,
  penaltyRate: 2,
  rewardRate: 1.4,
  type: ShiftType.Fixed as number,
  start: '08:30',
  end: '17:30',
  float: '00:45',
  saturday: true,
  sunday: true,
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  description: '',
});

async function loadShifts() {
  const result = await httpService.post<any>(`/groups/shifts/${props.group.id}`, {
    page: shiftPage.value,
    pageSize,
  });
  if (result.status === OperationResultStatus.Success && result.data) {
    shiftData.value = result.data.items || result.data || [];
    shiftTotalPages.value = result.data.totalPages || 1;
  }
}

function prepareCreateShift() {
  shiftModalTitle.value = 'CREATE_SHIFT';
  editingShiftId.value = null;
  shiftForm.title = '';
  shiftForm.workingHours = 8;
  shiftForm.restHours = 1;
  shiftForm.penaltyRate = 2;
  shiftForm.rewardRate = 1.4;
  shiftForm.type = ShiftType.Fixed;
  shiftForm.start = '08:30';
  shiftForm.end = '17:30';
  shiftForm.float = '00:45';
  shiftForm.saturday = true;
  shiftForm.sunday = true;
  shiftForm.monday = true;
  shiftForm.tuesday = true;
  shiftForm.wednesday = true;
  shiftForm.thursday = true;
  shiftForm.friday = true;
  shiftForm.description = '';
}

function prepareEditShift(shift: any) {
  shiftModalTitle.value = 'EDIT_SHIFT';
  editingShiftId.value = shift.id;
  showShiftModal.value = true;
  shiftForm.title = shift.title || '';
  shiftForm.workingHours = shift.workingHours || 8;
  shiftForm.restHours = shift.restHours || 1;
  shiftForm.penaltyRate = shift.penaltyRate || 2;
  shiftForm.rewardRate = shift.rewardRate || 1.4;
  shiftForm.type = shift.type || ShiftType.Fixed;
  shiftForm.start = shift.start || '08:30';
  shiftForm.end = shift.end || '17:30';
  shiftForm.float = shift.float || '00:45';
  shiftForm.saturday = shift.saturday ?? true;
  shiftForm.sunday = shift.sunday ?? true;
  shiftForm.monday = shift.monday ?? true;
  shiftForm.tuesday = shift.tuesday ?? true;
  shiftForm.wednesday = shift.wednesday ?? true;
  shiftForm.thursday = shift.thursday ?? true;
  shiftForm.friday = shift.friday ?? true;
  shiftForm.description = shift.description || '';
}

async function onSaveShift() {
  shiftFormWaiting.value = true;
  const model = { ...shiftForm };

  let op;
  if (editingShiftId.value) {
    op = await groupStore.editShift(editingShiftId.value, model);
  } else {
    op = await groupStore.createShift(props.group.id, model);
  }

  shiftFormWaiting.value = false;
  if (op.status === OperationResultStatus.Success) {
    showShiftModal.value = false;
    await loadShifts();
  }
}

function deleteShift(shift: any) {
  modal.confirm({
    title: 'REMOVE_SHIFT',
    heading: t('REMOVE_SHIFT_HEADING'),
    message: 'REMOVE_SHIFT_CONFIRM',
    actionLabel: 'REMOVE_SHIFT',
    async action() {
      const op = await groupStore.removeShift(shift.id);
      if (op.status === OperationResultStatus.Success) {
        await loadShifts();
      }
      return op;
    },
  });
}

function formatShiftType(type: number): string {
  switch (type) {
    case ShiftType.Fixed:
      return t('ENUMS_SHIFT_TYPE_FIXED');
    case ShiftType.Float:
      return t('ENUMS_SHIFT_TYPE_FLOAT');
    case ShiftType.Open:
      return t('ENUMS_SHIFT_TYPE_OPEN');
    default:
      return '';
  }
}

function toDateInputValue(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toTimeInputValue(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function parseDateTimeInputs(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
}
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.human-resources {
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;

    @media (max-width: 900px) {
      flex-direction: column;
    }
  }

  &__heading {
    max-width: 640px;
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

.hr-loading-panel {
  min-height: 220px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;

  .mdi {
    font-size: 30px;
    color: #6366f1;
  }
}

.hr-panel {
  padding: 18px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: #fff;
  margin-bottom: 14px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;

    @media (max-width: 900px) {
      flex-direction: column;
    }
  }

  &__title {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: $text-primary;
    }

    p {
      margin: 4px 0 0;
      font-size: 13px;
      color: $text-secondary;
    }
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(79, 70, 229, 0.12);
    color: #4f46e5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--mint {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
    }

    &--amber {
      background: rgba(245, 158, 11, 0.12);
      color: #d97706;
    }

    .mdi {
      font-size: 19px;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.data-table {
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    padding: 10px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $text-secondary;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
  }

  td {
    padding: 12px;
    font-size: 13px;
    color: $text-primary;
    border-bottom: 1px solid #eef2f7;
    vertical-align: middle;
  }

  &__empty {
    text-align: center;
    color: $text-secondary !important;
    padding: 22px !important;
  }

  &__ops {
    white-space: nowrap;
    text-align: right;

    button {
      width: 30px;
      height: 30px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: $text-secondary;
      cursor: pointer;

      &:hover {
        background: #f8fafc;
        color: $text-primary;
      }
    }
  }
}

.data-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-top: 14px;

  button {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    border: 1px solid #dbe3ee;
    background: #fff;
    color: $text-secondary;
    cursor: pointer;

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  span {
    font-size: 12px;
    color: $text-secondary;
    font-weight: 600;
  }
}

.settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  border-radius: 10px;
  padding: 0 14px;
  border: 1px solid transparent;
  background: transparent;
  color: $text-primary;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease, box-shadow 180ms ease;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &--primary {
    color: #fff;
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    box-shadow: 0 12px 24px rgba(67, 56, 202, 0.18);
  }

  &--secondary {
    background: #fff;
    border-color: #dbe3ee;
    color: $text-secondary;
  }
}
</style>

<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .human-resources {
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

  .hr-loading-panel,
  .hr-panel {
    background: rgba(30, 41, 59, 0.72);
    border-color: rgba(71, 85, 105, 0.68);
  }

  .hr-panel__title {
    h3 {
      color: $dark-text-light;
    }

    p {
      color: $dark-text-muted;
    }
  }

  .data-table {
    th {
      color: $dark-text-muted;
      border-bottom-color: rgba(71, 85, 105, 0.7);
    }

    td {
      color: $dark-text-light;
      border-bottom-color: rgba(71, 85, 105, 0.35);
    }

    &__empty {
      color: $dark-text-muted !important;
    }

    &__ops button {
      color: $dark-text-muted;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
        color: $dark-text-light;
      }
    }
  }

  .data-pagination {
    button {
      background: rgba(30, 41, 59, 0.9);
      color: $dark-text-muted;
      border-color: rgba(71, 85, 105, 0.8);
    }

    span {
      color: $dark-text-muted;
    }
  }

  .human-resources .settings-btn--secondary {
    background: rgba(30, 41, 59, 0.9);
    color: $dark-text-muted;
    border-color: rgba(71, 85, 105, 0.8);
  }
}
</style>
