<template>
  <AuthLayout>
    <!-- Register form -->
    <template v-if="mode === 'register'">
      <h1 class="cu-title">{{ $t('CREATE_YOUR_ACCOUNT') }}</h1>
      <p class="cu-subtitle">
        {{ $t('IF_YOU_HAVE_ACCOUNT') }}
        <router-link to="/login" class="cu-link">{{ $t('LOGIN_HERE') }}</router-link>
      </p>

      <CaptchaForm ref="captchaForm" class="cu-form" @submit="register" v-slot="{ isReady }">
        <!-- Name row -->
        <div class="cu-name-row">
          <div class="cu-field">
            <label class="cu-label">{{ $t('FIRST_NAME') }}</label>
            <div class="cu-input-wrap" :class="{ 'cu-error': firstNameErrors.length }">
              <input
                v-model="firstName"
                type="text"
                autocomplete="given-name"
                class="cu-input"
                :placeholder="$t('FIRST_NAME')"
              />
            </div>
            <TransitionGroup name="shake">
              <p v-for="err in firstNameErrors" :key="err" class="cu-error-text">{{ $t(err) }}</p>
            </TransitionGroup>
          </div>

          <div class="cu-field">
            <label class="cu-label">{{ $t('LAST_NAME') }}</label>
            <div class="cu-input-wrap" :class="{ 'cu-error': lastNameErrors.length }">
              <input
                v-model="lastName"
                type="text"
                autocomplete="family-name"
                class="cu-input"
                :placeholder="$t('LAST_NAME')"
              />
            </div>
            <TransitionGroup name="shake">
              <p v-for="err in lastNameErrors" :key="err" class="cu-error-text">{{ $t(err) }}</p>
            </TransitionGroup>
          </div>
        </div>

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

        <!-- Password -->
        <div class="cu-field">
          <label class="cu-label">{{ $t('PASSWORD') }}</label>
          <div class="cu-input-wrap" :class="{ 'cu-error': passwordErrors.length }">
            <input
              v-model="passwordVal"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              class="cu-input ltr"
              :placeholder="$t('ENTER_PASSWORD')"
            />
            <button type="button" class="cu-toggle-pass" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'mdi mdi-eye-off-outline' : 'mdi mdi-eye-outline'"></i>
            </button>
          </div>
          <TransitionGroup name="shake">
            <p v-for="err in passwordErrors" :key="err" class="cu-error-text">{{ $t(err) }}</p>
          </TransitionGroup>
        </div>

        <!-- Confirm Password -->
        <div class="cu-field">
          <label class="cu-label">{{ $t('CONFIRM_PASSWORD') }}</label>
          <div class="cu-input-wrap" :class="{ 'cu-error': confirmPasswordErrors.length }">
            <input
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              class="cu-input ltr"
              :placeholder="$t('CONFIRM_PASSWORD')"
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
          :disabled="waiting || !isReady"
        >
          <i v-if="waiting" class="mdi mdi-loading mdi-spin"></i>
          <span v-else>{{ $t('REGISTER') }}</span>
        </button>
      </CaptchaForm>

      <!-- Divider -->
      <div class="cu-divider">
        <span>{{ $t('OR') }}</span>
      </div>

      <!-- Google OAuth -->
      <a class="cu-btn-social" :href="googleOauth">
        <img src="/assets/images/pages/auth/google-logo.svg" alt="Google" />
        <span>{{ $t('LOGIN_WITH_GOOGLE') }}</span>
      </a>
    </template>

    <!-- Confirm account (OTP) -->
    <template v-if="mode === 'confirm'">
      <ConfirmAccount
        :id="verificationCode"
        :username="username"
        @go-back="goBack"
      />
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { OperationResultStatus, type CaptchaPayload } from '@asoode/shared';
import AuthLayout from './auth/AuthLayout.vue';
import ConfirmAccount from '@/components/features/account/ConfirmAccount.vue';
import CaptchaForm from '@/components/features/misc/CaptchaForm.vue';

type ViewMode = 'register' | 'confirm';

const router = useRouter();
const authStore = useAuthStore();
const captchaForm = ref<InstanceType<typeof CaptchaForm> | null>(null);

const mode = ref<ViewMode>('register');
const firstName = ref('');
const lastName = ref('');
const username = ref('');
const passwordVal = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const waiting = ref(false);
const verificationCode = ref('');

const firstNameErrors = ref<string[]>([]);
const lastNameErrors = ref<string[]>([]);
const usernameErrors = ref<string[]>([]);
const passwordErrors = ref<string[]>([]);
const confirmPasswordErrors = ref<string[]>([]);

