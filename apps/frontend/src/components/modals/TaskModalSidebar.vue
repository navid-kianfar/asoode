<template>
  <div class="tms" ref="sidebarRoot">
    <!-- Assignees -->
    <div v-if="wpSettings?.allowMembers !== false" data-section="members" class="tms-section">
      <div class="tms-label-row">
        <span class="tms-label">{{ $t('TASK_MEMBERS') }}</span>
        <button class="tms-add-btn" @click.stop="showMemberMenu = !showMemberMenu">
          <i class="mdi mdi-plus"></i>
        </button>
      </div>
      <div v-if="!task?.members?.length" class="tms-empty">{{ $t('TASK_NO_MEMBERS') }}</div>
      <div v-else class="tms-avatars">
        <span
          v-for="member in task.members"
          :key="member.id"
          class="tms-avatar"
          :title="helpers.resolveUserName((member as any).recordId || (member as any).userId || '')"
        >{{ helpers.resolveUserInitials((member as any).recordId || (member as any).userId || '') }}</span>
      </div>
      <transition name="dropdown-fade">
        <div v-if="showMemberMenu" v-click-outside="() => showMemberMenu = false" class="tms-dropdown tms-member-dropdown" @click.stop>
          <div class="tms-member-search">
            <input
              v-model="memberSearch"
              type="text"
              class="tms-member-search-input"
              :placeholder="$t('SEARCH_OR_INVITE_EMAIL')"
              @keydown.enter="onMemberSearchEnter"
            />
          </div>
          <button
            v-for="pm in filteredProjectMembers"
            :key="pm.recordId"
            class="tms-dropdown-item"
            :class="{ selected: isMemberSelected(pm.recordId) }"
            @click="$emit('toggle-member', pm)"
          >
            <span class="tms-avatar sm">{{ helpers.resolveUserInitials(pm.recordId) }}</span>
            <span class="tms-member-name">{{ helpers.resolveUserName(pm.recordId) || pm.member?.fullName || pm.recordId }}</span>
            <i v-if="isMemberSelected(pm.recordId)" class="mdi mdi-check"></i>
            <i v-if="(pm as any).waiting" class="mdi mdi-loading mdi-spin"></i>
          </button>
          <div v-if="!filteredProjectMembers.length && memberSearch.trim()" class="tms-no-match">
            <span>{{ $t('NO_MEMBERS_FOUND') }}</span>
          </div>
          <button
            v-if="isEmailInput"
            class="tms-dropdown-item tms-invite-item"
            @click="$emit('invite-email', memberSearch.trim()); memberSearch = '';"
          >
            <i class="mdi mdi-email-plus-outline"></i>
            <span class="tms-member-name">{{ $t('INVITE') }} {{ memberSearch.trim() }}</span>
          </button>
        </div>
      </transition>
    </div>

    <!-- Labels -->
    <div v-if="wpSettings?.allowLabels !== false" data-section="labels" class="tms-section">
      <div class="tms-label-row">
        <span class="tms-label">{{ $t('TASK_LABELS') }}</span>
        <button class="tms-add-btn" @click.stop="showLabelMenu = !showLabelMenu">
          <i class="mdi mdi-plus"></i>
        </button>
      </div>
      <div v-if="!task?.labels?.length" class="tms-empty">{{ $t('TASK_NO_LABELS') }}</div>
      <div v-else class="tms-labels">
        <span
          v-for="label in task.labels"
          :key="label.id"
          class="tms-label-chip"
          :style="{ background: label.color }"
        >{{ label.title }}</span>
      </div>
      <transition name="dropdown-fade">
        <div v-if="showLabelMenu" v-click-outside="() => showLabelMenu = false" class="tms-dropdown tms-label-dropdown" @click.stop>
          <button
            v-for="label in wpLabels"
            :key="label.id"
            class="tms-dropdown-item"
            :class="{ selected: isLabelSelected(label.id) }"
            @click="$emit('toggle-label', label)"
          >
            <span class="tms-label-swatch" :style="{ background: label.color }"></span>
            <span>{{ label.title }}</span>
            <i v-if="isLabelSelected(label.id)" class="mdi mdi-check"></i>
          </button>
        </div>
      </transition>
    </div>

    <!-- Dates & Scheduling -->
    <div v-if="wpSettings?.allowEndAt !== false" data-section="dates" class="tms-section">
      <div class="tms-label-row">
        <span class="tms-label">{{ $t('DATES') }}</span>
        <button class="tms-add-btn" @click="openDateEditor">
          <i class="mdi" :class="showDateEditor ? 'mdi-close' : 'mdi-pencil'"></i>
        </button>
      </div>

      <!-- View mode -->
      <div v-if="!showDateEditor" class="tms-dates-view">
        <div v-if="task?.beginAt" class="tms-date-row">
          <i class="mdi mdi-calendar-arrow-right"></i>
          <span class="tms-date-label">{{ $t('START_DATE') }}</span>
          <span class="tms-date-value">{{ helpers.formatDate(task.beginAt) }}</span>
        </div>
        <div v-if="task?.endAt" class="tms-date-row">
          <i class="mdi mdi-calendar-arrow-left"></i>
          <span class="tms-date-label">{{ $t('END_DATE') }}</span>
          <span class="tms-date-value">{{ helpers.formatDate(task.endAt) }}</span>
        </div>
        <div v-if="task?.dueAt" class="tms-date-row">
          <i class="mdi mdi-calendar-clock"></i>
          <span class="tms-date-label">{{ $t('DUE_DATE') }}</span>
          <span class="tms-date-value">{{ helpers.formatDate(task.dueAt) }}</span>
        </div>
        <div v-if="task?.estimatedTime" class="tms-date-row">
          <i class="mdi mdi-timer-outline"></i>
          <span class="tms-date-label">{{ $t('ESTIMATED_TIME') }}</span>
          <span class="tms-date-value">{{ helpers.formatDuration((task.estimatedTime || 0) * 60000) }}</span>
        </div>
        <div v-if="!task?.beginAt && !task?.endAt && !task?.dueAt" class="tms-empty tms-empty-sm">{{ $t('NO_DATE_SET') }}</div>
      </div>

      <!-- Edit mode -->
      <div v-if="showDateEditor" class="tms-dates-edit">
        <div class="tms-date-field">
          <label>{{ $t('START_DATE') }}</label>
          <TaskDatePicker
            :modelValue="dateForm.beginAt ? new Date(dateForm.beginAt) : null"
            @update:modelValue="(d: Date | null) => dateForm.beginAt = d ? d.toISOString().slice(0, 10) : ''"
            :placeholder="$t('SELECT_DATE')"
            clearable
          />
        </div>
        <div class="tms-date-field">
          <label>{{ $t('END_DATE') }}</label>
          <TaskDatePicker
            :modelValue="dateForm.endAt ? new Date(dateForm.endAt) : null"
            @update:modelValue="(d: Date | null) => dateForm.endAt = d ? d.toISOString().slice(0, 10) : ''"
            :placeholder="$t('SELECT_DATE')"
            clearable
          />
        </div>
        <div class="tms-date-field">
          <label>{{ $t('DUE_DATE') }}</label>
          <TaskDatePicker
            :modelValue="dateForm.dueAt ? new Date(dateForm.dueAt) : null"
            @update:modelValue="(d: Date | null) => dateForm.dueAt = d ? d.toISOString().slice(0, 10) : ''"
            :placeholder="$t('SELECT_DATE')"
            clearable
          />
        </div>
        <div class="tms-date-field">
          <label>{{ $t('ESTIMATED_TIME') }}</label>
          <DurationInput v-model="dateForm.estimatedMinutes" size="sm" />
        </div>
        <div class="tms-date-field">
          <label>{{ $t('START_REMINDER') }}</label>
          <AppSelect v-model="dateForm.beginReminder" :items="reminderItems" />
        </div>
        <div class="tms-date-field">
          <label>{{ $t('END_REMINDER') }}</label>
          <AppSelect v-model="dateForm.endReminder" :items="reminderItems" />
        </div>
        <button class="tms-date-save" :disabled="savingDates" @click="saveDates">
          <i v-if="savingDates" class="mdi mdi-loading mdi-spin"></i>
          <template v-else>{{ $t('SAVE') }}</template>
        </button>
      </div>
    </div>

    <!-- Time Tracking -->
    <div v-if="wpSettings?.allowTimeSpent !== false" data-section="time" class="tms-section">
      <div class="tms-label-row">
        <span class="tms-label">{{ $t('TASK_TIME_MANAGEMENT') }}</span>
        <button v-if="isAdmin && !showManualEntry" class="tms-add-btn" :title="$t('ADD_MANUAL_TIME')" @click="showManualEntry = true">
          <i class="mdi mdi-plus"></i>
        </button>
      </div>
      <div class="tms-timer">
        <div class="tms-timer-display ltr">
          <span class="tms-time-unit">
            <span class="tms-time-value">{{ helpers.pad(totalTime.days) }}</span>
            <span class="tms-time-label">{{ $t('DAYS') }}</span>
          </span>
          <span class="tms-time-sep">:</span>
          <span class="tms-time-unit">
            <span class="tms-time-value">{{ helpers.pad(totalTime.hours) }}</span>
            <span class="tms-time-label">{{ $t('HOURS') }}</span>
          </span>
          <span class="tms-time-sep">:</span>
          <span class="tms-time-unit">
            <span class="tms-time-value">{{ helpers.pad(totalTime.minutes) }}</span>
            <span class="tms-time-label">{{ $t('MINUTES') }}</span>
          </span>
        </div>
        <button class="tms-timer-btn" :disabled="recording" @click="onToggleWorking">
          <i v-if="recording" class="mdi mdi-loading mdi-spin"></i>
          <i v-else-if="isWorking" class="mdi mdi-stop"></i>
          <i v-else class="mdi mdi-play"></i>
        </button>
      </div>

      <ManualTimeEntry
        v-if="showManualEntry && task"
        :taskId="task.id"
        :existingEntry="editingTimeEntry ?? undefined"
        @saved="onManualTimeSaved"
        @cancelled="closeManualEntry"
      />

      <div v-if="task?.timeSpents?.length" class="tms-time-logs">
        <div v-for="ts in task.timeSpents" :key="ts.id" class="tms-time-entry">
          <span class="tms-avatar sm">{{ helpers.resolveUserInitials(ts.userId) }}</span>
          <div class="tms-time-info">
            <span class="tms-time-member">{{ helpers.resolveUserName(ts.userId) }}</span>
            <span class="tms-time-range">
              {{ helpers.formatTime(ts.begin) }}
              <template v-if="ts.end"> - {{ helpers.formatTime(ts.end) }}</template>
              <template v-else> - <span class="tms-working-now">{{ $t('CURRENTLY_WORKING') }}</span></template>
            </span>
          </div>
          <span class="tms-time-duration">{{ helpers.formatDuration(helpers.calcDiff(ts)) }}</span>
          <div v-if="isAdmin" class="tms-time-admin">
            <button class="tms-time-admin-btn" :title="$t('EDIT')" @click="editTimeEntry(ts)">
              <i class="mdi mdi-pencil-outline"></i>
            </button>
            <button class="tms-time-admin-btn tms-time-admin-btn--delete" :title="$t('DELETE')" @click="$emit('delete-time-entry', ts)">
              <i class="mdi mdi-trash-can-outline"></i>
            </button>
          </div>
        </div>
      </div>
      <div v-else class="tms-empty tms-empty-sm">{{ $t('NO_TIME_SPENT') }}</div>
    </div>

    <!-- Custom Fields -->
    <div v-if="wpSettings?.allowCustomField !== false && wpCustomFields?.length" data-section="customfields" class="tms-section">
      <div class="tms-label">{{ $t('TASK_CUSTOM_FIELD') }}</div>
      <div v-for="field in wpCustomFields" :key="field.id" class="tms-cf-item">
        <span class="tms-cf-label">{{ field.title }}</span>

        <input
          v-if="field.type === CustomFieldType.Text"
          class="tms-cf-input"
          :value="getFieldValue(field.id)"
          :placeholder="'-'"
          @change="saveFieldValue(field.id, ($event.target as HTMLInputElement).value)"
        />

        <input
          v-else-if="field.type === CustomFieldType.Number"
          class="tms-cf-input"
          type="number"
          :value="getFieldValue(field.id)"
          :placeholder="'-'"
          @change="saveFieldValue(field.id, ($event.target as HTMLInputElement).value)"
        />

        <input
          v-else-if="field.type === CustomFieldType.Date"
          class="tms-cf-input"
          type="date"
          :value="getFieldValue(field.id)"
          @change="saveFieldValue(field.id, ($event.target as HTMLInputElement).value)"
        />

        <AppSelect
          v-else-if="field.type === CustomFieldType.Dropdown"
          :model-value="getFieldValue(field.id)"
          :items="[{ text: '-', value: '' }, ...parseOptions(field.options).map(opt => ({ text: opt, value: opt }))]"
          @update:model-value="saveFieldValue(field.id, $event)"
        />

        <label v-else-if="field.type === CustomFieldType.Checkbox" class="tms-cf-check">
          <input
            type="checkbox"
            :checked="getFieldValue(field.id) === 'true'"
            @change="saveFieldValue(field.id, ($event.target as HTMLInputElement).checked ? 'true' : 'false')"
          />
        </label>

        <span v-else class="tms-cf-value">{{ getFieldValue(field.id) || '-' }}</span>
      </div>
    </div>

    <!-- Voting -->
    <div v-if="wpSettings?.allowPoll !== false" data-section="voting" class="tms-section">
      <div class="tms-label">{{ $t('TASK_VOTES') }}</div>
      <div class="tms-vote-row">
        <button
          class="tms-vote-btn tms-vote-up"
          :class="{ active: myVote === true }"
          :disabled="voting"
          @click="onVote(true)"
        >
          <i class="mdi mdi-thumb-up-outline"></i>
          <span>{{ task?.upVotes || 0 }}</span>
        </button>
        <button
          class="tms-vote-btn tms-vote-down"
          :class="{ active: myVote === false }"
          :disabled="voting"
          @click="onVote(false)"
        >
          <i class="mdi mdi-thumb-down-outline"></i>
          <span>{{ task?.downVotes || 0 }}</span>
        </button>
      </div>
    </div>

    <!-- Location -->
    <div v-if="wpSettings?.allowGeoLocation !== false" data-section="location" class="tms-section">
      <div class="tms-label-row">
        <span class="tms-label">{{ $t('LOCATION') }}</span>
        <button v-if="!showLocationInput" class="tms-add-btn" @click="openLocationEdit">
          <i class="mdi" :class="parsedLocation ? 'mdi-pencil' : 'mdi-plus'"></i>
        </button>
        <button v-else class="tms-add-btn" @click="showLocationInput = false">
          <i class="mdi mdi-close"></i>
        </button>
      </div>
      <div v-if="parsedLocation && !showLocationInput" class="tms-location-preview">
        <TaskMapPicker
          :latitude="parsedLocation.lat"
          :longitude="parsedLocation.lng"
          height="140px"
          readonly
        />
      </div>
      <div v-else-if="!parsedLocation && !showLocationInput" class="tms-empty tms-empty-sm">{{ $t('NO_LOCATION') }}</div>
      <div v-if="showLocationInput" class="tms-location-map-form">
        <TaskMapPicker
          :latitude="mapLat ?? undefined"
          :longitude="mapLng ?? undefined"
          height="180px"
          @update:location="onMapLocationChange"
        />
        <div class="tms-location-actions">
          <button class="tms-location-save" :disabled="savingLocation || mapLat === null" @click="saveMapLocation">
            <i v-if="savingLocation" class="mdi mdi-loading mdi-spin"></i>
            <i v-else class="mdi mdi-check"></i>
            <span>{{ $t('SAVE') }}</span>
          </button>
          <button class="tms-location-cancel" @click="showLocationInput = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Related Tasks -->
    <div v-if="wpSettings?.allowBlockingBoardTasks !== false && !task?.parentId" data-section="related" class="tms-section">
      <div class="tms-label-row">
        <span class="tms-label">{{ $t('TASK_RELATED') }}</span>
        <button class="tms-add-btn" @click.stop="toggleRelatedSearch">
          <i class="mdi" :class="showRelatedSearch ? 'mdi-close' : 'mdi-plus'"></i>
        </button>
      </div>

      <!-- Search / Add UI -->
      <div v-if="showRelatedSearch" class="tms-related-search">
        <div class="tms-related-type-picker">
          <button
            v-for="rt in relationTypes"
            :key="rt.value"
            class="tms-rel-type-btn"
            :class="{ active: selectedRelType === rt.value }"
            @click="selectedRelType = rt.value"
          >
            <i class="mdi" :class="rt.icon"></i>
            <span>{{ $t(rt.label) }}</span>
          </button>
        </div>
        <div class="tms-related-input-wrap">
          <i class="mdi mdi-magnify"></i>
          <input
            ref="relSearchInput"
            v-model="relSearchQuery"
            class="tms-related-input"
            :placeholder="$t('SEARCH_TASKS')"
            @input="onRelSearchInput"
          />
          <i v-if="relSearchLoading" class="mdi mdi-loading mdi-spin"></i>
        </div>
        <div v-if="relSearchResults.length" class="tms-related-results">
          <button
            v-for="result in relSearchResults"
            :key="result.id"
            class="tms-related-result-item"
            :disabled="isAlreadyRelated(result.id)"
            @click="addRelatedTask(result)"
          >
            <i class="mdi" :class="getStateIcon(result.state)"></i>
            <span class="tms-related-result-title">{{ result.title }}</span>
            <span v-if="isAlreadyRelated(result.id)" class="tms-related-added">
              <i class="mdi mdi-check"></i>
            </span>
          </button>
        </div>
        <div v-else-if="relSearchQuery.length >= 2 && !relSearchLoading" class="tms-empty tms-empty-sm">
          {{ $t('NO_RESULTS') }}
        </div>
      </div>

      <div class="tms-related-groups">
        <div class="tms-related-group">
          <span class="tms-related-type">
            <i class="mdi mdi-arrow-right-bold"></i>
            {{ $t('TASK_RELATED_BEFORE') }}
          </span>
          <div v-if="!relatedBefore.length" class="tms-empty tms-empty-sm">{{ $t('NO_DATA') }}</div>
          <div v-for="rel in relatedBefore" :key="rel.id" class="tms-related-item">
            <i class="mdi" :class="getStateIcon(rel.state)"></i>
            <span class="tms-related-item-title tms-clickable" @click="emit('open-task', rel.id)">{{ rel.title }}</span>
            <button class="tms-related-remove" @click="removeRelatedTask('before', rel.id)">
              <i class="mdi mdi-close"></i>
            </button>
          </div>
        </div>
        <div class="tms-related-group">
          <span class="tms-related-type">
            <i class="mdi mdi-arrow-left-bold"></i>
            {{ $t('TASK_RELATED_AFTER') }}
          </span>
          <div v-if="!relatedAfter.length" class="tms-empty tms-empty-sm">{{ $t('NO_DATA') }}</div>
          <div v-for="rel in relatedAfter" :key="rel.id" class="tms-related-item">
            <i class="mdi" :class="getStateIcon(rel.state)"></i>
            <span class="tms-related-item-title tms-clickable" @click="emit('open-task', rel.id)">{{ rel.title }}</span>
            <button class="tms-related-remove" @click="removeRelatedTask('after', rel.id)">
              <i class="mdi mdi-close"></i>
            </button>
          </div>
        </div>
        <div class="tms-related-group">
          <span class="tms-related-type">
            <i class="mdi mdi-block-helper"></i>
            {{ $t('TASK_BLOCKING') }}
          </span>
          <div v-if="!relatedBlocking.length" class="tms-empty tms-empty-sm">{{ $t('NO_DATA') }}</div>
          <div v-for="rel in relatedBlocking" :key="rel.id" class="tms-related-item">
            <i class="mdi" :class="getStateIcon(rel.state)"></i>
            <span class="tms-related-item-title tms-clickable" @click="emit('open-task', rel.id)">{{ rel.title }}</span>
            <button class="tms-related-remove" @click="removeRelatedTask('blocking', rel.id)">
              <i class="mdi mdi-close"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, inject, computed, nextTick, type Ref, type ComputedRef } from 'vue';
