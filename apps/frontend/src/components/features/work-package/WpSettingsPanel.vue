<template>
  <v-navigation-drawer
    :model-value="visible"
    location="right"
    temporary
    width="340"
    class="wp-settings-drawer"
    @update:model-value="!$event && $emit('close')"
  >
    <div class="wp-settings-panel h-100 d-flex flex-column">
      <!-- Header -->
      <div class="wp-settings-header py-4 px-6 d-flex align-center justify-space-between flex-shrink-0">
        <h3 class="text-h6 font-weight-bold">{{ $t('WORK_PACKAGE_SETTING') }}</h3>
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')" />
      </div>

      <v-divider />

      <div class="wp-settings-content flex-grow-1 overflow-y-auto">
        <!-- 1. Notifications -->
      <div class="settings-section" :class="{ 'is-expanded': expanded.notifications }">
        <div class="section-header" @click="toggle('notifications')">
          <v-icon class="mr-2" size="20">mdi-bell-outline</v-icon>
          <span class="section-title">{{ $t('RECEIVE_NOTIFICATION') }}</span>
          <v-icon class="section-chevron">mdi-chevron-down</v-icon>
        </div>
        <div class="section-content">
          <div class="section-body">
            <AppRadio
              v-model="notificationType"
              :items="notificationItems"
              @update:model-value="onNotificationChange"
            />
          </div>
        </div>
      </div>

      <!-- 2. Appearance -->
      <div class="settings-section" :class="{ 'is-expanded': expanded.appearance }">
        <div class="section-header" @click="toggle('appearance')">
          <v-icon class="mr-2" size="20">mdi-palette-outline</v-icon>
          <span class="section-title">{{ $t('APPEARANCE') }}</span>
          <v-icon class="section-chevron">mdi-chevron-down</v-icon>
        </div>
        <div class="section-content">
          <div class="section-body">
            <AppCheckbox
              v-model="showTotal"
              :label="$t('SHOW_LIST_TOTAL_CARDS')"
              @update:model-value="onShowTotalChange"
            />
          </div>
        </div>
      </div>

      <!-- 3. Visibility -->
      <div v-if="canAdmin" class="settings-section" :class="{ 'is-expanded': expanded.visibility }">
        <div class="section-header" @click="toggle('visibility')">
          <v-icon class="mr-2" size="20">mdi-eye-outline</v-icon>
          <span class="section-title">{{ $t('TASK_VISIBILITY') }}</span>
          <v-icon class="section-chevron">mdi-chevron-down</v-icon>
        </div>
        <div class="section-content">
          <div class="section-body">
            <AppRadio
              v-model="visibility"
              :items="visibilityItems"
              @update:model-value="onVisibilityChange"
            />
          </div>
        </div>
      </div>

      <!-- 4/5. Navigation Items -->
      <div v-if="canAdmin" class="settings-section clickable" @click="handleAction('open-permissions')">
        <div class="section-header">
          <v-icon class="mr-2" size="20">mdi-lock-outline</v-icon>
          <span class="section-title">{{ $t('MEMBERS_PERMISSIONS') }}</span>
          <v-icon>mdi-chevron-right</v-icon>
        </div>
      </div>

      <div v-if="canAdmin" class="settings-section clickable" @click="handleAction('open-sort-orders')">
        <div class="section-header">
          <v-icon class="mr-2" size="20">mdi-sort-alphabetical-ascending</v-icon>
          <span class="section-title">{{ $t('SORT_ORDERS') }}</span>
          <v-icon>mdi-chevron-right</v-icon>
        </div>
      </div>

      <div v-if="canAdmin" class="settings-section clickable" @click="handleAction('open-invite')">
        <div class="section-header">
          <v-icon class="mr-2" size="20">mdi-account-plus-outline</v-icon>
          <span class="section-title">{{ $t('INVITE_MEMBER') }}</span>
          <v-icon>mdi-chevron-right</v-icon>
        </div>
      </div>

      <!-- 6. Labels -->
      <div class="settings-section" :class="{ 'is-expanded': expanded.labels }">
        <div class="section-header" @click="toggle('labels')">
          <v-icon class="mr-2" size="20">mdi-tag-multiple-outline</v-icon>
          <span class="section-title">{{ $t('CHANGE_WORK_PACKAGE_LABELS') }}</span>
          <v-icon class="section-chevron">mdi-chevron-down</v-icon>
        </div>
        <div class="section-content">
          <div class="section-body no-p-x">
            <div class="labels-list-compact">
              <div
                v-for="label in wpLabels"
                :key="label.id"
                class="label-item"
                :class="{ 'is-editing': editingLabelId === label.id }"
              >
                <template v-if="editingLabelId !== label.id">
                  <span class="label-indicator" :style="{ background: label.color }"></span>
                  <span class="label-name">{{ label.title }}</span>
                  <div class="label-item-actions">
                    <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" @click="startEditLabel(label)" />
                    <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="deleteLabel(label)" />
                  </div>
                </template>
                <template v-else>
                  <div class="label-edit-inline">
                    <AppInput
                      v-model="editLabelTitle"
                      dense
                      @keydown.enter="saveEditLabel(label)"
                    />
                    <div class="hd-color-picker">
                      <span
                        v-for="c in colorPalette"
                        :key="c"
                        class="color-option"
                        :class="{ active: editLabelColor === c }"
                        :style="{ background: c }"
                        @click="editLabelColor = c"
                      ></span>
                    </div>
                    <div class="hd-form-actions">
                      <v-btn color="primary" size="small" :loading="labelSaving" @click="saveEditLabel(label)">
                        {{ $t('SAVE') }}
                      </v-btn>
                      <v-btn variant="text" size="small" @click="editingLabelId = null">{{ $t('CANCEL') }}</v-btn>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <div class="new-label-trigger" v-if="!showNewLabelForm" @click="showNewLabelForm = true">
              <v-icon size="20" class="mr-2">mdi-plus</v-icon>
              <span>{{ $t('CREATE_NEW_LABEL') }}</span>
            </div>

            <div v-if="showNewLabelForm" class="new-label-compact">
              <AppInput
                v-model="newLabelTitle"
                dense
                :placeholder="$t('LABEL_NAME')"
                @keydown.enter="addLabel"
              />
              <div class="hd-color-picker">
                <span
                  v-for="c in colorPalette"
                  :key="c"
                  class="color-option"
                  :class="{ active: newLabelColor === c }"
                  :style="{ background: c }"
                  @click="newLabelColor = c"
                ></span>
              </div>
              <div class="hd-form-actions">
                <v-btn color="primary" size="small" :disabled="!newLabelTitle.trim()" :loading="labelSaving" @click="addLabel">
                  {{ $t('ADD') }}
                </v-btn>
                <v-btn variant="text" size="small" @click="showNewLabelForm = false">{{ $t('CANCEL') }}</v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 7. Custom Fields -->
      <div class="settings-section" :class="{ 'is-expanded': expanded.customFields }">
        <div class="section-header" @click="toggle('customFields')">
          <v-icon class="mr-2" size="20">mdi-form-textbox</v-icon>
          <span class="section-title">{{ $t('CUSTOM_FIELDS') }}</span>
          <v-icon class="section-chevron">mdi-chevron-down</v-icon>
        </div>
        <div class="section-content">
          <div class="section-body no-p-x">
            <WpCustomFieldsManager />
          </div>
        </div>
      </div>

      <!-- 8. Danger Zone -->
      <div class="settings-section" :class="{ 'is-expanded': expanded.danger }">
        <div class="section-header" @click="toggle('danger')">
          <v-icon class="mr-2" size="20" color="error">mdi-alert-circle-outline</v-icon>
          <span class="section-title text-error">{{ $t('DANGER_ZONE') }}</span>
          <v-icon class="section-chevron">mdi-chevron-down</v-icon>
        </div>
        <div class="section-content">
          <div class="section-body no-p-x">
            <div class="danger-list">
              <div class="danger-item" @click="$emit('leave')">
                <v-icon class="mr-2">mdi-exit-to-app</v-icon>
                <span>{{ $t('LEAVE_WORK_PACKAGE') }}</span>
              </div>
              <div v-if="canAdmin" class="danger-item" @click="$emit('archive')">
                <v-icon class="mr-2">mdi-archive-outline</v-icon>
                <span>{{ $t('ARCHIVE_WORK_PACKAGE') }}</span>
              </div>
              <div v-if="isOwner" class="danger-item text-error" @click="$emit('remove')">
                <v-icon class="mr-2">mdi-delete-outline</v-icon>
                <span>{{ isSimpleProject ? $t('DELETE_PROJECT') : $t('REMOVE_WORK_PACKAGE') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div> <!-- Closes .wp-settings-content -->
  </div> <!-- Closes .wp-settings-panel -->
</v-navigation-drawer>
</template>
<script setup lang="ts">
import { ref, reactive, computed, watch, inject, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type WorkPackageViewModel,
  type WorkPackageLabelViewModel,
  type ProjectViewModel,
  AccessType,
  ReceiveNotificationType,
  WorkPackageTaskVisibility,
  OperationResultStatus,
} from '@asoode/shared';
import { useWorkPackageStore } from '@/stores/work-package.store';
import WpCustomFieldsManager from './WpCustomFieldsManager.vue';
import AppRadio from '@/components/core/AppRadio.vue';
import AppCheckbox from '@/components/core/AppCheckbox.vue';
import AppInput from '@/components/core/AppInput.vue';

// ─── Props & Emits ───────────────────────────────────────────────────
const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  leave: [];
  archive: [];
  remove: [];
  'open-permissions': [];
  'open-sort-orders': [];
  'open-invite': [];
  'save-setting': [payload: Record<string, any>];
  'save-user-setting': [payload: Record<string, any>];
}>();

// ─── Keyboard Accessibility ──────────────────────────────────────────
const handleEsc = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible) {
    emit('close');
  }
};

