<template>
  <div class="expr-field">
    <div class="expr-field__header">
      <span class="expr-field__label">{{ label }}</span>
      <button
        class="expr-field__toggle"
        :class="{ 'expr-field__toggle--active': isExpression }"
        @click="toggleMode"
        :title="isExpression ? $t('WORKFLOW_MODE_EXPRESSION') : $t('WORKFLOW_MODE_FIXED')"
      >
        <i class="mdi" :class="isExpression ? 'mdi-code-braces' : 'mdi-pencil-outline'"></i>
        {{ isExpression ? 'Expr' : 'Fixed' }}
      </button>
    </div>

    <!-- Fixed mode -->
    <template v-if="!isExpression">
      <!-- Dropdown mode -->
      <div v-if="options && options.length" class="wf-select" ref="dropdownRef">
        <button
          class="wf-select__trigger"
          :class="{ 'wf-select__trigger--open': dropdownOpen }"
          @click="dropdownOpen = !dropdownOpen"
          type="button"
        >
          <span v-if="selectedOption" class="wf-select__value">
            <span v-if="selectedOption.color" class="wf-select__dot" :style="{ background: selectedOption.color }"></span>
            <span class="wf-select__value-text">{{ selectedOption.label }}</span>
            <span v-if="selectedOption.subtitle" class="wf-select__value-sub">{{ selectedOption.subtitle }}</span>
          </span>
          <span v-else class="wf-select__placeholder">{{ placeholder || $t('SELECT') }}</span>
          <span class="wf-select__actions">
            <i v-if="fixedValue" class="mdi mdi-close-circle wf-select__clear" @click.stop="clearSelection"></i>
            <i class="mdi mdi-chevron-down wf-select__arrow" :class="{ 'wf-select__arrow--open': dropdownOpen }"></i>
          </span>
        </button>
        <Transition name="wf-pop">
          <div v-if="dropdownOpen" class="wf-select__menu">
            <div class="wf-select__search-wrap">
              <i class="mdi mdi-magnify"></i>
              <input
                ref="searchInputRef"
                v-model="dropdownSearch"
                class="wf-select__search"
                :placeholder="$t('SEARCH')"
                @click.stop
                @keydown.escape="dropdownOpen = false"
              />
            </div>
            <div class="wf-select__items">
              <button
                v-for="opt in filteredOptions"
                :key="opt.value"
                class="wf-select__item"
                :class="{ 'wf-select__item--active': fixedValue === opt.value }"
                @click="selectOption(opt.value)"
                type="button"
              >
                <span v-if="opt.color" class="wf-select__dot" :style="{ background: opt.color }"></span>
                <span class="wf-select__item-text">{{ opt.label }}</span>
                <span v-if="opt.subtitle" class="wf-select__item-sub">{{ opt.subtitle }}</span>
                <i v-if="fixedValue === opt.value" class="mdi mdi-check wf-select__check"></i>
              </button>
              <div v-if="!filteredOptions.length" class="wf-select__empty">
                <i class="mdi mdi-magnify-close"></i>
                {{ $t('NO_RESULTS') }}
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Date picker mode -->
      <div v-else-if="inputType === 'date'">
        <TaskDatePicker
          :model-value="fixedValue"
          @update:model-value="onDatePicked"
          clearable
        />
      </div>

      <!-- Text input mode -->
      <template v-else>
        <textarea
          v-if="multiline"
          :value="fixedValue"
          @input="onFixedInput(($event.target as HTMLTextAreaElement).value)"
          rows="3"
          :placeholder="placeholder"
          class="expr-field__input"
        ></textarea>
        <input
          v-else
          :value="fixedValue"
          @input="onFixedInput(($event.target as HTMLInputElement).value)"
          :placeholder="placeholder"
          :type="inputType || 'text'"
          class="expr-field__input"
        />
      </template>
    </template>

    <!-- Expression mode -->
    <template v-if="isExpression">
      <div
        class="expr-field__expr-wrap"
        :class="{ 'expr-field__expr-wrap--dragover': isDragOver }"
        ref="exprWrapRef"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop.prevent="onExprDrop"
      >
        <textarea
          v-if="multiline"
          ref="exprInputRef"
          :value="exprValue"
          @input="onExprInput(($event.target as HTMLTextAreaElement).value)"
          @keydown="onExprKeydown"
          rows="3"
          :placeholder="exprPlaceholder"
          class="expr-field__input expr-field__input--expr"
        ></textarea>
        <input
          v-else
          ref="exprInputRef"
          :value="exprValue"
          @input="onExprInput(($event.target as HTMLInputElement).value)"
          @keydown="onExprKeydown"
          :placeholder="exprPlaceholder"
          class="expr-field__input expr-field__input--expr"
        />

        <!-- IntelliSense popup -->
        <Transition name="wf-pop">
          <div v-if="intellisenseOpen" class="expr-field__intellisense">
            <div class="expr-field__intellisense-header">
              {{ intellisenseMode === 'nodes' ? $t('WORKFLOW_AVAILABLE_NODES') : $t('WORKFLOW_NODE_FIELDS') }}
            </div>
            <div class="expr-field__intellisense-items">
              <button
                v-for="(item, idx) in intellisenseItems"
                :key="item.value"
                class="expr-field__intellisense-item"
                :class="{ 'expr-field__intellisense-item--active': idx === intellisenseIndex }"
                @mousedown.prevent="applyIntelliSense(item)"
                type="button"
              >
                <i class="mdi" :class="item.icon"></i>
                <span class="expr-field__intellisense-label">{{ item.label }}</span>
                <code v-if="item.hint">{{ item.hint }}</code>
              </button>
              <div v-if="!intellisenseItems.length" class="expr-field__intellisense-empty">
                {{ $t('NO_RESULTS') }}
              </div>
            </div>
          </div>
        </Transition>

        <!-- Variable suggestions -->
        <div v-if="contextNodes.length" class="expr-field__vars">
          <div class="expr-field__vars-title">{{ $t('WORKFLOW_AVAILABLE_VARS') }}</div>
          <button
            v-for="node in contextNodes"
            :key="node.id"
            class="expr-field__var"
            @click="insertVar(node.id)"
            type="button"
          >
            <i class="mdi mdi-variable"></i>
            <span>{{ node.label }}</span>
            <code>{{ exprHint(node.id) }}</code>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue';