import type {
  WorkPackageTaskViewModel,
  WorkPackageLabelViewModel,
  ProjectMemberViewModel,
  WorkPackageTaskTimeViewModel,
  SearchTaskViewModel,
} from '@asoode/shared';
import { CustomFieldType, WorkPackageTaskState } from '@asoode/shared';
import { useTaskStore } from '@/stores/task.store';
import { useAuthStore } from '@/stores/auth.store';
import { useSearchStore } from '@/stores/search.store';
import TaskDatePicker from '@/components/core/TaskDatePicker.vue';
import DurationInput from '@/components/core/DurationInput.vue';
import TaskMapPicker from '@/components/core/TaskMapPicker.vue';
import ManualTimeEntry from '@/components/task/ManualTimeEntry.vue';

const emit = defineEmits<{
  'toggle-label': [label: WorkPackageLabelViewModel];
  'toggle-member': [member: ProjectMemberViewModel];
  'toggle-working': [];
  'delete-time-entry': [entry: WorkPackageTaskTimeViewModel];
  'spend-time': [model: { begin: Date; end?: Date }];
  'invite-email': [email: string];
  'open-task': [taskId: string];
}>();

const task = inject<Ref<WorkPackageTaskViewModel | null>>('task')!;
const wpLabels = inject<Ref<WorkPackageLabelViewModel[]>>('wpLabels')!;
const projectMembers = inject<Ref<ProjectMemberViewModel[]>>('projectMembers')!;
const wpCustomFields = inject<Ref<any[]>>('wpCustomFields')!;
const wpSettings = inject<Ref<Record<string, boolean> | null>>('wpSettings', ref(null));
const isWorking = inject<ComputedRef<boolean>>('isWorking')!;
const isAdmin = inject<ComputedRef<boolean>>('isAdmin', computed(() => false));
const helpers = inject<{
  resolveUserInitials: (id: string) => string;
  resolveUserName: (id: string) => string;
  profileInitials: ComputedRef<string>;
  formatDate: (date: any) => string;
  formatTime: (date: any) => string;
  formatDuration: (ms: number) => string;
  calcDiff: (log: any) => number;
  pad: (n: number) => string;
}>('helpers')!;