onMounted(() => window.addEventListener('keydown', handleEsc));
onUnmounted(() => window.removeEventListener('keydown', handleEsc));

// ─── Injections ──────────────────────────────────────────────────────
const workPackage = inject<Ref<WorkPackageViewModel | null>>('workPackage')!;
const projectData = inject<Ref<ProjectViewModel | null>>('projectData', ref(null));
const permission = inject<ComputedRef<AccessType>>('permission')!;

// ─── Store ───────────────────────────────────────────────────────────
const { t } = useI18n();
const wpStore = useWorkPackageStore();

// ─── Permission & Project Helpers ────────────────────────────────────
const canAdmin = computed(() => permission.value === AccessType.Owner || permission.value === AccessType.Admin);
const isOwner = computed(() => permission.value === AccessType.Owner);
const isSimpleProject = computed(() => projectData.value?.complex === false);

// ─── Expanded state ──────────────────────────────────────────────────
const expanded = reactive({
  notifications: true,
  appearance: false,
  visibility: false,
  labels: false,
  customFields: false,
  danger: false,
});

function toggle(section: keyof typeof expanded) {
  expanded[section] = !expanded[section];
}

/**
 * Handles actions that should close the sidebar before proceeding (e.g., opening modals)
 */
function handleAction(event: 'open-permissions' | 'open-sort-orders' | 'open-invite') {
  emit('close');
  emit(event as any);
}