import TaskDatePicker from '@/components/core/TaskDatePicker.vue';

export interface DropdownOption {
  value: string;
  label: string;
  color?: string;
  subtitle?: string;
}

export interface ContextNode {
  id: string;
  label: string;
  type: string;
  outputFields?: OutputField[];
}

export interface OutputField {
  key: string;
  label: string;
  type?: string;
}

interface IntelliSenseItem {
  value: string;
  label: string;
  icon: string;
  hint?: string;
}

const props = defineProps<{
  label: string;
  modelValue: any;
  contextNodes: ContextNode[];
  placeholder?: string;
  multiline?: boolean;
  options?: DropdownOption[];
  inputType?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();

const dropdownOpen = ref(false);
const dropdownSearch = ref('');
const dropdownRef = ref<HTMLElement>();
const searchInputRef = ref<HTMLInputElement>();

const exprInputRef = ref<HTMLInputElement | HTMLTextAreaElement>();
const exprWrapRef = ref<HTMLElement>();
const intellisenseOpen = ref(false);
const intellisenseMode = ref<'nodes' | 'fields'>('nodes');
const intellisenseIndex = ref(0);
const intellisenseNodeId = ref('');
const intellisenseFilter = ref('');
const isDragOver = ref(false);

watch(dropdownOpen, (open) => {
  if (open) {
    nextTick(() => searchInputRef.value?.focus());
  } else {
    dropdownSearch.value = '';
  }
});

const isExpression = computed(() => {
  return props.modelValue && typeof props.modelValue === 'object' && props.modelValue.mode === 'expression';
});

const fixedValue = computed(() => {
  if (props.modelValue && typeof props.modelValue === 'object' && 'value' in props.modelValue) {
    return props.modelValue.value;
  }
  return props.modelValue ?? '';
});

const exprValue = computed(() => {
  if (props.modelValue && typeof props.modelValue === 'object' && 'value' in props.modelValue) {
    return props.modelValue.value;
  }
  return props.modelValue ?? '';
});

const selectedOption = computed(() => {
  if (!props.options) return null;
  return props.options.find((o) => o.value === fixedValue.value) || null;
});

const filteredOptions = computed(() => {
  if (!props.options) return [];
  const q = dropdownSearch.value.toLowerCase().trim();
  if (!q) return props.options;
  return props.options.filter(
    (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q) || (o.subtitle && o.subtitle.toLowerCase().includes(q))
  );
});

const exprPlaceholder = '\u007B\u007BnodeName.field\u007D\u007D';

function exprHint(nodeId: string): string {
  return `\u007B\u007B${nodeId}.___\u007D\u007D`;
}

const intellisenseItems = computed<IntelliSenseItem[]>(() => {
  const filter = intellisenseFilter.value.toLowerCase();

  if (intellisenseMode.value === 'nodes') {
    return props.contextNodes
      .filter((n) => !filter || n.label.toLowerCase().includes(filter) || n.id.toLowerCase().includes(filter))
      .map((n) => ({
        value: n.id,
        label: n.label,
        icon: getNodeTypeIcon(n.type),
        hint: n.type.replace(/_/g, ' '),
      }));
  } else {
    const node = props.contextNodes.find((n) => n.id === intellisenseNodeId.value);
    const fields = node?.outputFields || getDefaultOutputFields(node?.type || '');
    return fields
      .filter((f) => !filter || f.key.toLowerCase().includes(filter) || f.label.toLowerCase().includes(filter))
      .map((f) => ({
        value: f.key,
        label: f.label,
        icon: 'mdi-code-tags',
        hint: f.type || 'string',
      }));
  }
});

function getNodeTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    trigger: 'mdi-lightning-bolt', condition: 'mdi-source-branch',
    change_state: 'mdi-swap-horizontal', assign_member: 'mdi-account-plus-outline',
    send_notification: 'mdi-bell-outline', add_comment: 'mdi-comment-plus-outline',
    set_date: 'mdi-calendar-edit', move_task: 'mdi-arrow-right-bold-outline',
    create_task: 'mdi-plus-circle-outline', delay: 'mdi-timer-sand',
    webhook: 'mdi-webhook', set_custom_field: 'mdi-form-textbox',
    add_label: 'mdi-label-outline', remove_label: 'mdi-label-off-outline',
    add_blocker: 'mdi-block-helper', add_relation: 'mdi-link-variant',
    send_email: 'mdi-email-outline', send_sms: 'mdi-cellphone-message',
  };
  return icons[type] || 'mdi-circle-outline';
}

