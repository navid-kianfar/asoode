<template>
  <AuthLayout>
    <!-- Stage 1: Enter email/phone -->
    <template v-if="mode === 'forgot'">
      <h1 class="cu-title">{{ $t('FORGOT_PASSWORD') }}</h1>
      <p class="cu-subtitle">
        {{ $t('IF_YOU_REMEMBER_PASSWORD') }}
        <router-link to="/login" class="cu-link">{{ $t('LOGIN_HERE') }}</router-link>
      </p>

      <CaptchaForm ref="captchaForm" class="cu-form" @submit="forgot" v-slot="{ isReady }">
        <!-- Username -->
        <div class="cu-field">
          <label class="cu-label">{{ $t('EMAIL_OR_PHONE') }}</label>
          <div class="cu-input-wrap" :class="{ 'cu-error': usernameErrors.length }">
            <input
              v-model="username"
              type="text"
              autocomplete="email"
              class="cu-input ltr"
              :placeholder="$t('ENTER_EMAIL_OR_PHONE')"
            />
          </div>
          <TransitionGroup name="shake">
            <p v-for="err in usernameErrors" :key="err" class="cu-error-text">{{ $t(err) }}</p>
          </TransitionGroup>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="cu-btn-primary"
          :disabled="waiting || !isReady"
        >
          <i v-if="waiting" class="mdi mdi-loading mdi-spin"></i>
          <span v-else>{{ $t('RECOVER') }}</span>
        </button>
      </CaptchaForm>

      <div class="cu-back-link">
        <router-link to="/login" class="cu-link">
          <i class="mdi mdi-arrow-left"></i>
          {{ $t('BACK_TO_LOGIN') }}
        </router-link>
      </div>
    </template>

    <!-- Stage 2: Reset password with OTP code -->
    <template v-if="mode === 'confirm'">
      <h1 class="cu-title">{{ $t('PASSWORD_RECOVERY') }}</h1>

      <div class="cu-illustration">
        <template v-if="isEmail">
          <i class="mdi mdi-email-check-outline cu-icon-large"></i>
          <p class="cu-subtitle">
            {{ formatString($t('RECOVERY_CHECK_EMAIL'), username) }}
          </p>
        </template>
        <template v-else>
          <i class="mdi mdi-cellphone-message cu-icon-large"></i>
          <p class="cu-subtitle">
            {{ formatString($t('CONFIRM_PHONE_DESCRIPTION'), username) }}
          </p>
        </template>
      </div>

      <form class="cu-form" @submit.prevent="reset">
        <!-- Verification Code (6-digit) -->
        <div class="cu-field">
          <label class="cu-label">{{ $t('VERIFICATION_CODE') }}</label>
          <PhoneVerification
            v-model="code"
            :has-error="codeErrors.length > 0"
          />
          <TransitionGroup name="shake">
            <p v-for="err in codeErrors" :key="err" class="cu-error-text">{{ $t(err) }}</p>
          </TransitionGroup>
        </div>

        <!-- New Password -->
        <div class="cu-field">
          <label class="cu-label">{{ $t('PASSWORD') }}</label>
          <div class="cu-input-wrap" :class="{ 'cu-error': newPasswordErrors.length }">
            <input
              v-model="newPassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              class="cu-input ltr"
              :placeholder="$t('ENTER_NEW_PASSWORD')"
            />
            <button type="button" class="cu-toggle-pass" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'mdi mdi-eye-off-outline' : 'mdi mdi-eye-outline'"></i>
            </button>
          </div>
          <TransitionGroup name="shake">
            <p v-for="err in newPasswordErrors" :key="err" class="cu-error-text">{{ $t(err) }}</p>
          </TransitionGroup>
        </div>

        <!-- Confirm Password -->
        <div class="cu-field">
          <label class="cu-label">{{ $t('CONFIRM_PASSWORD') }}</label>
          <div class="cu-input-wrap" :class="{ 'cu-error': confirmPasswordErrors.length }">
            <input
              v-model="confirmPasswordVal"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              class="cu-input ltr"
              :placeholder="$t('CONFIRM_PASSWORD')"
              @keydown.enter="reset"
            />
          </div>
          <TransitionGroup name="shake">
            <p v-for="err in confirmPasswordErrors" :key="err" class="cu-error-text">{{ $t(err) }}</p>
          </TransitionGroup>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="cu-btn-primary"
          :disabled="waiting"
        >
          <i v-if="waiting" class="mdi mdi-loading mdi-spin"></i>
          <span v-else>{{ $t('RESET_PASSWORD') }}</span>
        </button>
      </form>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useAppStore } from '@/stores/app.store';
