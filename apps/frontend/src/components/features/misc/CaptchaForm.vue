<template>
  <form @submit.prevent="handleSubmit">
    <slot
      :is-ready="isReady"
      :is-solving="isSolving"
      :get-payload="getCaptchaPayload"
      :reset="reset"
    />
  </form>
</template>

<script setup lang="ts">
import { useCaptcha } from '@/composables/useCaptcha';
import type { CaptchaPayload } from '@asoode/shared';

const emit = defineEmits<{
  (e: 'submit', payload: CaptchaPayload): void;
}>();

const { isReady, isSolving, getCaptchaPayload, reset } = useCaptcha();

function handleSubmit() {
  emit('submit', getCaptchaPayload());
}

defineExpose({ isReady, isSolving, getCaptchaPayload, reset });
</script>
