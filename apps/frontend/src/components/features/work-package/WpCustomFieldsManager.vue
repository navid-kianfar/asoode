<template>
  <div class="wp-cf-manager-hd">
    <!-- Disabled State -->
    <div v-if="!isEnabled" class="cf-hd-empty">
      <p class="cf-hd-desc">{{ $t('CUSTOM_FIELDS_DETAIL') }}</p>
      <button
        class="hd-btn hd-btn-primary"
        :disabled="enabling"
        @click="enableCustomFields"
      >
        <i v-if="enabling" class="mdi mdi-loading mdi-spin"></i>
        <span v-else>{{ $t('ACTIVATE') }}</span>
      </button>
    </div>

    <!-- Enabled State -->
    <template v-else>
      <div class="cf-hd-list">
        <div
          v-for="field in fields"
          :key="field.id"
          class="cf-hd-item"
        >
          <div class="cf-hd-item-main">
            <i class="mdi cf-hd-type-icon" :class="typeIcon(field.type)"></i>
            <div class="cf-hd-info">
              <span class="cf-hd-title">{{ field.title }}</span>
              <span class="cf-hd-meta">{{ typeLabel(field.type) }}</span>
            </div>
            <span v-if="field.required" class="cf-hd-req">*</span>
            <div class="cf-hd-actions">
              <i class="mdi mdi-pencil-outline" @click="startEdit(field)"></i>
              <i class="mdi mdi-delete-outline" @click="removeField(field)"></i>
            </div>
          </div>
        </div>

        <div v-if="!fields.length && !showForm" class="cf-hd-none">
          {{ $t('NO_CUSTOM_FIELDS') }}
        </div>
      </div>

      <!-- Add Field Button -->
      <div v-if="!showForm" class="cf-hd-add" @click="startAdd">
        <i class="mdi mdi-plus"></i>
        <span>{{ $t('ADD_FIELD') }}</span>
      </div>

      <!-- Inline Compact Form - Redesigned for High Density -->
      <div v-if="showForm" class="cf-hd-form-inline">
        <div class="hd-form-row">
          <AppInput
            v-model="form.title"
            dense
            autofocus
            :placeholder="$t('FIELD_TITLE_PLACEHOLDER')"
          />
        </div>

        <div class="hd-form-row two-cols">
          <div class="hd-form-col">
            <label class="hd-form-label-mini">{{ $t('FIELD_TYPE') }}</label>
            <AppSelect
              v-model="form.type"
              compact
              :items="fieldTypeItems"
            />
          </div>
          <div class="hd-form-col flex-end">
            <AppCheckbox
              v-model="form.required"
              :label="$t('REQUIRED')"
            />
          </div>
        </div>

        <!-- Dropdown Options -->
        <div v-if="form.type === CustomFieldType.Dropdown" class="hd-form-row">
          <label class="hd-form-label-mini">{{ $t('DROPDOWN_OPTIONS') }}</label>
          <div class="cf-dropdown-items-list">
            <div v-for="(opt, idx) in form.dropdownItems" :key="idx" class="cf-dropdown-item-row">
              <AppInput
                v-model="form.dropdownItems[idx]"
                dense
                hide-details
                :placeholder="$t('OPTION_LABEL')"
              />
              <v-btn
                icon="mdi-minus-circle-outline"
                variant="text"
                size="x-small"
                color="error"
                @click="removeDropdownItem(idx)"
              />
            </div>
            <v-btn
              variant="text"
              prepend-icon="mdi-plus"
              size="small"
              color="primary"
              class="mt-1"
              @click="addDropdownItem"
            >
              {{ $t('ADD_OPTION') }}
            </v-btn>
          </div>
        </div>

        <!-- Numeric Constraints -->
        <div v-if="form.type === CustomFieldType.Number" class="hd-form-row two-cols">
          <div class="hd-form-col">
            <label class="hd-form-label-mini">{{ $t('MIN_VALUE') }}</label>
            <AppInput :model-value="form.min === null ? undefined : form.min" type="number" dense @update:model-value="form.min = $event === '' ? null : Number($event)" />
          </div>
          <div class="hd-form-col">
            <label class="hd-form-label-mini">{{ $t('MAX_VALUE') }}</label>
            <AppInput :model-value="form.max === null ? undefined : form.max" type="number" dense @update:model-value="form.max = $event === '' ? null : Number($event)" />
          </div>
        </div>

        <div class="hd-form-actions-row">
          <button
            class="hd-btn hd-btn-primary"
            :disabled="!form.title.trim() || saving"
            @click="saveForm"
          >
            {{ isEditing ? $t('SAVE') : $t('CREATE') }}
          </button>
          <button class="hd-btn hd-btn-ghost" @click="cancelForm">
            {{ $t('CANCEL') }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, inject, type Ref, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type WorkPackageViewModel,
  type CustomFieldViewModel,
  AccessType,
  CustomFieldType,
  OperationResultStatus,
} from '@asoode/shared';
import { useWorkPackageStore } from '@/stores/work-package.store';
import AppInput from '@/components/core/AppInput.vue';
import AppSelect from '@/components/core/AppSelect.vue';
import AppCheckbox from '@/components/core/AppCheckbox.vue';

