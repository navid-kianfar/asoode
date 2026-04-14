<template>
  <div
    class="app-select"
    ref="triggerWrapRef"
    :class="{
      'app-select--open': isOpen,
      'app-select--disabled': disabled,
      'app-select--compact': compact,
    }"
    @keydown="handleKeydown"
  >
    <button
      type="button"
      ref="triggerRef"
      class="app-select__trigger"
      :disabled="disabled"
      @click="toggle"
    >
      <span
        class="app-select__text"
        :class="{ 'app-select__text--placeholder': !hasSelection }"
      >{{ displayText }}</span>
      <i class="mdi mdi-chevron-down app-select__arrow" />
    </button>

    <Teleport to="body">
      <Transition name="app-select-drop">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="app-select__dropdown"
          :class="{ 'app-select__dropdown--up': openUpward, 'app-select__dropdown--compact': compact }"
          :style="dropdownStyle"
          @click.stop
        >
          <ul class="app-select__options" ref="listRef" role="listbox">
            <li
              v-for="(item, index) in items"
              :key="index"
              role="option"
              class="app-select__option"
              :class="{
                'app-select__option--active': isEqual(item.value, modelValue),
                'app-select__option--focused': index === focusedIndex,
              }"
              @click.stop="selectItem(item)"
              @mouseenter="focusedIndex = index"
            >
              <span class="app-select__option-text">{{ item.text }}</span>
              <i v-if="isEqual(item.value, modelValue)" class="mdi mdi-check app-select__check" />
            </li>
          </ul>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

interface SelectItem {
  text: string;
  value: any;
}

const props = withDefaults(defineProps<{
  modelValue?: any;
  items: SelectItem[];
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
}>(), {
  placeholder: '',
  disabled: false,
  compact: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: any];
}>();

const isOpen = ref(false);
const focusedIndex = ref(-1);
const openUpward = ref(false);
const triggerWrapRef = ref<HTMLElement>();
const triggerRef = ref<HTMLElement>();
const dropdownRef = ref<HTMLElement>();
const listRef = ref<HTMLElement>();

const dropdownPos = ref({ top: 0, left: 0, width: 0 });

function isEqual(a: any, b: any): boolean {
  // eslint-disable-next-line eqeqeq
  return a == b;
}

const hasSelection = computed(() => {
  return props.items.some(i => isEqual(i.value, props.modelValue));
});

const displayText = computed(() => {
  const found = props.items.find(i => isEqual(i.value, props.modelValue));
  return found?.text ?? props.placeholder;
});

const dropdownStyle = computed(() => ({
  position: 'fixed' as const,
  top: dropdownPos.value.top + 'px',
  left: dropdownPos.value.left + 'px',
  minWidth: dropdownPos.value.width + 'px',
  zIndex: 9999,
}));

function toggle() {
  if (props.disabled) return;
  if (isOpen.value) {
    close();
  } else {
    open();
  }
}

function open() {
  isOpen.value = true;
  focusedIndex.value = props.items.findIndex(i => isEqual(i.value, props.modelValue));
  if (focusedIndex.value === -1) focusedIndex.value = 0;

  nextTick(() => {
    calculatePosition();
    scrollToFocused();
  });
}

function close() {
  isOpen.value = false;
  focusedIndex.value = -1;
  openUpward.value = false;
}

function selectItem(item: SelectItem) {
  emit('update:modelValue', item.value);
  close();
}

function calculatePosition() {
  const trigger = triggerRef.value;
  if (!trigger) return;

  const rect = trigger.getBoundingClientRect();
  const maxHeight = props.compact ? 180 : 220;
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const spaceAbove = rect.top - 8;

  if (spaceBelow < maxHeight && spaceAbove > spaceBelow) {
    openUpward.value = true;
    dropdownPos.value = {
      top: rect.top - Math.min(maxHeight, spaceAbove) - 4,
      left: rect.left,
      width: rect.width,
    };
  } else {
    openUpward.value = false;
    dropdownPos.value = {
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    };
  }
}

function scrollToFocused() {
  nextTick(() => {
    const list = listRef.value;
    if (!list) return;
    const child = list.children[focusedIndex.value] as HTMLElement | undefined;
    child?.scrollIntoView({ block: 'nearest' });
  });
}

function handleKeydown(e: KeyboardEvent) {
  if (props.disabled) return;

  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      if (isOpen.value && focusedIndex.value >= 0 && focusedIndex.value < props.items.length) {
        selectItem(props.items[focusedIndex.value]);
      } else {
        toggle();
      }
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (!isOpen.value) {
        open();
      } else {
        focusedIndex.value = Math.min(focusedIndex.value + 1, props.items.length - 1);
        scrollToFocused();
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (isOpen.value) {
        focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
        scrollToFocused();
      }
      break;
    case 'Escape':
      e.preventDefault();
      close();
      break;
    case 'Tab':
      close();
      break;
  }
}