import { OperationResultStatus, type CaptchaPayload } from '@asoode/shared';
import AuthLayout from './auth/AuthLayout.vue';
import PhoneVerification from '@/components/features/account/PhoneVerification.vue';
import CaptchaForm from '@/components/features/misc/CaptchaForm.vue';

type ViewMode = 'forgot' | 'confirm';

const router = useRouter();
const authStore = useAuthStore();
const appStore = useAppStore();
const captchaForm = ref<InstanceType<typeof CaptchaForm> | null>(null);

const mode = ref<ViewMode>('forgot');
const username = ref('');
const showPassword = ref(false);
const waiting = ref(false);
const tokenId = ref('');
const isEmail = ref(false);

const usernameErrors = ref<string[]>([]);

// Reset form
const newPassword = ref('');
const confirmPasswordVal = ref('');
const code = ref('');
const newPasswordErrors = ref<string[]>([]);
const confirmPasswordErrors = ref<string[]>([]);
const codeErrors = ref<string[]>([]);

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function formatString(template: string, ...args: any[]): string {
  return template.replace(/\{(\d+)\}/g, (match, index) => {
    return args[index] !== undefined ? String(args[index]) : match;
  });
}

function validateForgot(): boolean {
  usernameErrors.value = [];
  let valid = true;

  if (!username.value) {
    usernameErrors.value.push('EMAIL_OR_PHONE_REQUIRED');
    valid = false;
  } else if (username.value.length < 10) {
    usernameErrors.value.push('EMAIL_OR_PHONE_MIN_LENGTH');
    valid = false;
  } else if (username.value.length > 50) {
    usernameErrors.value.push('EMAIL_OR_PHONE_MAX_LENGTH');
    valid = false;
  }

  return valid;
}

function validateReset(): boolean {
  let valid = true;
  newPasswordErrors.value = [];
  confirmPasswordErrors.value = [];
  codeErrors.value = [];

  if (!newPassword.value) {
    newPasswordErrors.value.push('PASSWORD_REQUIRED');
    valid = false;
  } else if (newPassword.value.length < 6) {
    newPasswordErrors.value.push('PASSWORD_MIN_LENGTH');
    valid = false;
  } else if (newPassword.value.length > 50) {
    newPasswordErrors.value.push('PASSWORD_MAX_LENGTH');
    valid = false;
  }

  if (!confirmPasswordVal.value) {
    confirmPasswordErrors.value.push('CONFIRM_PASSWORD_REQUIRED');
    valid = false;
  } else if (confirmPasswordVal.value !== newPassword.value) {
    confirmPasswordErrors.value.push('CONFIRM_PASSWORD_MISS_MATCH');
    valid = false;
  }

  if (!code.value || code.value.length !== 6) {
    codeErrors.value.push('VERIFICATION_CODE_INVALID');
    valid = false;
  }

  return valid;
}