// ─── Notifications ───────────────────────────────────────────────────
const notificationType = ref<ReceiveNotificationType>(ReceiveNotificationType.ReceiveAll);

const notificationItems = computed(() => [
  { text: t('RECEIVE_ALL_NOTIFICATION'), value: ReceiveNotificationType.ReceiveAll },
  { text: t('RECEIVE_MINE_NOTIFICATION'), value: ReceiveNotificationType.ReceiveMine },
  { text: t('RECEIVE_NONE_NOTIFICATION'), value: ReceiveNotificationType.ReceiveNone },
]);

watch(
  () => (workPackage.value?.userSetting as any)?.notificationType,
  (val) => { if (val !== undefined) notificationType.value = val; },
  { immediate: true }
);

function onNotificationChange() {
  emit('save-user-setting', { notificationType: notificationType.value });
}

// ─── Appearance ──────────────────────────────────────────────────────
const showTotal = ref(false);

watch(
  () => (workPackage.value as any)?.showTotal,
  (val) => { if (val !== undefined) showTotal.value = val; },
  { immediate: true }
);

function onShowTotalChange() {
  emit('save-setting', { showTotal: showTotal.value });
}

// ─── Visibility ──────────────────────────────────────────────────────
const visibility = ref<WorkPackageTaskVisibility>(WorkPackageTaskVisibility.Normal);