// Section refs for scroll targeting
const sidebarRoot = ref<HTMLElement | null>(null);

const showLabelMenu = ref(false);
const showMemberMenu = ref(false);
const memberSearch = ref('');

const filteredProjectMembers = computed(() => {
  const q = memberSearch.value.trim().toLowerCase();
  if (!q) return projectMembers.value;
  return projectMembers.value.filter((pm) => {
    const name = (helpers.resolveUserName(pm.recordId) || pm.member?.fullName || pm.recordId || '').toLowerCase();
    return name.includes(q);
  });
});

const isEmailInput = computed(() => {
  const q = memberSearch.value.trim();
  return q.includes('@') && q.includes('.');
});

function onMemberSearchEnter() {
  if (isEmailInput.value) {
    emit('invite-email', memberSearch.value.trim());
    memberSearch.value = '';
  }
}
const recording = ref(false);
const voting = ref(false);
const showLocationInput = ref(false);
const savingLocation = ref(false);
const showManualEntry = ref(false);
const editingTimeEntry = ref<WorkPackageTaskTimeViewModel | null>(null);
const showDateEditor = ref(false);
const savingDates = ref(false);

function toDateStr(d: any): string {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
}

const dateForm = ref({
  beginAt: '',
  endAt: '',
  dueAt: '',
  estimatedMinutes: 0,
  beginReminder: 1,
  endReminder: 1,
});