async function forgot(captcha: CaptchaPayload) {
  if (!validateForgot()) return;

  waiting.value = true;
  const op = await authStore.forgot({
    username: username.value,
    captcha,
  });
  waiting.value = false;

  if (op.status !== OperationResultStatus.Success) {
    await captchaForm.value?.reset();
    return;
  }

  if (op.data?.lockedOut) {
    usernameErrors.value = ['ACCOUNT_LOCKED_OUT'];
    await captchaForm.value?.reset();
    return;
  }

  if (op.data?.notFound) {
    usernameErrors.value = ['IF_YOU_DONT_HAVE_ACCOUNT'];
    await captchaForm.value?.reset();
    return;
  }

  if (op.data?.smsFailed) {
    usernameErrors.value = ['ACCOUNT_SMS_FAILED'];
    await captchaForm.value?.reset();
    return;
  }

  if (op.data?.emailFailed) {
    usernameErrors.value = ['ACCOUNT_EMAIL_FAILED'];
    await captchaForm.value?.reset();
    return;
  }

  if (op.data?.emailNotConfirmed) {
    usernameErrors.value = ['EMAIL_NOT_CONFIRMED'];
    await captchaForm.value?.reset();
    return;
  }

  if (op.data?.phoneNotConfirmed) {
    usernameErrors.value = ['PHONE_NOT_CONFIRMED'];
    await captchaForm.value?.reset();
    return;
  }

  mode.value = 'confirm';
  tokenId.value = op.data?.id || '';
  isEmail.value = emailRegex.test(String(username.value).toLowerCase());
}

async function reset() {
  if (!validateReset()) return;

  waiting.value = true;
  const op = await authStore.resetPassword({
    id: tokenId.value,
    code: code.value,
    password: newPassword.value,
    confirmPassword: confirmPasswordVal.value,
  });
  waiting.value = false;

  if (op.status !== OperationResultStatus.Success) {
    codeErrors.value = ['VERIFICATION_CODE_INVALID'];
    return;
  }

  const data = op.data as any;
  if (data?.token) {
    authStore.setIdentity({
      token: data.token,
      userId: data.userId,
      username: data.username,
    });
    await appStore.refresh();
    await router.push('/dashboard');
    return;
  }

  await router.push('/login');
}
</script>

<style scoped lang="scss">
.cu-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #292d34;
  margin: 0 0 8px;
  text-align: center;
  letter-spacing: -0.01em;
}

.cu-subtitle {
  font-size: 0.875rem;
  color: #7c828d;
  text-align: center;
  margin: 0 0 28px;
  line-height: 1.5;
}

.cu-link {
  color: #7b68ee;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  &:hover { text-decoration: underline; }
}

.cu-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cu-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cu-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #292d34;
}

.cu-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: #f7f8fa;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: #7b68ee;
    box-shadow: 0 0 0 3px rgba(123, 104, 238, 0.1);
  }

  &.cu-error {
    border-color: #e74c3c;
    &:focus-within { box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1); }
  }
}

.cu-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 14px;
  font-size: 0.875rem;
  color: #292d34;
  outline: none;
  width: 100%;
  font-family: inherit;

  &::placeholder { color: #a5adb7; }
  &.ltr { text-align: left; direction: ltr; }
}

.cu-toggle-pass {
  background: none;
  border: none;
  padding: 0 12px;
  cursor: pointer;
  color: #a5adb7;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  &:hover { color: #7b68ee; }
}

.cu-error-text {
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

.cu-btn-primary {
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
  margin-top: 4px;
  font-family: inherit;

  &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  &:active:not(:disabled) { transform: translateY(0); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.cu-back-link {
  text-align: center;
  margin-top: 24px;
}

.cu-illustration {
  text-align: center;
  margin-bottom: 8px;
}

.cu-icon-large {
  font-size: 3rem;
  color: #7b68ee;
  display: block;
  margin-bottom: 12px;
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
  .cu-title { color: #e2e8f0; }
  .cu-subtitle { color: #94a3b8; }
  .cu-label { color: #e2e8f0; }
  .cu-input-wrap { background: #2a2a3a; border-color: #3d3d50; }
  .cu-input { color: #e2e8f0; &::placeholder { color: #64748b; } }
  .cu-error-text { color: #f87171; }
  .cu-icon-large { color: #a29bfe; }
}
</style>