const googleOauth = '/proxy-api/oauth/google-login';

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}

function validate(): boolean {
  let valid = true;
  firstNameErrors.value = [];
  lastNameErrors.value = [];
  usernameErrors.value = [];
  passwordErrors.value = [];
  confirmPasswordErrors.value = [];

  if (!firstName.value) {
    firstNameErrors.value.push('FIRST_NAME_REQUIRED');
    valid = false;
  } else if (firstName.value.length < 2) {
    firstNameErrors.value.push('FIRST_NAME_MIN_LENGTH');
    valid = false;
  } else if (firstName.value.length > 50) {
    firstNameErrors.value.push('FIRST_NAME_MAX_LENGTH');
    valid = false;
  }

  if (!lastName.value) {
    lastNameErrors.value.push('LAST_NAME_REQUIRED');
    valid = false;
  } else if (lastName.value.length < 2) {
    lastNameErrors.value.push('LAST_NAME_MIN_LENGTH');
    valid = false;
  } else if (lastName.value.length > 50) {
    lastNameErrors.value.push('LAST_NAME_MAX_LENGTH');
    valid = false;
  }

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

  if (!passwordVal.value) {
    passwordErrors.value.push('PASSWORD_REQUIRED');
    valid = false;
  } else if (passwordVal.value.length < 6) {
    passwordErrors.value.push('PASSWORD_MIN_LENGTH');
    valid = false;
  } else if (passwordVal.value.length > 50) {
    passwordErrors.value.push('PASSWORD_MAX_LENGTH');
    valid = false;
  }

  if (!confirmPassword.value) {
    confirmPasswordErrors.value.push('CONFIRM_PASSWORD_REQUIRED');
    valid = false;
  } else if (confirmPassword.value !== passwordVal.value) {
    confirmPasswordErrors.value.push('CONFIRM_PASSWORD_MISS_MATCH');
    valid = false;
  }

  return valid;
}

async function register(captcha: CaptchaPayload) {
  if (!validate()) return;

  waiting.value = true;
  const marketer = getCookie('MARKETER');
  const op = await authStore.register({
    firstName: firstName.value,
    lastName: lastName.value,
    username: username.value,
    password: passwordVal.value,
    confirmPassword: confirmPassword.value,
    captcha,
    ...(marketer ? { marketer } : {}),
  });
  waiting.value = false;

  if (op.status === OperationResultStatus.Success) {
    const data = op.data || ({} as any);
    verificationCode.value = data.id;

    if (data.emailNotConfirmed || data.phoneNotConfirmed) {
      mode.value = 'confirm';
      return;
    }

    if (data.duplicate) {
      usernameErrors.value = ['USERNAME_TAKEN'];
      await captchaForm.value?.reset();
      return;
    }

    if (data.smsFailed) {
      usernameErrors.value = ['ACCOUNT_SMS_FAILED'];
      await captchaForm.value?.reset();
      return;
    }

    if (data.emailFailed) {
      usernameErrors.value = ['ACCOUNT_EMAIL_FAILED'];
      await captchaForm.value?.reset();
      return;
    }

    mode.value = 'confirm';
  } else {
    await captchaForm.value?.reset();
  }
}

function goBack() {
  router.push('/login');
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
  &:hover { text-decoration: underline; }
}

.cu-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cu-name-row {
  display: flex;
  gap: 12px;

  > .cu-field {
    flex: 1;
  }
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
  padding: 11px 14px;
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

.cu-divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  gap: 12px;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e8ecf1;
  }

  span {
    font-size: 0.75rem;
    color: #a5adb7;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }
}

.cu-btn-social {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 44px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  text-decoration: none;
  transition: background-color 0.2s, border-color 0.2s;
  cursor: pointer;

  &:hover { background: #f7f8fa; border-color: #d2d6dc; }
  img { width: 20px; height: 20px; }
  span { font-size: 0.875rem; color: #292d34; font-weight: 500; }
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
  .cu-btn-social {
    background: #2a2a3a;
    border-color: #3d3d50;
    &:hover { background: #33334a; }
    span { color: #e2e8f0; }
  }
  .cu-divider {
    &::before, &::after { background: #3d3d50; }
    span { color: #64748b; }
  }
  .cu-error-text { color: #f87171; }
}

@media (max-width: 520px) {
  .cu-name-row {
    flex-direction: column;
    gap: 18px;
  }
}
</style>