function getDefaultOutputFields(type: string): OutputField[] {
  const schemas: Record<string, OutputField[]> = {
    trigger: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'taskTitle', label: 'Task Title', type: 'string' },
      { key: 'taskState', label: 'Task State', type: 'number' },
      { key: 'userId', label: 'User ID', type: 'string' },
      { key: 'listId', label: 'List ID', type: 'string' },
    ],
    create_task: [
      { key: 'taskId', label: 'Created Task ID', type: 'string' },
      { key: 'taskTitle', label: 'Task Title', type: 'string' },
      { key: 'listId', label: 'List ID', type: 'string' },
    ],
    change_state: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'previousState', label: 'Previous State', type: 'number' },
      { key: 'newState', label: 'New State', type: 'number' },
    ],
    assign_member: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'memberId', label: 'Member ID', type: 'string' },
    ],
    move_task: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'targetListId', label: 'Target List ID', type: 'string' },
    ],
    add_comment: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'commentId', label: 'Comment ID', type: 'string' },
    ],
    condition: [
      { key: 'result', label: 'Result', type: 'boolean' },
      { key: 'field', label: 'Field Checked', type: 'string' },
      { key: 'value', label: 'Actual Value', type: 'string' },
    ],
    delay: [{ key: 'waited', label: 'Seconds Waited', type: 'number' }],
    webhook: [
      { key: 'statusCode', label: 'Status Code', type: 'number' },
      { key: 'body', label: 'Response Body', type: 'object' },
    ],
    set_date: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'field', label: 'Date Field', type: 'string' },
      { key: 'value', label: 'Date Value', type: 'string' },
    ],
    set_custom_field: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'fieldId', label: 'Field ID', type: 'string' },
      { key: 'value', label: 'Value Set', type: 'string' },
    ],
    add_label: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'labelId', label: 'Label ID', type: 'string' },
    ],
    remove_label: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'labelId', label: 'Label ID', type: 'string' },
    ],
    add_blocker: [
      { key: 'blockedId', label: 'Blocked Task ID', type: 'string' },
      { key: 'blockerId', label: 'Blocker Task ID', type: 'string' },
    ],
    add_relation: [
      { key: 'fromTaskId', label: 'From Task ID', type: 'string' },
      { key: 'toTaskId', label: 'To Task ID', type: 'string' },
      { key: 'type', label: 'Relation Type', type: 'number' },
    ],
    send_email: [
      { key: 'to', label: 'Recipient', type: 'string' },
      { key: 'subject', label: 'Subject', type: 'string' },
      { key: 'sent', label: 'Sent', type: 'boolean' },
    ],
    send_sms: [
      { key: 'to', label: 'Recipient', type: 'string' },
      { key: 'sent', label: 'Sent', type: 'boolean' },
    ],
    send_notification: [
      { key: 'userId', label: 'User ID', type: 'string' },
      { key: 'message', label: 'Message', type: 'string' },
    ],
  };
  return schemas[type] || [];
}

