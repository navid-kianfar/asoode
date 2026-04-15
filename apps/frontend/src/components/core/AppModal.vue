<template>
  <v-dialog
    v-model="internalValue"
    :width="width || 560"
    :max-width="maxWidth"
    :persistent="persistent || loading"
    class="app-modal"
    :class="[{ 'app-modal--loading': loading, 'app-modal--stable': stable }, contentClass]"
    transition="dialog-bottom-transition"
  >
    <v-card 
      class="app-modal__card" 
      :elevation="24"
      :style="{ 
        minHeight: minHeight ? (typeof minHeight === 'number' ? minHeight + 'px' : minHeight) : undefined,
        height: height ? (typeof height === 'number' ? height + 'px' : height) : undefined 
      }"
    >
      <!-- Header -->
      <div v-if="title || $slots.header" class="app-modal__header" :class="`app-modal__header--${tone || 'default'}`">
        <slot name="header">
          <div class="app-modal__header-content">
            <h3 class="app-modal__title">{{ title }}</h3>
            <p v-if="subtitle" class="app-modal__subtitle">{{ subtitle }}</p>
          </div>
        </slot>
        <v-btn
          v-if="showClose !== false"
          icon
          size="small"
          variant="text"
          class="app-modal__close-btn"
          :disabled="loading"
          @click="onClose"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Content/Body -->
      <v-card-text class="app-modal__body">
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          height="2"
          class="app-modal__loader"
        />
        <slot />
      </v-card-text>

      <!-- Footer -->
      <v-card-actions v-if="$slots.footer" class="app-modal__footer">
        <slot name="footer" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  title?: string;
  subtitle?: string;
  width?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  height?: string | number;
  persistent?: boolean;
  loading?: boolean;
  showClose?: boolean;
  stable?: boolean;
  contentClass?: string;
  tone?: 'default' | 'primary' | 'warn' | 'success' | 'info' | 'danger';
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

function onClose() {
  emit('close');
  internalValue.value = false;
}
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.app-modal {
  .v-overlay__content {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &--stable &__card {
    min-height: 480px;
  }

  &__card {
    border-radius: $border-radius-lg !important;
    overflow: hidden;
    background: $surface;
    display: flex;
    flex-direction: column;
    max-height: 94vh;
    min-width: 320px;
    border: 1px solid rgba(var(--v-border-color), 0.08);
  }

  // ── Header ────────────────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: $spacing-md $spacing-lg;
    border-bottom: 1px solid rgba(var(--v-border-color), 0.05);
    background: linear-gradient(to bottom, rgba(var(--v-theme-surface), 0.8), rgba(var(--v-theme-surface), 1));
    flex-shrink: 0;

    &--primary { border-top: 4px solid $primary; }
    &--warn, &--danger { border-top: 4px solid $warn; }
    &--success { border-top: 4px solid $success; }
    &--info { border-top: 4px solid $info; }
  }

  &__header-content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.4;
  }

  &__subtitle {
    margin: 4px 0 0;
    font-size: 0.85rem;
    color: $text-secondary;
    line-height: 1.4;
  }

  &__close-btn {
    margin: -4px -8px 0 0;
    color: $text-secondary;
    &:hover {
      background: rgba(0,0,0,0.04) !important;
      color: $text-primary;
    }
  }

  // ── Body ──────────────────────────────────────────────────────────
  &__body {
    padding: $spacing-lg !important;
    overflow-y: auto;
    position: relative;
    font-size: 0.95rem;
    color: $text-primary;
    line-height: 1.6;

    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.1);
      border-radius: 3px;
    }
  }

  &__loader {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
  }

  // ── Footer ────────────────────────────────────────────────────────
  &__footer {
    padding: $spacing-md $spacing-lg !important;
    background: #f8fafc;
    border-top: 1px solid rgba(var(--v-border-color), 0.05);
    justify-content: flex-end;
    gap: $spacing-sm;
    flex-shrink: 0;
  }
}

// ── Dark Mode ───────────────────────────────────────────────────────
body.dark-mode {
  .app-modal {
    &__card {
      background: $dark-card;
      border-color: $dark-border;
    }

    &__header {
      background: $dark-card;
      border-bottom-color: $dark-border;
    }

    &__title { color: $dark-text-primary; }
    &__subtitle { color: $dark-text-secondary; }
    &__close-btn { color: $dark-text-secondary; &:hover { color: #fff; background: rgba(255,255,255,0.05) !important; } }

    &__body {
      color: $dark-text-primary;
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
    }

    &__footer {
      background: rgba(255,255,255,0.02);
      border-top-color: $dark-border;
    }
  }
}
</style>