const reminderItems = [
  { text: 'None', value: 1 },
  { text: 'At the time', value: 2 },
  { text: '5 minutes before', value: 3 },
  { text: '10 minutes before', value: 4 },
  { text: '15 minutes before', value: 5 },
  { text: '1 hour before', value: 6 },
  { text: '2 hours before', value: 7 },
  { text: '1 day before', value: 8 },
];

const totalTime = computed(() => {
  if (!task.value?.timeSpents?.length) return { days: 0, hours: 0, minutes: 0 };
  const totalMs = task.value.timeSpents
    .map(t => helpers.calcDiff(t))
    .reduce((a, b) => a + b, 0);
  const totalMinutes = Math.floor(totalMs / 60000);
  const days = Math.floor(totalMinutes / (8 * 60));
  const remaining = totalMinutes % (8 * 60);
  const hours = Math.floor(remaining / 60);
  const minutes = remaining % 60;
  return { days, hours, minutes };
});

function isLabelSelected(labelId: string): boolean {
  return !!task.value?.labels?.some(l => l.labelId === labelId);
}

function isMemberSelected(recordId: string): boolean {
  return !!task.value?.members?.some(m => m.recordId === recordId);
}

async function onToggleWorking() {
  recording.value = true;
  emit('toggle-working');
  setTimeout(() => { recording.value = false; }, 1500);
}