function checkIntelliSense(value: string, cursorPos: number) {
  const before = value.substring(0, cursorPos);
  const fieldMatch = before.match(/\{\{(\w+[-\w]*)\.(\w*)$/);
  if (fieldMatch) {
    const node = props.contextNodes.find((n) => n.id === fieldMatch[1]);
    if (node) {
      intellisenseMode.value = 'fields';
      intellisenseNodeId.value = fieldMatch[1];
      intellisenseFilter.value = fieldMatch[2];
      intellisenseIndex.value = 0;
      intellisenseOpen.value = true;
      return;
    }
  }
  const nodeMatch = before.match(/\{\{(\w*)$/);
  if (nodeMatch) {
    intellisenseMode.value = 'nodes';
    intellisenseFilter.value = nodeMatch[1];
    intellisenseIndex.value = 0;
    intellisenseOpen.value = true;
    return;
  }
  intellisenseOpen.value = false;
}

function applyIntelliSense(item: IntelliSenseItem) {
  const input = exprInputRef.value;
  if (!input) return;
  const value = exprValue.value || '';
  const cursorPos = input.selectionStart || value.length;
  const before = value.substring(0, cursorPos);
  const after = value.substring(cursorPos);

  let newBefore: string;
  if (intellisenseMode.value === 'nodes') {
    newBefore = before.replace(/\{\{\w*$/, `{{${item.value}.`);
    emit('update:modelValue', { mode: 'expression', value: newBefore + after });
    nextTick(() => {
      if (exprInputRef.value) {
        exprInputRef.value.focus();
        exprInputRef.value.setSelectionRange(newBefore.length, newBefore.length);
        checkIntelliSense(newBefore + after, newBefore.length);
      }
    });
    return;
  } else {
    newBefore = before.replace(/\{\{(\w+[-\w]*)\.(\w*)$/, `{{$1.${item.value}}}`);
  }
  const newValue = newBefore + after;
  emit('update:modelValue', { mode: 'expression', value: newValue });
  intellisenseOpen.value = false;
  nextTick(() => {
    if (exprInputRef.value) {
      exprInputRef.value.focus();
      exprInputRef.value.setSelectionRange(newBefore.length, newBefore.length);
    }
  });
}

function onExprKeydown(e: KeyboardEvent) {
  if (!intellisenseOpen.value) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    intellisenseIndex.value = Math.min(intellisenseIndex.value + 1, intellisenseItems.value.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    intellisenseIndex.value = Math.max(intellisenseIndex.value - 1, 0);
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    if (intellisenseItems.value.length > 0) {
      e.preventDefault();
      applyIntelliSense(intellisenseItems.value[intellisenseIndex.value]);
    }
  } else if (e.key === 'Escape') {
    intellisenseOpen.value = false;
  }
}

function toggleMode() {
  const currentValue = fixedValue.value || exprValue.value || '';
  if (isExpression.value) {
    emit('update:modelValue', currentValue);
  } else {
    emit('update:modelValue', { mode: 'expression', value: currentValue });
  }
}

function onFixedInput(val: string) { emit('update:modelValue', val); }

function onDatePicked(val: Date | null) {
  emit('update:modelValue', val ? val.toISOString().split('T')[0] : '');
}

function onExprInput(val: string) {
  emit('update:modelValue', { mode: 'expression', value: val });
  nextTick(() => {
    const input = exprInputRef.value;
    if (input) checkIntelliSense(val, input.selectionStart || val.length);
  });
}

function selectOption(value: string) {
  emit('update:modelValue', value);
  dropdownOpen.value = false;
}

function clearSelection() { emit('update:modelValue', ''); }

function onExprDrop(e: DragEvent) {
  isDragOver.value = false;
  const expr = e.dataTransfer?.getData('application/x-workflow-expr')
    || e.dataTransfer?.getData('text/plain')
    || '';
  if (!expr) return;
  // If not in expression mode, switch to it
  if (!isExpression.value) {
    emit('update:modelValue', { mode: 'expression', value: expr });
  } else {
    const input = exprInputRef.value;
    const current = exprValue.value || '';
    const pos = input?.selectionStart ?? current.length;
    const newValue = current.slice(0, pos) + expr + current.slice(pos);
    emit('update:modelValue', { mode: 'expression', value: newValue });
  }
  nextTick(() => exprInputRef.value?.focus());
}

function insertVar(nodeId: string) {
  const current = exprValue.value || '';
  const template = `{{${nodeId}.}}`;
  const newValue = current + template;
  emit('update:modelValue', { mode: 'expression', value: newValue });
  nextTick(() => {
    if (exprInputRef.value) {
      const pos = newValue.length - 2;
      exprInputRef.value.focus();
      exprInputRef.value.setSelectionRange(pos, pos);
      checkIntelliSense(newValue, pos);
    }
  });
}

function onDocumentClick(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false;
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick));
onUnmounted(() => document.removeEventListener('click', onDocumentClick));
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.expr-field { margin-bottom: $spacing-md; }

.expr-field__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.expr-field__label { font-size: 0.78rem; font-weight: 500; color: $text-primary; }

.expr-field__toggle {
  display: flex; align-items: center; gap: 4px;
  background: none; border: 1px solid $divider; border-radius: 4px;
  padding: 2px 8px; font-size: 0.65rem; font-weight: 600;
  color: $text-secondary; cursor: pointer; transition: all 0.15s ease;
  i { font-size: 0.8rem; }
  &:hover { border-color: $primary; color: $primary; }
  &--active { background: rgba(#ff9800, 0.1); border-color: #ff9800; color: #ff9800; }
}

.expr-field__input {
  width: 100%; border: 1px solid $divider; border-radius: $border-radius-md;
  padding: 9px 12px; font-size: 0.82rem; outline: none;
  background: transparent; color: $text-primary; box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
  &--expr {
    font-family: 'SF Mono', 'Fira Code', monospace;
    border-color: rgba(#ff9800, 0.4); background: rgba(#ff9800, 0.03);
    &:focus { border-color: #ff9800; box-shadow: 0 0 0 3px rgba(#ff9800, 0.1); }
  }
}

// ─── Dropdown ──────
.wf-select { position: relative; }

.wf-select__trigger {
  display: flex; align-items: center; width: 100%;
  border: 1px solid $divider; border-radius: $border-radius-md;
  padding: 8px 12px; font-size: 0.82rem; background: transparent;
  color: $text-primary; cursor: pointer; text-align: start;
  box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s; gap: 8px;
  &:hover { border-color: rgba($primary, 0.5); }
  &--open { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
}
.wf-select__value { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.wf-select__value-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
.wf-select__value-sub { font-size: 0.68rem; color: $text-disabled; white-space: nowrap; }
.wf-select__placeholder { color: $text-disabled; flex: 1; }
.wf-select__dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 1px rgba(0,0,0,0.06); }
.wf-select__actions { display: flex; align-items: center; gap: 2px; margin-inline-start: auto; flex-shrink: 0; }
.wf-select__clear { font-size: 0.85rem; color: $text-disabled; cursor: pointer; padding: 2px; border-radius: 50%; &:hover { color: $warn; } }
.wf-select__arrow { font-size: 1rem; color: $text-disabled; transition: transform 0.2s ease; &--open { transform: rotate(180deg); } }

.wf-select__menu {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: $surface; border: 1px solid $divider; border-radius: $border-radius-md;
  box-shadow: $shadow-4; z-index: 100; max-height: 280px;
  display: flex; flex-direction: column; overflow: hidden;
}
.wf-select__search-wrap {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid $divider;
  .mdi-magnify { font-size: 1rem; color: $text-disabled; }
}
.wf-select__search { border: none; outline: none; font-size: 0.8rem; background: transparent; color: $text-primary; flex: 1; }
.wf-select__items { overflow-y: auto; flex: 1; padding: 4px; }
.wf-select__item {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px;
  border: none; background: none; font-size: 0.8rem; color: $text-primary;
  cursor: pointer; text-align: start; border-radius: $border-radius-sm; transition: background 0.1s;
  &:hover { background: rgba($primary, 0.06); }
  &--active { background: rgba($primary, 0.08); font-weight: 500; }
}
.wf-select__item-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wf-select__item-sub { font-size: 0.68rem; color: $text-disabled; white-space: nowrap; }
.wf-select__check { color: $primary; font-size: 0.9rem; }
.wf-select__empty {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 16px; font-size: 0.78rem; color: $text-disabled;
  i { font-size: 1rem; }
}

.wf-pop-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.wf-pop-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.wf-pop-enter-from { opacity: 0; transform: translateY(-4px); }
.wf-pop-leave-to { opacity: 0; transform: translateY(-4px); }

// ─── Date Picker ──────
.wf-datepicker__wrap {
  display: flex; align-items: center; border: 1px solid $divider;
  border-radius: $border-radius-md; padding: 0 12px;
  transition: border-color 0.2s, box-shadow 0.2s; gap: 8px;
  &:focus-within { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
}
.wf-datepicker__icon { font-size: 1rem; color: $primary; }
.wf-datepicker__input {
  border: none; outline: none; font-size: 0.82rem; padding: 9px 0;
  background: transparent; color: $text-primary; flex: 1; font-family: inherit;
}
.wf-datepicker__clear { font-size: 0.85rem; color: $text-disabled; cursor: pointer; &:hover { color: $warn; } }

// ─── IntelliSense ──────
.expr-field__expr-wrap {
  position: relative;
  &--dragover {
    outline: 2px dashed $primary;
    outline-offset: 2px;
    border-radius: $border-radius-md;
    background: rgba($primary, 0.04);
  }
}

.expr-field__intellisense {
  position: absolute; top: 100%; left: 0; right: 0; margin-top: 2px;
  background: $surface; border: 1px solid rgba(#ff9800, 0.4);
  border-radius: $border-radius-md; box-shadow: $shadow-4;
  z-index: 200; max-height: 220px; display: flex; flex-direction: column; overflow: hidden;
}
.expr-field__intellisense-header {
  font-size: 0.62rem; font-weight: 600; color: $text-disabled;
  text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 10px 4px; border-bottom: 1px solid $divider;
}
.expr-field__intellisense-items { overflow-y: auto; flex: 1; padding: 4px; }
.expr-field__intellisense-item {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 10px;
  border: none; background: none; font-size: 0.78rem; color: $text-primary;
  cursor: pointer; text-align: start; border-radius: $border-radius-sm; transition: background 0.1s;
  &:hover, &--active { background: rgba(#ff9800, 0.08); }
  i { font-size: 0.9rem; color: #ff9800; }
  code { margin-inline-start: auto; font-size: 0.6rem; color: $text-disabled; font-family: monospace; background: rgba(0,0,0,0.04); padding: 2px 6px; border-radius: 3px; }
}
.expr-field__intellisense-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.expr-field__intellisense-empty { padding: 10px; text-align: center; font-size: 0.72rem; color: $text-disabled; }

.expr-field__vars {
  margin-top: 6px; border: 1px solid $divider; border-radius: $border-radius-md; padding: 6px; background: rgba(0,0,0,0.02);
}
.expr-field__vars-title { font-size: 0.62rem; font-weight: 600; color: $text-disabled; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.expr-field__var {
  display: flex; align-items: center; gap: 6px; width: 100%; background: none; border: none;
  padding: 4px 6px; border-radius: $border-radius-sm; font-size: 0.7rem;
  color: $text-secondary; cursor: pointer; text-align: start; transition: background 0.1s;
  &:hover { background: rgba($primary, 0.08); color: $primary; }
  i { font-size: 0.8rem; color: #ff9800; }
  code { margin-inline-start: auto; font-size: 0.6rem; color: $text-disabled; font-family: monospace; }
}
</style>

<!-- Dark mode -->
<style lang="scss">
@use '@/styles/variables' as *;
body.dark-mode {
  .expr-field__label { color: $dark-text-bright; }
  .expr-field__toggle { border-color: $dark-border; color: $dark-text-muted; &--active { background: rgba(#ff9800, 0.15); border-color: #ff9800; color: #ff9800; } }
  .expr-field__input { border-color: $dark-border; color: $dark-text-bright; background: $dark-card-inner; &:focus { box-shadow: 0 0 0 3px rgba($primary-light, 0.15); } &--expr { border-color: rgba(#ff9800, 0.3); background: rgba(#ff9800, 0.06); &:focus { box-shadow: 0 0 0 3px rgba(#ff9800, 0.12); } } }
  .wf-select__trigger { border-color: $dark-border; color: $dark-text-bright; background: $dark-card-inner; &:hover { border-color: rgba($primary-light, 0.5); } &--open { border-color: $primary-light; box-shadow: 0 0 0 3px rgba($primary-light, 0.15); } }
  .wf-select__placeholder { color: #555; }
  .wf-select__value-sub { color: #666; }
  .wf-select__menu { background: $dark-card; border-color: $dark-border; }
  .wf-select__search-wrap { border-color: $dark-border; }
  .wf-select__search { color: $dark-text-bright; }
  .wf-select__item { color: $dark-text-bright; &:hover { background: rgba($primary-light, 0.1); } &--active { background: rgba($primary-light, 0.15); } }
  .wf-select__item-sub { color: #666; }
  .wf-select__check { color: $primary-light; }
  .wf-select__empty { color: #555; }
  .wf-datepicker__wrap { border-color: $dark-border; background: $dark-card-inner; &:focus-within { border-color: $primary-light; box-shadow: 0 0 0 3px rgba($primary-light, 0.15); } }
  .wf-datepicker__icon { color: $primary-light; }
  .wf-datepicker__input { color: $dark-text-bright; }
  .expr-field__intellisense { background: $dark-card; border-color: rgba(#ff9800, 0.3); }
  .expr-field__intellisense-header { color: #555; border-color: $dark-border; }
  .expr-field__intellisense-item { color: $dark-text-bright; &:hover, &--active { background: rgba(#ff9800, 0.12); } code { background: rgba(255,255,255,0.06); color: #666; } }
  .expr-field__intellisense-empty { color: #555; }
  .expr-field__vars { border-color: $dark-border; background: rgba(255,255,255,0.02); }
  .expr-field__vars-title { color: #555; }
  .expr-field__var { color: $dark-text-muted; &:hover { background: rgba($primary-light, 0.1); color: $primary-light; } code { color: #555; } }
}
</style>