const visibilityItems = computed(() => [
  { text: t('ENUMS_TASK_VISIBILITY_NORMAL'), value: WorkPackageTaskVisibility.Normal },
  { text: t('ENUMS_TASK_VISIBILITY_MEMBERS_ONLY'), value: WorkPackageTaskVisibility.MembersOnly },
]);

watch(
  () => (workPackage.value as any)?.visibility,
  (val) => { if (val !== undefined) visibility.value = val; },
  { immediate: true }
);

function onVisibilityChange() {
  emit('save-setting', { visibility: visibility.value });
}

// ─── Labels ──────────────────────────────────────────────────────────
const wpLabels = computed(() => workPackage.value?.labels || []);
const labelSaving = ref(false);
const showNewLabelForm = ref(false);

const newLabelTitle = ref('');
const newLabelColor = ref('#7c4dff');

const editingLabelId = ref<string | null>(null);
const editLabelTitle = ref('');
const editLabelColor = ref('');

const colorPalette = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
  '#ff5722', '#795548', '#9e9e9e', '#607d8b', '#000000'
];

async function addLabel() {
  if (!newLabelTitle.value.trim() || !workPackage.value) return;
  labelSaving.value = true;
  const op = await wpStore.createLabel(workPackage.value.id, {
    title: newLabelTitle.value,
    color: newLabelColor.value,
    darkColor: false,
  });
  labelSaving.value = false;
  if (op.status === OperationResultStatus.Success) {
    newLabelTitle.value = '';
    showNewLabelForm.value = false;
  }
}

function startEditLabel(label: WorkPackageLabelViewModel) {
  editingLabelId.value = label.id;
  editLabelTitle.value = label.title;
  editLabelColor.value = label.color;
}

async function saveEditLabel(label: WorkPackageLabelViewModel) {
  if (!editLabelTitle.value.trim()) return;
  labelSaving.value = true;
  const op = await wpStore.renameLabel(label.id, {
    title: editLabelTitle.value,
    color: editLabelColor.value,
    darkColor: false,
  });
  labelSaving.value = false;
  if (op.status === OperationResultStatus.Success) {
    editingLabelId.value = null;
  }
}

async function deleteLabel(label: WorkPackageLabelViewModel) {
  if (!workPackage.value) return;
  await wpStore.removeLabel(label.id);
}
</script>

<style lang="scss">
@import '@/styles/variables';

.wp-settings-modal-body {
  max-height: 70vh;
  overflow-y: auto;
  margin: -24px; // Cancel AppModal body padding for flush accordion
}

// ─── Variables Overlay ─────────────────────────────────────────────
$hd-bg: #FFFFFF;
$hd-secondary-bg: #F7F8F9;
$hd-text-primary: #292d34;
$hd-text-secondary: #656f7d;
$hd-hover-bg: #F0F1F4;