function editTimeEntry(entry: WorkPackageTaskTimeViewModel) {
  editingTimeEntry.value = entry;
  showManualEntry.value = true;
}

function onManualTimeSaved() {
  showManualEntry.value = false;
  editingTimeEntry.value = null;
}

function closeManualEntry() {
  showManualEntry.value = false;
  editingTimeEntry.value = null;
}

// ── Date management ─────────────────────────────────────────────────────
const taskStore = useTaskStore();

function openDateEditor() {
  if (showDateEditor.value) {
    showDateEditor.value = false;
    return;
  }
  dateForm.value = {
    beginAt: toDateStr(task.value?.beginAt),
    endAt: toDateStr(task.value?.endAt),
    dueAt: toDateStr(task.value?.dueAt),
    estimatedMinutes: task.value?.estimatedTime || 0,
    beginReminder: (task.value as any)?.beginReminder || 1,
    endReminder: (task.value as any)?.endReminder || 1,
  };
  showDateEditor.value = true;
}

async function saveDates() {
  if (!task.value || savingDates.value) return;
  savingDates.value = true;
  const payload: any = {
    beginReminder: dateForm.value.beginReminder,
    endReminder: dateForm.value.endReminder,
  };
  if (dateForm.value.beginAt) payload.beginAt = new Date(dateForm.value.beginAt);
  else payload.beginAt = null;
  if (dateForm.value.endAt) payload.endAt = new Date(dateForm.value.endAt);
  else payload.endAt = null;
  if (dateForm.value.dueAt) payload.dueAt = new Date(dateForm.value.dueAt);
  else payload.dueAt = null;

  await taskStore.setDate(task.value.id, payload);
  if (dateForm.value.estimatedMinutes !== (task.value.estimatedTime || 0)) {
    await taskStore.changeEstimated(task.value.id, { estimatedTime: dateForm.value.estimatedMinutes });
    (task.value as any).estimatedTime = dateForm.value.estimatedMinutes;
  }
  (task.value as any).beginAt = payload.beginAt;
  (task.value as any).endAt = payload.endAt;
  (task.value as any).dueAt = payload.dueAt;
  (task.value as any).beginReminder = dateForm.value.beginReminder;
  (task.value as any).endReminder = dateForm.value.endReminder;
  showDateEditor.value = false;
  savingDates.value = false;
}

const authStore = useAuthStore();

const myVote = computed((): boolean | null => {
  const userId = authStore.profile?.id;
  if (!userId || !task.value?.votes?.length) return null;
  const found = task.value.votes.find((v: any) => v.userId === userId);
  if (!found) return null;
  return found.vote;
});

async function onVote(vote: boolean) {
  if (!task.value || voting.value) return;
  voting.value = true;
  await taskStore.vote(task.value.id, { vote });
  const userId = authStore.profile?.id;
  if (userId && task.value.votes) {
    const existing = task.value.votes.find((v: any) => v.userId === userId);
    if (existing) {
      existing.vote = vote;
    } else {
      task.value.votes.push({ id: '', vote, userId, taskId: task.value.id } as any);
    }
    task.value.upVotes = task.value.votes.filter((v: any) => v.vote).length;
    task.value.downVotes = task.value.votes.filter((v: any) => !v.vote).length;
  }
  voting.value = false;
}

// ── Location ────────────────────────────────────────────────────────────
const mapLat = ref<number | null>(null);
const mapLng = ref<number | null>(null);

