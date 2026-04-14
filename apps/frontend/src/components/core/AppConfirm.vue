<template>
  <AppModal
    v-model="internalValue"
    :width="440"
    :persistent="persistent || loading"
    :show-close="false"
    :tone="tone"
    class="app-confirm"
  >
    <div class="app-confirm__hero">
      <div v-if="icon" class="app-confirm__icon-box" :class="`app-confirm__icon-box--${tone || 'primary'}`">
        <v-icon :icon="icon" size="32" />
      </div>
      <div class="app-confirm__content">
        <h3 class="app-confirm__title">{{ title }}</h3>
        <p v-if="message" class="app-confirm__message">{{ message }}</p>
      </div>
    </div>

    <template #footer>
      <v-btn
        variant="text"
        :disabled="loading"
        class="app-confirm__btn"
        @click="onCancel"
      >
        {{ cancelLabel || $t('CANCEL') }}
      </v-btn>
      <v-btn
        :color="actionColor || (tone === 'danger' ? 'error' : 'primary')"
        :loading="loading"
        elevation="2"
        class="app-confirm__btn app-confirm__btn--primary"
        @click="onConfirm"
      >
        {{ actionLabel || $t('CONFIRM') }}
      </v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppModal from './AppModal.vue';

const props = defineProps<{
  modelValue: boolean;
  title: string;
  message?: string;
  icon?: string;
  tone?: 'primary' | 'warn' | 'success' | 'info' | 'danger';
  actionLabel?: string;
  cancelLabel?: string;
  actionColor?: string;
  loading?: boolean;
  persistent?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

function onConfirm() {
  emit('confirm');
}

function onCancel() {
  emit('cancel');
  internalValue.value = false;
}
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.app-confirm {
  &__hero {
    display: flex;
    gap: $spacing-md;
    padding-top: $spacing-sm;
  }

  &__icon-box {
    width: 56px;
    height: 56px;
    min-width: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba($primary, 0.08);
    color: $primary;

    &--danger { background: rgba($warn, 0.1); color: $warn; }
    &--warn { background: rgba($warn, 0.08); color: $warn; }
    &--success { background: rgba($success, 0.1); color: $success; }
    &--info { background: rgba($info, 0.1); color: $info; }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.3;
  }

  &__message {
    margin: 12px 0 0;
    font-size: 1rem;
    color: $text-secondary;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  &__btn {
    min-width: 100px;
    height: 40px !important;
    text-transform: none;
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.01em;
    border-radius: 10px;

    &--primary {
      padding-left: $spacing-lg !important;
      padding-right: $spacing-lg !important;
    }
  }
}

// ── Dark Mode ───────────────────────────────────────────────────────
body.dark-mode {
  .app-confirm {
    &__title { color: $dark-text-primary; }
    &__message { color: $dark-text-secondary; }
    &__icon-box {
      background: rgba(255, 255, 255, 0.05);
      // Icons keep their tone colors
    }
  }
}
</style>
