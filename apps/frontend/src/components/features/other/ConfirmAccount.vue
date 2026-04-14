<template>
  <div class="confirm-account pa-4">
    <div class="text-center mb-6">
      <v-icon size="64" color="primary" class="mb-3">mdi-email-check-outline</v-icon>
      <h3 class="text-h6 mb-1">{{ $t('VERIFY_ACCOUNT') }}</h3>
      <p class="text-body-2 text-medium-emphasis">
        {{ $t('ENTER_VERIFICATION_CODE') }}
      </p>
    </div>

    <!-- Code input -->
    <div class="d-flex justify-center ga-2 mb-6">
      <v-text-field
        v-for="(_, i) in codeDigits"
        :key="i"
        :ref="(el: any) => (inputRefs[i] = el)"
        v-model="codeDigits[i]"
        class="code-input"
        variant="outlined"
        density="comfortable"
        hide-details
        maxlength="1"
        style="max-width: 48px"
        @input="onDigitInput(i)"
        @keydown.delete="onDelete(i)"
        @paste="onPaste"
      />
    </div>

    <v-btn
      color="primary"
      block
      size="large"
      :loading="verifying"
      :disabled="!isCodeComplete"
      @click="verify"
    >
      {{ $t('VERIFY') }}
    </v-btn>

    <div class="text-center mt-4">
      <v-btn
        variant="text"
        size="small"
        :disabled="resendCooldown > 0"
        :loading="resending"
        @click="resend"
      >
        {{ resendCooldown > 0 ? `${$t('RESEND_CODE')} (${resendCooldown}s)` : $t('RESEND_CODE') }}
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mt-4" density="compact">
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import { OperationResultStatus } from '@asoode/shared';

const props = defineProps<{ id: string }>();
const emit = defineEmits<{ verified: [] }>();

const authStore = useAuthStore();

const codeDigits = reactive(['', '', '', '', '', '']);
const inputRefs = ref<any[]>([]);
const verifying = ref(false);
const resending = ref(false);
const resendCooldown = ref(0);
const error = ref('');

let cooldownInterval: ReturnType<typeof setInterval> | null = null;

const isCodeComplete = computed(() => {
  return codeDigits.every((d) => d.length === 1);
});

function onDigitInput(index: number) {
  error.value = '';
  // Auto-advance to next input
  if (codeDigits[index] && index < codeDigits.length - 1) {
    const next = inputRefs.value[index + 1];
    if (next) {
      next.focus();
    }
  }
  // Auto-verify when all digits are filled
  if (isCodeComplete.value) {
    verify();
  }
}

function onDelete(index: number) {
  if (!codeDigits[index] && index > 0) {
    const prev = inputRefs.value[index - 1];
    if (prev) {
      prev.focus();
    }
  }
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault();
  const pasted = event.clipboardData?.getData('text')?.trim() || '';
  const digits = pasted.replace(/\D/g, '').split('').slice(0, 6);
  for (let i = 0; i < digits.length; i++) {
    codeDigits[i] = digits[i];
  }
  if (digits.length >= 6 && isCodeComplete.value) {
    verify();
  }
}

async function verify() {
  if (!isCodeComplete.value || verifying.value) return;

  verifying.value = true;
  error.value = '';
  const code = codeDigits.join('');

  const result = await authStore.verifyAccount({ id: props.id, code });
  if (result.status === OperationResultStatus.Success) {
    emit('verified');
  } else {
    error.value = 'Invalid verification code. Please try again.';
  }
  verifying.value = false;
}

async function resend() {
  if (resendCooldown.value > 0 || resending.value) return;

  resending.value = true;
  await authStore.resendVerification(props.id);
  resending.value = false;

  // Start cooldown
  resendCooldown.value = 60;
  cooldownInterval = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0 && cooldownInterval) {
      clearInterval(cooldownInterval);
      cooldownInterval = null;
    }
  }, 1000);
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval);
});
</script>

<style scoped lang="scss">
.code-input :deep(input) {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0;
}
</style>