const parsedLocation = computed(() => {
  const geo = (task.value as any)?.geoLocation;
  if (!geo || typeof geo !== 'string') return null;
  const parts = geo.split(',').map((s: string) => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  return null;
});

function openLocationEdit() {
  const loc = parsedLocation.value;
  mapLat.value = loc?.lat ?? null;
  mapLng.value = loc?.lng ?? null;
  showLocationInput.value = true;
}

function onMapLocationChange(loc: { latitude: number; longitude: number }) {
  mapLat.value = loc.latitude;
  mapLng.value = loc.longitude;
}

async function saveMapLocation() {
  if (!task.value || savingLocation.value || mapLat.value === null || mapLng.value === null) return;
  savingLocation.value = true;
  const geoStr = `${mapLat.value},${mapLng.value}`;
  await taskStore.setLocation(task.value.id, { geoLocation: geoStr });
  (task.value as any).geoLocation = geoStr;
  showLocationInput.value = false;
  savingLocation.value = false;
}

// ── Custom field helpers ────────────────────────────────────────────────

function getFieldValue(fieldId: string): string {
  const values = task.value?.customFieldValues || [];
  const found = values.find(v => v.fieldId === fieldId);
  return found?.value || '';
}

function parseOptions(options?: string): string[] {
  if (!options) return [];
  try { return JSON.parse(options); } catch { return []; }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function saveFieldValue(fieldId: string, value: string) {
  if (!task.value) return;
  if (!fieldId || !UUID_RE.test(fieldId)) return;
  const values = task.value.customFieldValues || [];
  const existing = values.find(v => v.fieldId === fieldId);
  if (existing) {
    existing.value = value;
  } else {
    values.push({ id: '', fieldId, taskId: task.value.id, value, createdAt: new Date(), updatedAt: new Date() } as any);
    task.value.customFieldValues = values;
  }
  await taskStore.setCustomFieldValue(task.value.id, fieldId, { value });
}

// ── Related tasks ────────────────────────────────────────────────────────
const searchStore = useSearchStore();

type RelationType = 'before' | 'after' | 'blocking';

interface RelatedTaskEntry {
  id: string;
  title: string;
  state: WorkPackageTaskState;
}

const showRelatedSearch = ref(false);
const selectedRelType = ref<RelationType>('before');
const relSearchQuery = ref('');
const relSearchResults = ref<SearchTaskViewModel[]>([]);
const relSearchLoading = ref(false);
const relSearchInput = ref<HTMLInputElement>();

const relatedBefore = ref<RelatedTaskEntry[]>([]);
const relatedAfter = ref<RelatedTaskEntry[]>([]);
const relatedBlocking = ref<RelatedTaskEntry[]>([]);

const relationTypes: { value: RelationType; label: string; icon: string }[] = [
  { value: 'before', label: 'TASK_RELATED_BEFORE', icon: 'mdi-arrow-right-bold' },
  { value: 'after', label: 'TASK_RELATED_AFTER', icon: 'mdi-arrow-left-bold' },
  { value: 'blocking', label: 'TASK_BLOCKING', icon: 'mdi-block-helper' },
];

function toggleRelatedSearch() {
  showRelatedSearch.value = !showRelatedSearch.value;
  if (showRelatedSearch.value) {
    relSearchQuery.value = '';
    relSearchResults.value = [];
    nextTick(() => relSearchInput.value?.focus());
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function onRelSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout);
  const q = relSearchQuery.value.trim();
  if (q.length < 2) {
    relSearchResults.value = [];
    return;
  }
  relSearchLoading.value = true;
  searchTimeout = setTimeout(async () => {
    const result = await searchStore.search(q);
    if (result?.tasks) {
      // Filter out current task and show only tasks from same work package
      const currentId = task.value?.id;
      const currentWpId = (task.value as any)?.workPackageId;
      relSearchResults.value = result.tasks.filter(t => {
        if (t.id === currentId) return false;
        if (currentWpId && t.workPackageId !== currentWpId) return false;
        return true;
      });
    } else {
      relSearchResults.value = [];
    }
    relSearchLoading.value = false;
  }, 350);
}

function isAlreadyRelated(taskId: string): boolean {
  return relatedBefore.value.some(t => t.id === taskId)
    || relatedAfter.value.some(t => t.id === taskId)
    || relatedBlocking.value.some(t => t.id === taskId);
}

function addRelatedTask(result: SearchTaskViewModel) {
  if (isAlreadyRelated(result.id)) return;
  const entry: RelatedTaskEntry = { id: result.id, title: result.title, state: result.state };
  if (selectedRelType.value === 'before') relatedBefore.value.push(entry);
  else if (selectedRelType.value === 'after') relatedAfter.value.push(entry);
  else relatedBlocking.value.push(entry);
}

function removeRelatedTask(type: RelationType, taskId: string) {
  if (type === 'before') relatedBefore.value = relatedBefore.value.filter(t => t.id !== taskId);
  else if (type === 'after') relatedAfter.value = relatedAfter.value.filter(t => t.id !== taskId);
  else relatedBlocking.value = relatedBlocking.value.filter(t => t.id !== taskId);
}

function getStateIcon(state: WorkPackageTaskState): string {
  switch (state) {
    case WorkPackageTaskState.ToDo: return 'mdi-circle-outline';
    case WorkPackageTaskState.InProgress: return 'mdi-progress-clock';
    case WorkPackageTaskState.Done: return 'mdi-check-circle';
    case WorkPackageTaskState.Paused: return 'mdi-pause-circle-outline';
    case WorkPackageTaskState.Blocked: return 'mdi-block-helper';
    default: return 'mdi-circle-outline';
  }
}

// ── Scroll to section (called from parent) ──────────────────────────────
function scrollToSection(section: string) {
  if (!sidebarRoot.value) return;
  nextTick(() => {
    const target = sidebarRoot.value?.querySelector(`[data-section="${section}"]`) as HTMLElement;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

defineExpose({ scrollToSection });
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.tms {
  width: 280px;
  flex-shrink: 0;
  background: #f8f9fa;
  border-inline-start: 1px solid $divider;
  padding: 20px 16px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.tms-section {
  margin-bottom: 20px;
  position: relative;

  &:last-child { margin-bottom: 0; }
}

.tms-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: $text-secondary;
  margin-bottom: 8px;
}

.tms-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  .tms-label { margin-bottom: 0; }
}

.tms-add-btn {
  width: 22px;
  height: 22px;
  border: 1px dashed $text-disabled;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
  transition: all $transition-fast;

  i { font-size: 0.7rem; }
  &:hover { border-color: $primary; color: $primary; }
}

.tms-empty {
  font-size: 0.75rem;
  color: $text-disabled;
  padding: 8px 0;
}

.tms-empty-sm {
  font-size: 0.7rem;
  padding: 4px 0;
}

// Dropdown
.tms-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 20;
  background: $surface;
  border: none;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
  padding: 6px;
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  gap: 2px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.15); border-radius: 4px; }
}

.tms-member-search {
  padding: 6px 8px;
  border-bottom: 1px solid $divider;
}

.tms-member-search-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid $divider;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  background: transparent;
  color: $text-primary;

  &:focus { border-color: $primary; }
  &::placeholder { color: $text-secondary; }
}

