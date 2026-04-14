<template>
  <div class="ca-container">
    <!-- Icon + description -->
    <div class="ca-illustration">
      <div class="ca-icon-wrap">
        <i :class="isEmail ? 'mdi mdi-email-check-outline' : 'mdi mdi-cellphone-message'" class="ca-icon"></i>
      </div>
      <h2 class="ca-title">
        {{ isEmail ? $t('CONFIRM_EMAIL_TITLE') : $t('CONFIRM_PHONE_TITLE') }}
      </h2>
      <p class="ca-description">
        {{ formatString(
          isEmail ? $t('CONFIRM_EMAIL_DESCRIPTION') : $t('CONFIRM_PHONE_DESCRIPTION'),
          username,
        ) }}
      </p>
    </div>

    <!-- Countdown timer -->
    <div class="ca-timer" :class="{ 'ca-timer-expired': remaining === 0 }">
      <i class="mdi mdi-timer-outline ca-timer-icon"></i>
      <span>{{ formattedRemaining }}</span>
    </div>

    <!-- Resend button -->
    <button
      class="ca-resend-btn"
      :disabled="sendingAgain || remaining > 0"
      @click="sendAgain"
    >
      <i v-if="sendingAgain" class="mdi mdi-loading mdi-spin"></i>
      <i v-else class="mdi mdi-refresh"></i>
      {{ $t('SEND_AGAIN') }}
    </button>

    <!-- 6-digit OTP input -->
    <div class="ca-field">
      <label class="ca-label">{{ $t('VERIFICATION_CODE') }}</label>
      <PhoneVerification
        v-model="verificationCode"
        :disabled="disabled"
        :has-error="hasError"
      />
      <TransitionGroup name="shake">
        <p v-if="errorMessage" :key="errorMessage" class="ca-error-text">
          {{ $t(errorMessage) }}
        </p>
      </TransitionGroup>
    </div>

    <!-- Verify button -->
    <button
      class="ca-btn-primary"
      :disabled="disabled"
      @click="verify"
    >
      <i v-if="disabled" class="mdi mdi-loading mdi-spin"></i>
      <span v-else>{{ $t('VERIFY') }}</span>
    </button>

    <!-- Back link -->
    <button class="ca-back-btn" @click="emit('goBack')">
      <i class="mdi mdi-arrow-left"></i>
      {{ $t('BACK') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useAppStore } from '@/stores/app.store';
import { OperationResultStatus } from '@asoode/shared';
import PhoneVerification from './PhoneVerification.vue';

const props = defineProps<{
  username: string;
  id: string;
}>();

const emit = defineEmits<{
  (e: 'goBack'): void;
}>();

const router = useRouter();
const authStore = useAuthStore();
const appStore = useAppStore();

const disabled = ref(false);
const isEmail = ref(false);
const remaining = ref(120);
const verificationCode = ref('');
const hasError = ref(false);
const errorMessage = ref('');
const sendingAgain = ref(false);
let handler: ReturnType<typeof setInterval> | null = null;

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const formattedRemaining = computed(() => {
  const mins = Math.floor(remaining.value / 60).toString().padStart(2, '0');
  const secs = (remaining.value % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
});

function formatString(template: string, ...args: any[]): string {
  return template.replace(/\{(\d+)\}/g, (match, index) => {
    return args[index] !== undefined ? String(args[index]) : match;
  });
}

function countDown() {
  remaining.value = 120;
  if (handler) clearInterval(handler);
  handler = setInterval(() => {
    remaining.value--;
    if (remaining.value === 0) {
      if (handler) clearInterval(handler);
      handler = null;
    }
  }, 1000);
}

async function sendAgain() {
  sendingAgain.value = true;
  const op = await authStore.resendVerification(props.id);
  sendingAgain.value = false;
  if (op.status !== OperationResultStatus.Success) {
    return;
  }
  countDown();
}

async function verify() {
  errorMessage.value = '';
  hasError.value = !(verificationCode.value && verificationCode.value.length === 6);
  if (hasError.value) {
    errorMessage.value = 'VERIFICATION_CODE_INVALID';
    return;
  }

  disabled.value = true;
  const op = await authStore.verifyAccount({
    id: props.id,
    code: verificationCode.value,
  });

  if (op.status !== OperationResultStatus.Success) {
    disabled.value = false;
    errorMessage.value = 'VERIFICATION_CODE_INVALID';
    return;
  }

  if (op.data?.token) {
    await appStore.refresh();
    await router.push('/dashboard');
    return;
  }

  disabled.value = false;

  if (op.data?.smsFailed) {
    errorMessage.value = 'ACCOUNT_SMS_FAILED';
  } else {
    errorMessage.value = 'VERIFICATION_CODE_INVALID';
  }
}

onMounted(() => {
  errorMessage.value = '';
  isEmail.value = emailRegex.test(String(props.username).toLowerCase());
  countDown();
});

onUnmounted(() => {
  if (handler) clearInterval(handler);
});
</script>

<style scoped lang="scss">
.ca-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.ca-illustration {
  text-align: center;
  margin-bottom: 4px;
}

.ca-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(123, 104, 238, 0.12), rgba(108, 92, 231, 0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.ca-icon {
  font-size: 2rem;
  color: #7b68ee;
}

.ca-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #292d34;
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}

.ca-description {
  font-size: 0.85rem;
  color: #7c828d;
  line-height: 1.6;
  margin: 0;
  max-width: 340px;
}

.ca-timer {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #7b68ee;
  font-variant-numeric: tabular-nums;
  font-family: 'Inter', monospace;
  padding: 6px 16px;
  border-radius: 8px;
  background: rgba(123, 104, 238, 0.06);
  transition: color 0.3s, background 0.3s;
}

.ca-timer-icon {
  font-size: 1.1rem;
}

.ca-timer-expired {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.06);
}

.ca-resend-btn {
  background: none;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 20px;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #7c828d;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
  font-family: inherit;

  &:hover:not(:disabled) {
    border-color: #7b68ee;
    color: #7b68ee;
    background: rgba(123, 104, 238, 0.04);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.ca-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.ca-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #292d34;
  align-self: flex-start;
}

.ca-error-text {
  font-size: 0.75rem;
  color: #e74c3c;
  margin: 0;
  animation: shakeIn 0.4s ease;
}

@keyframes shakeIn {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

.shake-enter-active { animation: shakeIn 0.4s ease; }
.shake-leave-active { transition: opacity 0.2s; }
.shake-leave-to { opacity: 0; }

.ca-btn-primary {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #7b68ee, #6c5ce7);
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.2s, transform 0.1s;
  font-family: inherit;

  &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  &:active:not(:disabled) { transform: translateY(0); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.ca-back-btn {
  background: none;
  border: none;
  color: #7b68ee;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  font-family: inherit;

  &:hover { text-decoration: underline; }
}

.mdi-spin {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ─── Dark Mode ──────────────────────────────────────────────
:global(body.dark-mode) {
  .ca-title { color: #e2e8f0; }
  .ca-description { color: #94a3b8; }
  .ca-label { color: #e2e8f0; }
  .ca-icon-wrap { background: linear-gradient(135deg, rgba(123, 104, 238, 0.2), rgba(108, 92, 231, 0.12)); }
  .ca-icon { color: #a29bfe; }
  .ca-timer { background: rgba(123, 104, 238, 0.1); color: #a29bfe; }
  .ca-timer-expired { color: #f87171; background: rgba(248, 113, 113, 0.1); }
  .ca-resend-btn {
    border-color: #3d3d50;
    color: #94a3b8;
    &:hover:not(:disabled) { border-color: #a29bfe; color: #a29bfe; }
  }
  .ca-error-text { color: #f87171; }
  .ca-back-btn { color: #a29bfe; }
}
</style>