// ─── Injections ──────────────────────────────────────────────────────
const workPackage = inject<Ref<WorkPackageViewModel | null>>('workPackage')!;
const permission = inject<ComputedRef<AccessType>>('permission')!;

// ─── Store ───────────────────────────────────────────────────────────
const { t } = useI18n();
const wpStore = useWorkPackageStore();

// ─── State ───────────────────────────────────────────────────────────
const enabling = ref(false);
const saving = ref(false);
const showForm = ref(false);
const editingFieldId = ref<string | null>(null);

const form = reactive({
  title: '',
  type: CustomFieldType.Text as CustomFieldType,
  required: false,
  dropdownItems: [] as string[],
  min: null as number | null,
  max: null as number | null,
});

// ─── Computed ────────────────────────────────────────────────────────
const fieldTypeItems = computed(() => [
  { text: t('FIELD_TYPE_TEXT'), value: CustomFieldType.Text },
  { text: t('FIELD_TYPE_NUMBER'), value: CustomFieldType.Number },
  { text: t('FIELD_TYPE_DATE'), value: CustomFieldType.Date },
  { text: t('FIELD_TYPE_DROPDOWN'), value: CustomFieldType.Dropdown },
  { text: t('FIELD_TYPE_CHECKBOX'), value: CustomFieldType.Checkbox },
]);

const isEnabled = computed(() => workPackage.value?.allowCustomField === true);
const fields = computed(() => workPackage.value?.customFields || []);
const isEditing = computed(() => editingFieldId.value !== null);

// ─── Type helpers ────────────────────────────────────────────────────
function typeIcon(type: CustomFieldType): string {
  switch (type) {
    case CustomFieldType.Text: return 'mdi-format-text';
    case CustomFieldType.Number: return 'mdi-numeric';
    case CustomFieldType.Date: return 'mdi-calendar-range';
    case CustomFieldType.Dropdown: return 'mdi-menu-down';
    case CustomFieldType.Checkbox: return 'mdi-checkbox-marked-outline';
    default: return 'mdi-form-textbox';
  }
}

function typeLabel(type: CustomFieldType): string {
  switch (type) {
    case CustomFieldType.Text: return t('FIELD_TYPE_TEXT');
    case CustomFieldType.Number: return t('FIELD_TYPE_NUMBER');
    case CustomFieldType.Date: return t('FIELD_TYPE_DATE');
    case CustomFieldType.Dropdown: return t('FIELD_TYPE_DROPDOWN');
    case CustomFieldType.Checkbox: return t('FIELD_TYPE_CHECKBOX');
    default: return 'Unknown';
  }
}

// ─── Enable custom fields ────────────────────────────────────────────
async function enableCustomFields() {
  if (!workPackage.value) return;
  enabling.value = true;
  const op = await wpStore.updateSetting(workPackage.value.id, { allowCustomField: true });
  enabling.value = false;
  if (op.status === OperationResultStatus.Success) {
    workPackage.value.allowCustomField = true;
  }
}

// ─── Form helpers ────────────────────────────────────────────────────
function resetForm() {
  form.title = '';
  form.type = CustomFieldType.Text;
  form.required = false;
  form.dropdownItems = [];
  form.min = null;
  form.max = null;
  editingFieldId.value = null;
}

function addDropdownItem() {
  form.dropdownItems.push('');
}

function removeDropdownItem(index: number) {
  form.dropdownItems.splice(index, 1);
}

function startAdd() {
  resetForm();
  showForm.value = true;
}

function startEdit(field: CustomFieldViewModel) {
  editingFieldId.value = field.id;
  form.title = field.title;
  form.type = field.type;
  form.required = field.required;
  form.dropdownItems = (field.options || '').split('\n').filter(x => x.trim());
  form.min = (field as any).min ?? null;
  form.max = (field as any).max ?? null;
  showForm.value = true;
}

function cancelForm() {
  showForm.value = false;
  resetForm();
}