.tms-no-match {
  padding: 8px 12px;
  font-size: 0.75rem;
  color: $text-secondary;
  text-align: center;
}

.tms-invite-item {
  color: $primary;
  font-weight: 500;

  .mdi-email-plus-outline {
    font-size: 1rem;
  }
}

.tms-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  color: $text-primary;
  transition: background 0.15s ease;
  font-family: inherit;

  &:hover { background: rgba(0, 0, 0, 0.04); }
  &.selected { background: rgba($primary, 0.08); font-weight: 500; }

  .mdi-check {
    margin-inline-start: auto;
    color: $success;
    font-size: 0.85rem;
  }

  .mdi-loading {
    margin-inline-start: auto;
    font-size: 0.85rem;
  }
}

// Avatars
.tms-avatars {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tms-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba($primary, 0.12);
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  font-weight: 700;
  flex-shrink: 0;

  &.sm {
    width: 22px;
    height: 22px;
    font-size: 0.48rem;
  }
}

.tms-member-name {
  font-size: 0.78rem;
  color: $text-primary;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Labels
.tms-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tms-label-chip {
  font-size: 0.68rem;
  color: #fff;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  min-width: 30px;
  text-align: center;
}

.tms-label-swatch {
  width: 16px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

// Dates
.tms-dates-view {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tms-date-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  padding: 4px 0;

  i { color: $text-secondary; font-size: 0.85rem; flex-shrink: 0; }
}

.tms-date-label {
  color: $text-secondary;
  min-width: 70px;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.tms-date-value {
  color: $text-primary;
  font-weight: 500;
}

.tms-dates-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tms-date-field {
  display: flex;
  flex-direction: column;
  gap: 3px;

  label {
    font-size: 0.65rem;
    font-weight: 500;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
}

.tms-date-save {
  width: 100%;
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: $primary;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background $transition-fast;
  margin-top: 2px;

  &:hover { background: $primary-dark; }
  &:disabled { opacity: 0.5; cursor: default; }
}

// Timer
.tms-timer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid $divider;
  margin-bottom: 10px;
}

.tms-timer-display {
  display: flex;
  align-items: center;
  gap: 2px;
}

.tms-time-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tms-time-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: $text-primary;
  min-width: 24px;
  text-align: center;
}

.tms-time-label {
  font-size: 0.5rem;
  color: $text-disabled;
  text-transform: uppercase;
}

.tms-time-sep {
  font-size: 1rem;
  font-weight: 600;
  color: $text-disabled;
  padding: 0 1px;
  position: relative;
  top: -5px;
}

.tms-timer-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid $info;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-fast;

  i { font-size: 1rem; color: $info; }

  &:hover { background: rgba($info, 0.06); }
  &:disabled { opacity: 0.4; cursor: default; }
}

// Time logs
.tms-time-logs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tms-time-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: $border-radius-sm;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.tms-time-info {
  flex: 1;
  min-width: 0;

  .tms-time-member {
    display: block;
    font-size: 0.7rem;
    font-weight: 500;
    color: $text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tms-time-range {
    display: block;
    font-size: 0.65rem;
    color: $text-secondary;
  }
}

.tms-working-now {
  color: $info;
  font-weight: 500;
}

.tms-time-duration {
  font-size: 0.75rem;
  font-weight: 500;
  color: $text-primary;
  flex-shrink: 0;
}

// Voting
.tms-vote-row {
  display: flex;
  gap: 8px;
}

.tms-vote-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid $divider;
  border-radius: 20px;
  background: none;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 500;
  color: $text-secondary;
  transition: all $transition-fast;
  font-family: inherit;

  i { font-size: 0.9rem; }

  &:hover { border-color: rgba(0, 0, 0, 0.2); }
  &:disabled { opacity: 0.5; cursor: default; }

  &.tms-vote-up.active {
    background: rgba($success, 0.1);
    border-color: $success;
    color: $success;
  }

  &.tms-vote-down.active {
    background: rgba(#ee6285, 0.1);
    border-color: #ee6285;
    color: #ee6285;
  }
}

// Location
.tms-location-preview {
  border-radius: $border-radius-sm;
  overflow: hidden;
}

.tms-location-map-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tms-location-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.tms-location-save,
.tms-location-cancel {
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all $transition-fast;
  padding: 4px 10px;
  font-size: 0.72rem;
  font-family: inherit;

  i { font-size: 0.85rem; }
}

.tms-location-save {
  background: rgba($success, 0.1);
  color: $success;
  &:hover { background: rgba($success, 0.18); }
  &:disabled { opacity: 0.4; cursor: default; }
}

.tms-location-cancel {
  background: rgba(0, 0, 0, 0.04);
  color: $text-secondary;
  padding: 4px 8px;
  &:hover { background: rgba(0, 0, 0, 0.08); }
}

// Time admin buttons
.tms-time-admin {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.tms-time-entry:hover .tms-time-admin {
  opacity: 1;
}

.tms-time-admin-btn {
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-disabled;
  transition: all $transition-fast;

  i { font-size: 0.7rem; }
  &:hover { color: $primary; background: rgba($primary, 0.08); }

  &--delete:hover { color: $warn; background: rgba($warn, 0.08); }
}

// Related
.tms-related-search {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.tms-related-type-picker {
  display: flex;
  gap: 4px;
}

.tms-rel-type-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 8px;
  border: 1px solid $divider;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  font-size: 0.65rem;
  font-weight: 500;
  color: $text-secondary;
  font-family: inherit;
  transition: all $transition-fast;

  i { font-size: 0.7rem; }
  &:hover { border-color: rgba(0, 0, 0, 0.2); }
  &.active { border-color: $primary; color: $primary; background: rgba($primary, 0.06); }
}

.tms-related-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid $divider;
  border-radius: $border-radius-sm;
  background: $surface;
  transition: border-color $transition-fast;

  &:focus-within { border-color: $primary; }

  .mdi-magnify { color: $text-disabled; font-size: 0.85rem; }
  .mdi-loading { color: $text-disabled; font-size: 0.8rem; }
}

.tms-related-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.75rem;
  font-family: inherit;
  color: $text-primary;
  background: transparent;

  &::placeholder { color: $text-disabled; }
}

.tms-related-results {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 160px;
  overflow-y: auto;
  scrollbar-width: thin;
  border: 1px solid $divider;
  border-radius: 8px;
  padding: 4px;
}

.tms-related-result-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  color: $text-primary;
  font-family: inherit;
  transition: background $transition-fast;

  &:hover:not(:disabled) { background: rgba(0, 0, 0, 0.04); }
  &:disabled { opacity: 0.5; cursor: default; }

  i:first-child { color: $text-secondary; font-size: 0.8rem; flex-shrink: 0; }
}