// Close on outside click
function onDocumentClick(e: MouseEvent) {
  if (!isOpen.value) return;
  const target = e.target as Node;
  if (triggerWrapRef.value?.contains(target)) return;
  if (dropdownRef.value?.contains(target)) return;
  close();
}

// Close on scroll of any ancestor (reposition would be complex)
function onScroll() {
  if (isOpen.value) {
    calculatePosition();
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick, true);
  window.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', onScroll);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick, true);
  window.removeEventListener('scroll', onScroll, true);
  window.removeEventListener('resize', onScroll);
});

watch(() => props.items, () => {
  if (isOpen.value) {
    focusedIndex.value = Math.min(focusedIndex.value, props.items.length - 1);
  }
});
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.app-select {
  position: relative;
  display: inline-flex;
  font-family: inherit;

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &--open .app-select__arrow {
    transform: rotate(180deg);
  }

  // ── Trigger ──────────────────────────────────────────────
  &__trigger {
    display: inline-flex;
    align-items: center;
    gap: $spacing-sm;
    width: 100%;
    padding: 7px 12px;
    border: 1px solid $divider;
    border-radius: $border-radius-sm;
    background: $surface;
    font-size: 0.85rem;
    font-family: inherit;
    color: $text-primary;
    cursor: pointer;
    outline: none;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &:hover {
      border-color: rgba(0, 0, 0, 0.24);
    }

    &:focus-visible {
      border-color: $primary;
      box-shadow: 0 0 0 2px rgba($primary, 0.15);
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  &__text {
    flex: 1;
    text-align: start;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &--placeholder {
      color: $text-disabled;
    }
  }

  &__arrow {
    font-size: 1.1rem;
    color: $text-secondary;
    transition: transform $transition-fast;
    flex-shrink: 0;
    margin-inline-start: auto;
  }

  // ── Compact variant ──────────────────────────────────────
  &--compact .app-select__trigger {
    padding: 4px 8px;
    font-size: 0.8rem;
    border-radius: 6px;
  }

  &--compact .app-select__arrow {
    font-size: 0.95rem;
  }
}

// ── Dropdown (teleported to body) ────────────────────────────
.app-select__dropdown {
  max-height: 220px;
  overflow-y: auto;
  background: $surface;
  border: 1px solid $divider;
  border-radius: $border-radius-md;
  box-shadow: $shadow-4;
  overscroll-behavior: contain;
  font-family: inherit;

  &--compact {
    max-height: 180px;
  }

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
  }
}

.app-select__options {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}

// ── Option ───────────────────────────────────────────────
.app-select__option {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: $text-primary;
  cursor: pointer;
  transition: background $transition-fast;

  &:hover,
  &--focused {
    background: rgba(0, 0, 0, 0.04);
  }

  &--active {
    color: $primary;
    font-weight: 500;
  }

  &--active.app-select__option--focused {
    background: rgba($primary, 0.06);
  }
}

.app-select__option-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-select__check {
  font-size: 0.9rem;
  color: $primary;
  flex-shrink: 0;
}

.app-select__dropdown--compact .app-select__option {
  padding: 6px 10px;
  font-size: 0.8rem;
}

// ── Transition ─────────────────────────────────────────────
.app-select-drop-enter-active,
.app-select-drop-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
  transform-origin: top center;
}

.app-select-drop-enter-from,
.app-select-drop-leave-to {
  opacity: 0;
  transform: scaleY(0.92) translateY(-4px);
}

.app-select__dropdown--up {
  &.app-select-drop-enter-active,
  &.app-select-drop-leave-active {
    transform-origin: bottom center;
  }

  &.app-select-drop-enter-from,
  &.app-select-drop-leave-to {
    transform: scaleY(0.92) translateY(4px);
  }
}

// ── Dark Mode ──────────────────────────────────────────────
body.dark-mode .app-select {
  &__trigger {
    background: $dark-card;
    border-color: $dark-border;
    color: $dark-text-light;

    &:hover {
      border-color: lighten($dark-border, 10%);
    }

    &:focus-visible {
      border-color: $primary-light;
      box-shadow: 0 0 0 2px rgba($primary-light, 0.2);
    }
  }

  &__arrow {
    color: $dark-text-muted;
  }

  &__text--placeholder {
    color: $dark-text-muted;
  }
}

body.dark-mode .app-select__dropdown {
  background: $dark-card;
  border-color: $dark-border;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
  }
}

body.dark-mode .app-select__option {
  color: $dark-text-light;

  &:hover,
  &--focused {
    background: rgba(255, 255, 255, 0.06);
  }

  &--active {
    color: $primary-light;
  }

  &--active.app-select__option--focused {
    background: rgba($primary-light, 0.1);
  }
}

body.dark-mode .app-select__check {
  color: $primary-light;
}
</style>