// ─── Save (create / edit) ────────────────────────────────────────────
async function saveForm() {
  if (!form.title.trim() || !workPackage.value) return;
  saving.value = true;

  const payload = {
    title: form.title,
    type: form.type,
    required: form.required,
    options: form.type === CustomFieldType.Dropdown ? form.dropdownItems.filter(x => x.trim()).join('\n') : undefined,
    min: form.type === CustomFieldType.Number ? form.min : undefined,
    max: form.type === CustomFieldType.Number ? form.max : undefined,
  };

  if (isEditing.value && editingFieldId.value) {
    const op = await wpStore.editCustomField(editingFieldId.value, payload);
    saving.value = false;
    if (op.status === OperationResultStatus.Success) {
      const idx = workPackage.value.customFields.findIndex((f) => f.id === editingFieldId.value);
      if (idx !== -1) {
        workPackage.value.customFields[idx] = {
          ...workPackage.value.customFields[idx],
          title: form.title,
          type: form.type,
          required: form.required,
          options: payload.options,
          min: payload.min,
          max: payload.max,
        } as any;
      }
      showForm.value = false;
      resetForm();
    }
  } else {
    const op = await wpStore.createCustomField(workPackage.value.id, payload);
    saving.value = false;
    if (op.status === OperationResultStatus.Success && op.data) {
      if (op.data.id && !workPackage.value.customFields.some(f => f.id === op.data.id)) {
        workPackage.value.customFields.push(op.data);
      }
      showForm.value = false;
      resetForm();
    }
  }
}

// ─── Remove ──────────────────────────────────────────────────────────
async function removeField(field: CustomFieldViewModel) {
  if (!workPackage.value) return;
  const op = await wpStore.removeCustomField(field.id);
  if (op.status === OperationResultStatus.Success) {
    workPackage.value.customFields = workPackage.value.customFields.filter((f) => f.id !== field.id);
  }
}
</script>

<style lang="scss">
@import '@/styles/variables';

// ─── High Density Variables ────────────────────────────────────────
$hd-bg: #FFFFFF;
$hd-secondary-bg: #F7F8F9;
$hd-text-primary: #292d34;
$hd-text-secondary: #656f7d;
$hd-hover-bg: #F0F1F4;

.wp-cf-manager-hd {
  // ── High Density List ──
  .cf-hd-list {
    display: flex;
    flex-direction: column;
    padding: 0 16px;
    margin-bottom: 4px;
  }

  .cf-hd-item {
    margin-bottom: 2px;
    
    .cf-hd-item-main {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 8px;
      border-radius: 4px;
      &:hover {
        background: $hd-hover-bg;
        .cf-hd-actions { opacity: 1; }
      }
    }

    .cf-hd-type-icon {
      font-size: 14px;
      color: $hd-text-secondary;
      width: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cf-hd-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;

      .cf-hd-title { font-size: 12px; font-weight: 500; color: $hd-text-primary; }
      .cf-hd-meta { font-size: 11px; color: $hd-text-secondary; margin-top: -1px; }
    }

    .cf-hd-req { color: #d32f2f; font-weight: 700; margin-right: 4px; font-size: 12px; }

    .cf-hd-actions {
      display: flex;
      gap: 8px;
      opacity: 0;
      i {
        font-size: 14px;
        color: $hd-text-secondary;
        cursor: pointer;
        padding: 2px;
        &:hover { color: $hd-text-primary; }
      }
    }
  }

  .cf-hd-none {
    padding: 12px 16px;
    font-size: 12px;
    color: $hd-text-secondary;
    text-align: center;
    opacity: 0.7;
  }

  // ── High Density Empty State ──
  .cf-hd-empty {
    padding: 12px 16px;
    margin: 8px 16px;
    background: $hd-secondary-bg;
    border: 1px dashed rgba(0,0,0,0.1);
    border-radius: 6px;
    text-align: center;

    .cf-hd-desc { font-size: 12px; color: $hd-text-secondary; margin-bottom: 8px; line-height: 1.4; }
  }

  // ── Add Field Button ──
  .cf-hd-add {
    margin: 8px 16px 8px 42px; // Align icons with title
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

  // ── Compact Form Inline ──
  .cf-hd-form-inline {
    padding: 10px 16px;
    background: $hd-secondary-bg;
    margin: 4px 16px 12px 16px;
    border-radius: 6px;
    border: 1px solid rgba(0,0,0,0.05);

    .hd-form-row {
      margin-bottom: 8px;
      &.two-cols { display: flex; gap: 10px; align-items: flex-end; }
    }

    .hd-form-col { flex: 1; display: flex; flex-direction: column; &.flex-end { justify-content: flex-end; padding-bottom: 4px; } }

    .hd-form-label-mini {
      font-size: 10px;
      font-weight: 700;
      color: $hd-text-secondary;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .hd-form-actions-row {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }
  }
}

// ─── Dark Mode Support ─────────────────────────────────────────────
body.dark-mode {
  .wp-cf-manager-hd {
    .cf-hd-item-main:hover { background: #24272b; }
    .cf-hd-title { color: #eee; }
    .cf-hd-meta { color: #b1b5ba; }
    .cf-hd-empty { background: #24272b; border-color: #444; .cf-hd-desc { color: #b1b5ba; } }
    .cf-hd-form-inline { background: #24272b; border-color: #444; }

    .cf-dropdown-item-row {
      .v-btn { color: #ff5252 !important; }
    }
  }
}

.cf-dropdown-items-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(0,0,0,0.02);
  padding: 8px;
  border-radius: 4px;
}

.cf-dropdown-item-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