.tms-related-result-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: start;
}

.tms-related-added {
  color: $success;
  font-size: 0.75rem;
}

.tms-related-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tms-related-group {
  .tms-related-type {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    font-weight: 500;
    color: $text-secondary;
    margin-bottom: 4px;

    i { font-size: 0.8rem; }
  }
}

.tms-related-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  color: $text-primary;
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 3px;

  i:first-child { color: $text-secondary; font-size: 0.8rem; flex-shrink: 0; }
}

.tms-related-item-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.tms-clickable {
    cursor: pointer;
    &:hover {
      text-decoration: underline;
      color: $primary;
    }
  }
}

.tms-related-remove {
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-disabled;
  flex-shrink: 0;
  transition: all $transition-fast;

  i { font-size: 0.65rem; }
  &:hover { color: $warn; background: rgba($warn, 0.08); }
}

// Custom fields
.tms-cf-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);

  &:last-child { border-bottom: none; }
}

.tms-cf-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: $text-primary;
}

.tms-cf-value {
  font-size: 0.75rem;
  color: $text-secondary;
}

.tms-cf-input {
  font-size: 0.75rem;
  padding: 4px 8px;
  border: 1px solid $divider;
  border-radius: 4px;
  background: #fff;
  color: $text-primary;
  max-width: 140px;
  font-family: inherit;
  outline: none;
  transition: border-color $transition-fast;

  &:focus { border-color: $primary-light; }
}

.tms-cf-check {
  display: flex;
  align-items: center;
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: $primary;
  }
}

// Dropdown transition
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

// Responsive
@media (max-width: 960px) {
  .tms {
    width: 100%;
    border-inline-start: none;
    border-top: 1px solid $divider;
  }
}
</style>

<!-- Dark mode -->
<style lang="scss">
@import '@/styles/variables';

body.dark-mode {
  .tms {
    background: #333;
    border-color: #444;
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
  }

  .tms-label { color: #888; }
  .tms-empty { color: #666; }

  .tms-add-btn { border-color: #666; color: #888; &:hover { border-color: #9575CD; color: #9575CD; } }

  .tms-dropdown {
    background: #333;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .tms-dropdown-item {
    color: #ddd;
    &:hover { background: rgba(255, 255, 255, 0.06); }
    &.selected { background: rgba(103, 58, 183, 0.18); }
  }

  .tms-avatar { background: rgba(#9575CD, 0.2); color: #B39DDB; }
  .tms-member-name { color: #ccc; }

  .tms-date-row i { color: #888; }
  .tms-date-label { color: #888; }
  .tms-date-value { color: #ddd; }
  .tms-date-field label { color: #888; }
  .tms-date-save { background: #59a8ef; &:hover { background: lighten(#59a8ef, 8%); } }

  .tms-time-value { color: #ddd; }
  .tms-time-label { color: #666; }
  .tms-time-sep { color: #666; }
  .tms-timer { border-color: #555; }
  .tms-timer-btn {
    border-color: #59a8ef;
    background: #3b3b3b;
    &:hover { background: #444; }
  }

  .tms-time-entry { border-color: #555; }
  .tms-time-member { color: #ccc; }
  .tms-time-range { color: #888; }
  .tms-time-duration { color: #ddd; }

  .tms-related-type { color: #888; }

  .tms-rel-type-btn {
    border-color: #555;
    color: #888;
    &:hover { border-color: #777; }
    &.active { border-color: #9575CD; color: #9575CD; background: rgba(#9575CD, 0.1); }
  }

  .tms-related-input-wrap {
    background: #444;
    border-color: #555;
    &:focus-within { border-color: #9575CD; }
  }
  .tms-related-input { color: #ddd; &::placeholder { color: #666; } }

  .tms-related-results { border-color: #555; }
  .tms-related-result-item {
    color: #ccc;
    &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.06); }
    i:first-child { color: #888; }
  }

  .tms-related-item { border-color: #555; color: #ccc; i:first-child { color: #888; } }
  .tms-related-remove { color: #666; &:hover { color: #ef5350; background: rgba(#ef5350, 0.12); } }

  .tms-vote-btn {
    border-color: #555;
    color: #999;
    &:hover { border-color: #777; }
    &.tms-vote-up.active { background: rgba(#5eb258, 0.15); border-color: #5eb258; color: #5eb258; }
    &.tms-vote-down.active { background: rgba(#ee6285, 0.15); border-color: #ee6285; color: #ee6285; }
  }

  .tms-location-cancel { background: rgba(255, 255, 255, 0.06); color: #888; &:hover { background: rgba(255, 255, 255, 0.1); } }
  .tms-time-admin-btn { color: #666; &:hover { color: #9575CD; background: rgba(#9575CD, 0.12); } &--delete:hover { color: #ef5350; background: rgba(#ef5350, 0.12); } }

  .tms-cf-item { border-color: rgba(255, 255, 255, 0.05); }
  .tms-cf-label { color: #ccc; }
  .tms-cf-value { color: #888; }

  .tms-cf-input {
    background: #444;
    border-color: #555;
    color: #ddd;
    &:focus { border-color: $primary-light; }
  }

  .tms-cf-check input[type="checkbox"] {
    accent-color: $primary-light;
  }
}
</style>