.wp-settings-panel {
  height: 100vh;
  background: $hd-bg;
  display: flex;
  flex-direction: column;
  color: $hd-text-primary;
  border-left: 1px solid rgba(0,0,0,0.05);

  .panel-header {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    flex-shrink: 0;

    .panel-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .panel-title {
      font-size: 13px;
      font-weight: 700;
      color: $hd-text-primary;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .panel-close {
      cursor: pointer;
      font-size: 18px;
      color: $hd-text-secondary;
      padding: 4px;
      border-radius: 4px;
      &:hover { background: $hd-hover-bg; color: $hd-text-primary; }
    }
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0; // Tighter padding
  }
}

// ─── High Density Sections ─────────────────────────────────────────
.settings-section {
  border-bottom: 1px solid rgba(0,0,0,0.06);
  margin: 0; 
  padding: 0;
  background: $hd-bg;

  &.clickable:hover {
    background: $hd-hover-bg;
    cursor: pointer;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px;
    cursor: pointer;
    user-select: none;
    transition: background 0.1s;

    &:hover { background: $hd-secondary-bg; }

    .section-header-icon {
      font-size: 16px;
      color: $hd-text-secondary;
      width: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .section-title {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      color: $hd-text-primary;
    }

    .section-chevron, .section-arrow {
      font-size: 14px;
      color: #b0b4b9;
      transition: transform 0.2s;
    }
  }

  .section-content {
    display: none;
    overflow: hidden;
    background: inherit;

    & > div {
      min-height: 0;
    }
  }

  &.is-expanded {
    .section-chevron { transform: rotate(180deg); }
    .section-content {
      display: grid;
      grid-template-rows: 1fr;
      padding-bottom: 8px;
    }
  }

  .section-body {
    padding: 4px 16px 4px 16px; 
  }

  .no-p-x { padding-right: 0; padding-left: 0; }
}

// ─── Labels UI Refined ─────────────────────────────────────────────
.labels-list-compact {
  padding: 0 16px;
  margin-bottom: 8px;
}

.label-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  margin-bottom: 2px;
  &:hover {
    background: $hd-hover-bg;
    .label-item-actions { opacity: 1; }
  }

  .label-indicator {
    width: 6px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .label-name { flex: 1; font-size: 12px; font-weight: 500; }

  .label-item-actions {
    display: flex;
    gap: 8px;
    opacity: 0;
    i {
      font-size: 14px;
      color: $hd-text-secondary;
      cursor: pointer;
      &:hover { color: $hd-text-primary; }
    }
  }
}

.new-label-trigger {
  margin: 8px 16px 8px 42px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: $primary;
  cursor: pointer;
  border: 1px dashed rgba($primary, 0.4);
  border-radius: 6px;
  transition: all 0.2s;
  background: rgba($primary, 0.02);

  &:hover { 
    background: rgba($primary, 0.05); 
    border-color: $primary; 
    text-decoration: none; 
  }
  i { font-size: 14px; }
}

.label-edit-inline, .new-label-compact {
  padding: 10px 16px;
  background: $hd-secondary-bg;
  border-radius: 6px;
  margin: 4px 16px;
}

.hd-color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
  .color-option {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
    &.active { border-color: #292d34; }
  }
}

.hd-form-actions {
  display: flex;
  gap: 6px;
}

.hd-btn {
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  
  &-primary { background: $primary; color: #fff; }
  &-ghost { background: transparent; color: $hd-text-secondary; border-color: #ddd; &:hover { background: #eee; } }
}

// ─── Danger List ───────────────────────────────────────────────────
.danger-list {
  padding: 4px 0;
}

.danger-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 16px 15px 42px;
  font-size: 12.5px;
  font-weight: 500;
  color: $hd-text-secondary;
  cursor: pointer;
  transition: all 0.1s;
  
  i { font-size: 16px; }
  &:hover { background: #ffebee; color: #d32f2f; }
  &.text-danger { color: #d32f2f; }
}

// ─── Transitions ───────────────────────────────────────────────────
.wp-settings-backdrop-enter-active, .wp-settings-backdrop-leave-active { transition: opacity 0.2s; }
.wp-settings-backdrop-enter-from, .wp-settings-backdrop-leave-to { opacity: 0; }

.wp-settings-slide-enter-active, .wp-settings-slide-leave-active { transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.wp-settings-slide-enter-from, .wp-settings-slide-leave-to { transform: translateX(100%); }

// ─── Dark Mode Support ─────────────────────────────────────────────
body.dark-mode {
  .wp-settings-panel {
    background: #1e2023;
    border-left-color: #2a2d32;
    .panel-header { border-bottom-color: #2a2d32; .panel-title { color: #eee; } }
    .settings-section { border-bottom-color: #2a2d32; .section-title { color: #eee; } .section-header:hover { background: #24272b; } }
    .label-item:hover { background: #24272b; .label-name { color: #eee; } }
    .label-edit-inline, .new-label-compact { background: #24272b; }
    .danger-item { &:hover { background: #3c1e22; color: #ff8a80; } }
  }
}
</style>
