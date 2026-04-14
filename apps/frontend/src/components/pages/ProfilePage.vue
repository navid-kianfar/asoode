<template>
  <div class="profile-page">
    <div class="profile-page__container">
      <!-- Profile Hero Card -->
      <div class="profile-card">
        <div class="profile-card__avatar" @click="triggerAvatarUpload">
          <img v-if="authStore.profile?.avatar" :src="authStore.profile.avatar" alt="" />
          <span v-else class="profile-card__initials">{{ authStore.profile?.initials || '?' }}</span>
          <div class="profile-card__avatar-overlay">
            <i class="mdi mdi-camera"></i>
          </div>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="profile-card__avatar-input"
            @change="onAvatarPicked"
          />
        </div>
        <div class="profile-card__info">
          <h1 class="profile-card__name">{{ authStore.profile?.fullName || '' }}</h1>
          <p v-if="authStore.profile?.bio" class="profile-card__bio">{{ authStore.profile.bio }}</p>
          <div class="profile-card__badges">
            <span v-if="showEmail" class="profile-card__badge" :class="authStore.profile?.emailConfirmed ? 'profile-card__badge--success' : 'profile-card__badge--warn'">
              <i class="mdi" :class="authStore.profile?.emailConfirmed ? 'mdi-check-circle' : 'mdi-alert-circle'"></i>
              {{ authStore.profile?.email }}
            </span>
            <span v-if="authStore.profile?.phone" class="profile-card__badge" :class="authStore.profile?.phoneConfirmed ? 'profile-card__badge--success' : 'profile-card__badge--warn'">
              <i class="mdi" :class="authStore.profile?.phoneConfirmed ? 'mdi-check-circle' : 'mdi-alert-circle'"></i>
              {{ authStore.profile.phone }}
            </span>
          </div>
        </div>
      </div>

      <!-- Settings Grid (two columns) -->
      <div class="profile-grid">
        <!-- Left Column -->
        <div class="profile-grid__col">
          <!-- Personal Info -->
          <section class="settings-section">
            <div class="settings-section__header">
              <h2><i class="mdi mdi-account-outline"></i> {{ $t('PERSONAL_INFO') }}</h2>
            </div>
            <div class="settings-section__body">
              <div class="settings-field">
                <label>{{ $t('FIRST_NAME') }}</label>
                <div class="settings-field__input-wrap">
                  <input v-model="formData.firstName" type="text" autocomplete="off" />
                  <span v-if="errors.firstName" class="settings-field__error">{{ $t(errors.firstName) }}</span>
                </div>
              </div>
              <div class="settings-field">
                <label>{{ $t('LAST_NAME') }}</label>
                <div class="settings-field__input-wrap">
                  <input v-model="formData.lastName" type="text" autocomplete="off" />
                  <span v-if="errors.lastName" class="settings-field__error">{{ $t(errors.lastName) }}</span>
                </div>
              </div>
              <div class="settings-field">
                <label>{{ $t('BIO') }}</label>
                <div class="settings-field__input-wrap">
                  <input v-model="formData.bio" type="text" autocomplete="off" :placeholder="$t('BIO')" />
                </div>
              </div>
              <div class="settings-field__actions">
                <button class="btn btn--primary" :disabled="savingProfile" @click="saveProfile">
                  <i v-if="savingProfile" class="mdi mdi-loading mdi-spin"></i>
                  {{ $t('SAVE_CHANGES') }}
                </button>
              </div>
            </div>
          </section>

          <!-- Contact -->
          <section class="settings-section">
            <div class="settings-section__header">
              <h2><i class="mdi mdi-at"></i> {{ $t('CONTACT_INFO') }}</h2>
            </div>
            <div class="settings-section__body">
              <div class="settings-field settings-field--row">
                <label>{{ $t('EMAIL') }}</label>
                <div class="settings-field__value-row">
                  <span class="settings-field__value">{{ formData.email || $t('NONE_PROVIDED') }}</span>
                  <button class="btn btn--ghost btn--sm" @click="showChangeEmailModal = true">{{ $t('CHANGE_EMAIL') }}</button>
                </div>
              </div>
              <div class="settings-field settings-field--row">
                <label>{{ $t('PHONE_NUMBER') }}</label>
                <div class="settings-field__value-row">
                  <span class="settings-field__value">{{ formData.phone || $t('NONE_PROVIDED') }}</span>
                  <button class="btn btn--ghost btn--sm" @click="showChangePhoneModal = true">{{ $t('CHANGE_PHONE') }}</button>
                </div>
              </div>
              <div class="settings-field settings-field--row">
                <label>{{ $t('PASSWORD') }}</label>
                <div class="settings-field__value-row">
                  <span class="settings-field__value">••••••••</span>
                  <button class="btn btn--ghost btn--sm" @click="showChangePasswordModal = true">{{ $t('CHANGE_PASSWORD') }}</button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Right Column -->
        <div class="profile-grid__col">
          <!-- Preferences -->
          <section class="settings-section">
            <div class="settings-section__header">
              <h2><i class="mdi mdi-tune-variant"></i> {{ $t('PREFERENCES') }}</h2>
            </div>
            <div class="settings-section__body">
              <div class="settings-field">
                <label>{{ $t('TIME_ZONE') }}</label>
                <div class="settings-field__input-wrap">
                  <AppSelect v-model="formData.timeZone" :items="timezoneItems" :placeholder="$t('TIME_ZONE')" />
                </div>
              </div>
              <div class="settings-field">
                <label>{{ $t('CALENDAR') }}</label>
                <div class="settings-field__input-wrap">
                  <AppSelect v-model="formData.calendar" :items="calendarItems" />
                </div>
              </div>
              <div class="settings-field settings-field--toggle">
                <label>{{ $t('DARK_MODE') }}</label>
                <button
                  class="toggle-switch"
                  :class="{ 'toggle-switch--on': formData.darkMode }"
                  @click="formData.darkMode = !formData.darkMode"
                >
                  <span class="toggle-switch__knob"></span>
                </button>
              </div>
              <div class="settings-field__actions">
                <button class="btn btn--primary" :disabled="savingPrefs" @click="savePreferences">
                  <i v-if="savingPrefs" class="mdi mdi-loading mdi-spin"></i>
                  {{ $t('SAVE_CHANGES') }}
                </button>
              </div>
            </div>
          </section>

          <!-- Danger Zone -->
          <section class="settings-section settings-section--danger">
            <div class="settings-section__header">
              <h2><i class="mdi mdi-logout"></i> {{ $t('LOGOUT') }}</h2>
            </div>
            <div class="settings-section__body">
              <p class="settings-section__desc">{{ $t('MODALS_CONFIRM_MESSAGE_HEADING') }}</p>
              <button class="btn btn--danger" @click="showLogoutConfirm = true">
                {{ $t('LOGOUT') }}
              </button>
            </div>
          </section>
        </div>
      </div>

      <!-- Tabs: Devices, Archived (full width below grid) -->
      <section class="settings-section">
        <div class="settings-section__tabs">
          <button
            v-for="t in tabs"
            :key="t.value"
            class="settings-section__tab"
            :class="{ 'settings-section__tab--active': activeTab === t.value }"
            @click="activeTab = t.value"
          >
            <i :class="'mdi ' + t.icon"></i>
            {{ $t(t.label) }}
          </button>
        </div>
        <div class="settings-section__body">
          <!-- Devices -->
          <template v-if="activeTab === 'devices'">
            <div v-if="devicesLoading" class="settings-loader">
              <i class="mdi mdi-loading mdi-spin"></i>
            </div>
            <template v-else-if="deviceList.length">
              <div v-for="device in deviceList" :key="device.id" class="device-row">
                <div class="device-row__icon">
                  <i :class="getDeviceIcon(device)"></i>
                </div>
                <div class="device-row__info">
                  <div class="device-row__title">{{ device.title }}</div>
                  <div class="device-row__os">{{ device.os }}</div>
                </div>
                <div class="device-row__actions">
                  <button
                    class="btn btn--ghost btn--sm"
                    :class="device.enabled ? 'btn--accent' : ''"
                    :disabled="device.toggling"
                    @click="toggleDevice(device)"
                  >
                    <i v-if="device.toggling" class="mdi mdi-loading mdi-spin"></i>
                    <i v-else class="mdi" :class="device.enabled ? 'mdi-bell-off' : 'mdi-bell'"></i>
                  </button>
                  <button class="btn btn--ghost btn--sm" :disabled="device.editing" @click="prepareRenameDevice(device)">
                    <i class="mdi mdi-pencil-outline"></i>
                  </button>
                  <button class="btn btn--ghost btn--sm btn--danger" :disabled="device.deleting" @click="prepareDeleteDevice(device)">
                    <i class="mdi mdi-delete-outline"></i>
                  </button>
                </div>
              </div>
            </template>
            <div v-else class="settings-empty">{{ $t('NO_DEVICES') }}</div>
          </template>

          <!-- Archived Projects -->
          <template v-if="activeTab === 'archived-projects'">
            <div v-if="archivedProjectsLoading" class="settings-loader">
              <i class="mdi mdi-loading mdi-spin"></i>
            </div>
            <template v-else-if="archivedProjects.length">
              <div v-for="project in archivedProjects" :key="project.id" class="archive-row">
                <i class="mdi mdi-folder-outline archive-row__icon"></i>
                <div class="archive-row__info">
                  <div class="archive-row__title">{{ project.title }}</div>
                  <div v-if="project.description" class="archive-row__desc">{{ project.description }}</div>
                </div>
              </div>
            </template>
            <div v-else class="settings-empty">{{ $t('NO_PROJECTS') }}</div>
          </template>

          <!-- Archived Groups -->
          <template v-if="activeTab === 'archived-groups'">
            <div v-if="archivedGroupsLoading" class="settings-loader">
              <i class="mdi mdi-loading mdi-spin"></i>
            </div>
            <template v-else-if="archivedGroups.length">
              <div v-for="group in archivedGroups" :key="group.id" class="archive-row archive-row--clickable" @click="openGroup(group)">
                <div class="archive-row__avatar">
                  <img v-if="group.avatar" :src="group.avatar" alt="" />
                  <i v-else class="mdi mdi-domain"></i>
                </div>
                <div class="archive-row__info">
                  <div class="archive-row__title">{{ group.title }}</div>
                </div>
              </div>
            </template>
            <div v-else class="settings-empty">{{ $t('NO_GROUPS') }}</div>
          </template>
        </div>
      </section>

    </div>

    <AppConfirm
      v-model="showLogoutConfirm"
      :title="$t('MODALS_CONFIRM_TITLE')"
      :message="$t('MODALS_CONFIRM_MESSAGE')"
      :confirm-text="$t('LOGOUT')"
      tone="danger"
      @confirm="logout"
    />

    <AppModal
      v-model="showChangePasswordModal"
      :title="$t('RESET_PASSWORD')"
      :width="440"
      :loading="changingPassword"
      @close="showChangePasswordModal = false"
    >
      <form @submit.prevent="onChangePassword()">
        <AppInput
          v-model="passwordForm.oldPassword"
          type="password"
          :label="$t('OLD_PASSWORD')"
          :placeholder="$t('OLD_PASSWORD')"
          :error-text="passwordErrors.oldPassword ? $t(passwordErrors.oldPassword) : undefined"
          dense
          class="mb-4"
        />
        <AppInput
          v-model="passwordForm.newPassword"
          type="password"
          :label="$t('PASSWORD')"
          :placeholder="$t('PASSWORD')"
          :error-text="passwordErrors.newPassword ? $t(passwordErrors.newPassword) : undefined"
          dense
          class="mb-4"
        />
        <AppInput
          v-model="passwordForm.confirmPassword"
          type="password"
          :label="$t('CONFIRM_PASSWORD')"
          :placeholder="$t('CONFIRM_PASSWORD')"
          :error-text="passwordErrors.confirmPassword ? $t(passwordErrors.confirmPassword) : undefined"
          dense
        />
      </form>

      <template #footer>
        <v-btn variant="text" @click="showChangePasswordModal = false">
          {{ $t('CANCEL') }}
        </v-btn>
        <v-btn
          color="primary"
          elevation="2"
          :loading="changingPassword"
          @click="onChangePassword()"
        >
          {{ $t('RESET_PASSWORD') }}
        </v-btn>
      </template>
    </AppModal>

    <AppModal
      v-model="showChangePhoneModal"
      :title="$t('CHANGE_PHONE')"
      :width="440"
      :loading="changingPhone"
      @close="showChangePhoneModal = false"
    >
      <form @submit.prevent="onChangePhone()">
        <AppInput
          v-model="phoneForm.phone"
          :label="$t('PHONE_NUMBER')"
          :placeholder="$t('PHONE_NUMBER')"
          dense
          class="mb-4"
        />
        <AppInput
          v-if="phoneVerificationId"
          v-model="phoneForm.code"
          :label="$t('VERIFICATION_CODE')"
          :placeholder="$t('VERIFICATION_CODE')"
          dense
        />
      </form>

      <template #footer>
        <v-btn variant="text" @click="showChangePhoneModal = false">
          {{ $t('CANCEL') }}
        </v-btn>
        <v-btn
          color="primary"
          elevation="2"
          :loading="changingPhone"
          @click="onChangePhone()"
        >
          {{ phoneVerificationId ? $t('CONFIRM') : $t('SEND_CODE') }}
        </v-btn>
      </template>
    </AppModal>

    <AppModal
      v-model="showChangeEmailModal"
      :title="$t('CHANGE_EMAIL')"
      :width="440"
      :loading="changingEmail"
      @close="showChangeEmailModal = false"
    >
      <form @submit.prevent="onChangeEmail()">
        <AppInput
          v-model="emailForm.email"
          type="email"
          :label="$t('EMAIL')"
          :placeholder="$t('EMAIL')"
          dense
          class="mb-4"
        />
        <AppInput
          v-if="emailVerificationId"
          v-model="emailForm.code"
          :label="$t('VERIFICATION_CODE')"
          :placeholder="$t('VERIFICATION_CODE')"
          dense
        />
      </form>

      <template #footer>
        <v-btn variant="text" @click="showChangeEmailModal = false">
          {{ $t('CANCEL') }}
        </v-btn>
        <v-btn
          color="primary"
          elevation="2"
          :loading="changingEmail"
          @click="onChangeEmail()"
        >
          {{ emailVerificationId ? $t('CONFIRM') : $t('SEND_CODE') }}
        </v-btn>
      </template>
    </AppModal>

    <AppModal
      v-model="showRenameDeviceModal"
      :title="$t('EDIT_DEVICE')"
      :width="440"
      :loading="renamingDevice"
      @close="showRenameDeviceModal = false"
    >
      <form @submit.prevent="onRenameDevice()">
        <AppInput
          v-model="renameDeviceTitle"
          :label="$t('TITLE')"
          :placeholder="$t('TITLE')"
          dense
          autofocus
        />
      </form>

      <template #footer>
        <v-btn variant="text" @click="showRenameDeviceModal = false">
          {{ $t('CANCEL') }}
        </v-btn>
        <v-btn
          color="primary"
          elevation="2"
          :loading="renamingDevice"
          @click="onRenameDevice()"
        >
          {{ $t('SAVE_CHANGES') }}
        </v-btn>
      </template>
    </AppModal>

    <AppConfirm
      v-model="showDeleteDeviceModal"
      :title="$t('REMOVE_DEVICE')"
      :message="$t('REMOVE_DEVICE_CONFIRM')"
      :confirm-text="$t('REMOVE_DEVICE')"
      :loading="deletingDevice"
      tone="danger"
      @confirm="onDeleteDevice()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth.store';
import { useProjectStore } from '@/stores/project.store';
import { useGroupStore } from '@/stores/group.store';
import {
  OperationResultStatus, CalendarType,
  type DeviceViewModel, type UpdateProfileDto,
  type ProjectViewModel, type GroupViewModel,
} from '@asoode/shared';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const projectStore = useProjectStore();
const groupStore = useGroupStore();

// --- State ---
const savingProfile = ref(false);
const savingPrefs = ref(false);
const activeTab = ref('devices');

// Profile form (always visible, not toggle edit mode)
const formData = reactive<UpdateProfileDto & { phone: string; email: string }>({
  firstName: '',
  lastName: '',
  bio: '',
  timeZone: '',
  calendar: CalendarType.Default,
  darkMode: false,
  avatar: undefined,
  phone: '',
  email: '',
});
const errors = reactive<Record<string, string>>({});

// Timezones
const timezones = (Intl as any).supportedValuesOf?.('timeZone') || [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Tehran', 'Asia/Dubai',
  'Asia/Riyadh', 'Asia/Istanbul', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
];

const timezoneItems = computed(() => timezones.map((tz: string) => ({ text: tz, value: tz })));
const calendarItems = computed(() => [
  { text: t('DEFAULT'), value: CalendarType.Default },
  { text: t('PERSIAN'), value: CalendarType.Persian },
  { text: t('GREGORIAN'), value: CalendarType.Gregorian },
  { text: t('HIJRI'), value: CalendarType.Hijri },
]);

// Devices
const devicesLoading = ref(true);
const deviceList = ref<DeviceViewModel[]>([]);

// Archived
const archivedProjectsLoading = ref(true);
const archivedProjects = ref<ProjectViewModel[]>([]);
const archivedGroupsLoading = ref(true);
const archivedGroups = ref<GroupViewModel[]>([]);

// Modals
const showLogoutConfirm = ref(false);
const showChangePasswordModal = ref(false);
const showChangePhoneModal = ref(false);
const showChangeEmailModal = ref(false);
const showRenameDeviceModal = ref(false);
const showDeleteDeviceModal = ref(false);

// Password form
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });
const passwordErrors = reactive<Record<string, string>>({});
const changingPassword = ref(false);

// Phone form
const phoneForm = reactive({ phone: '', code: '' });
const phoneVerificationId = ref('');
const changingPhone = ref(false);

// Email form
const emailForm = reactive({ email: '', code: '' });
const emailVerificationId = ref('');
const changingEmail = ref(false);

// Device rename
const renameDeviceTarget = ref<DeviceViewModel | null>(null);
const renameDeviceTitle = ref('');
const renamingDevice = ref(false);

// Device delete
const deleteDeviceTarget = ref<DeviceViewModel | null>(null);
const deletingDevice = ref(false);

// Avatar input ref
const avatarInput = ref<HTMLInputElement | null>(null);

// --- Tabs ---
const tabs = [
  { value: 'devices', label: 'DEVICES', icon: 'mdi-cellphone-link' },
  { value: 'archived-projects', label: 'ARCHIVED_PROJECTS', icon: 'mdi-archive-outline' },
  { value: 'archived-groups', label: 'ARCHIVED_GROUPS', icon: 'mdi-account-group-outline' },
];

// --- Computed ---
const showEmail = computed(() => {
  const email = authStore.profile?.email;
  return email && email.indexOf('@asoode.user') === -1;
});

// --- Methods ---
function populateForm() {
  const p = authStore.profile;
  if (!p) return;
  formData.firstName = p.firstName || '';
  formData.lastName = p.lastName || '';
  formData.bio = p.bio || '';
  formData.timeZone = p.timeZone || '';
  formData.calendar = p.calendar ?? CalendarType.Default;
  formData.darkMode = p.darkMode || false;
  formData.phone = p.phone || '';
  formData.email = p.email || '';
  formData.avatar = undefined;
}

function triggerAvatarUpload() {
  avatarInput.value?.click();
}

function onAvatarPicked(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    formData.avatar = file;
    saveProfileWithAvatar();
  }
}

function validateProfileForm(): boolean {
  Object.keys(errors).forEach(k => delete errors[k]);
  let valid = true;
  if (!formData.firstName || formData.firstName.length < 2) {
    errors.firstName = !formData.firstName ? 'FIRST_NAME_REQUIRED' : 'FIRST_NAME_MIN_LENGTH';
    valid = false;
  }
  if (!formData.lastName || formData.lastName.length < 2) {
    errors.lastName = !formData.lastName ? 'LAST_NAME_REQUIRED' : 'LAST_NAME_MIN_LENGTH';
    valid = false;
  }
  return valid;
}

async function saveProfile() {
  if (!validateProfileForm()) return;
  savingProfile.value = true;
  const model: UpdateProfileDto = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    bio: formData.bio,
    timeZone: formData.timeZone,
    calendar: formData.calendar,
    darkMode: formData.darkMode,
  };
  const op = await authStore.updateProfile(model);
  savingProfile.value = false;
  if (op.status === OperationResultStatus.Success) {
    await authStore.loadProfile();
    populateForm();
  }
}

async function savePreferences() {
  savingPrefs.value = true;
  const model: UpdateProfileDto = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    bio: formData.bio,
    timeZone: formData.timeZone,
    calendar: formData.calendar,
    darkMode: formData.darkMode,
  };
  const op = await authStore.updateProfile(model);
  savingPrefs.value = false;
  if (op.status === OperationResultStatus.Success) {
    document.body.classList.toggle('dark-mode', formData.darkMode);
    await authStore.loadProfile();
    populateForm();
  }
}

async function saveProfileWithAvatar() {
  const model: UpdateProfileDto = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    bio: formData.bio,
    timeZone: formData.timeZone,
    calendar: formData.calendar,
    darkMode: formData.darkMode,
    avatar: formData.avatar,
  };
  await authStore.updateProfile(model);
  await authStore.loadProfile();
  populateForm();
}

function logout() {
  showLogoutConfirm.value = false;
  authStore.logout();
}

// --- Change Password ---
function validatePasswordForm(): boolean {
  Object.keys(passwordErrors).forEach(k => delete passwordErrors[k]);
  let valid = true;
  if (!passwordForm.oldPassword || passwordForm.oldPassword.length < 6) {
    passwordErrors.oldPassword = !passwordForm.oldPassword ? 'OLD_PASSWORD_REQUIRED' : 'PASSWORD_MIN_LENGTH';
    valid = false;
  }
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
    passwordErrors.newPassword = !passwordForm.newPassword ? 'PASSWORD_REQUIRED' : 'PASSWORD_MIN_LENGTH';
    valid = false;
  }
  if (passwordForm.confirmPassword !== passwordForm.newPassword) {
    passwordErrors.confirmPassword = 'CONFIRM_PASSWORD_MISS_MATCH';
    valid = false;
  }
  return valid;
}

async function onChangePassword() {
  if (!validatePasswordForm()) return;
  changingPassword.value = true;
  const op = await authStore.changePassword({
    oldPassword: passwordForm.oldPassword,
    newPassword: passwordForm.newPassword,
    confirmPassword: passwordForm.confirmPassword,
  });
  changingPassword.value = false;
  if (op.status === OperationResultStatus.Success) {
    showChangePasswordModal.value = false;
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
  } else {
    passwordErrors.oldPassword = 'OLD_PASSWORD_INVALID';
  }
}

// --- Change Phone ---
async function onChangePhone() {
  if (!phoneForm.phone) return;
  changingPhone.value = true;
  if (!phoneVerificationId.value) {
    const op = await authStore.changePhone({ phone: phoneForm.phone });
    changingPhone.value = false;
    if (op.status === OperationResultStatus.Success && op.data) {
      phoneVerificationId.value = op.data;
    }
  } else {
    const op = await authStore.confirmPhone({ id: phoneVerificationId.value, code: phoneForm.code });
    changingPhone.value = false;
    if (op.status === OperationResultStatus.Success) {
      formData.phone = phoneForm.phone;
      showChangePhoneModal.value = false;
      phoneVerificationId.value = '';
      phoneForm.phone = '';
      phoneForm.code = '';
      await authStore.loadProfile();
    }
  }
}

// --- Change Email ---
async function onChangeEmail() {
  if (!emailForm.email) return;
  changingEmail.value = true;
  if (!emailVerificationId.value) {
    const op = await authStore.changeEmail({ email: emailForm.email });
    changingEmail.value = false;
    if (op.status === OperationResultStatus.Success && op.data) {
      emailVerificationId.value = op.data;
    }
  } else {
    const op = await authStore.confirmEmail({ id: emailVerificationId.value, code: emailForm.code });
    changingEmail.value = false;
    if (op.status === OperationResultStatus.Success) {
      formData.email = emailForm.email;
      showChangeEmailModal.value = false;
      emailVerificationId.value = '';
      emailForm.email = '';
      emailForm.code = '';
      await authStore.loadProfile();
    }
  }
}

// --- Devices ---
function getDeviceIcon(device: DeviceViewModel): string {
  const os = (device.os || '').toLowerCase();
  if (os.includes('android')) return 'mdi mdi-android';
  if (os.includes('ios')) return 'mdi mdi-apple';
  return 'mdi mdi-monitor';
}

async function toggleDevice(device: DeviceViewModel) {
  device.toggling = true;
  const op = await authStore.toggleDevice(device.id);
  device.toggling = false;
  if (op.status === OperationResultStatus.Success) {
    device.enabled = !device.enabled;
  }
}

function prepareRenameDevice(device: DeviceViewModel) {
  renameDeviceTarget.value = device;
  renameDeviceTitle.value = device.title || '';
  showRenameDeviceModal.value = true;
}

async function onRenameDevice() {
  if (!renameDeviceTarget.value || !renameDeviceTitle.value) return;
  renamingDevice.value = true;
  const op = await authStore.renameDevice(renameDeviceTarget.value.id, { title: renameDeviceTitle.value });
  renamingDevice.value = false;
  if (op.status === OperationResultStatus.Success) {
    renameDeviceTarget.value.title = renameDeviceTitle.value;
    showRenameDeviceModal.value = false;
  }
}

function prepareDeleteDevice(device: DeviceViewModel) {
  deleteDeviceTarget.value = device;
  showDeleteDeviceModal.value = true;
}

async function onDeleteDevice() {
  if (!deleteDeviceTarget.value) return;
  const device = deleteDeviceTarget.value;
  deletingDevice.value = true;
  device.deleting = true;
  const op = await authStore.removeDevice(device.id);
  deletingDevice.value = false;
  device.deleting = false;
  if (op.status === OperationResultStatus.Success) {
    deviceList.value = deviceList.value.filter(d => d.id !== device.id);
    showDeleteDeviceModal.value = false;
  }
}

// --- Archived ---
function openGroup(group: GroupViewModel) {
  router.push(`/group/${group.id}/archived`);
}

// --- Lifecycle ---
onMounted(async () => {
  populateForm();

  // Load devices
  const devResult = await authStore.devices();
  if (devResult.status === OperationResultStatus.Success) {
    deviceList.value = devResult.data || [];
  }
  devicesLoading.value = false;

  // Load archived projects
  const projResult = await projectStore.archived();
  if (projResult.status === OperationResultStatus.Success && projResult.data) {
    archivedProjects.value = projResult.data;
  }
  archivedProjectsLoading.value = false;

  // Load archived groups
  const groupResult = await groupStore.archived();
  if (groupResult.status === OperationResultStatus.Success && groupResult.data) {
    archivedGroups.value = groupResult.data;
  }
  archivedGroupsLoading.value = false;
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.profile-page {
  min-height: calc(100vh - 48px);
  background: $background;
  padding: 32px 16px 64px;
  overflow-y: auto;

  @media (max-width: 600px) {
    padding: 16px 10px 48px;
  }
}

.profile-page__container {
  max-width: 1080px;
  margin: 0 auto;
}

// ── Two Column Grid ──
.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .settings-section {
      margin-bottom: 0;
    }
  }
}

// ── Profile Hero Card ──
.profile-card {
  display: flex;
  align-items: center;
  gap: 24px;
  background: $surface;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    padding: 24px 16px;
  }

  &__avatar {
    position: relative;
    width: 96px;
    height: 96px;
    border-radius: 50%;
    flex-shrink: 0;
    cursor: pointer;
    overflow: hidden;
    background: rgba($primary, 0.08);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__initials {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 700;
    color: $primary;
  }

  &__avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 200ms;
    color: #fff;
    font-size: 24px;
  }

  &__avatar:hover &__avatar-overlay {
    opacity: 1;
  }

  &__avatar-input {
    display: none;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 4px;
    color: $text-primary;
  }

  &__bio {
    font-size: 14px;
    color: $text-secondary;
    margin: 0 0 12px;
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    @media (max-width: 600px) {
      justify-content: center;
    }
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 20px;
    font-weight: 500;

    .mdi { font-size: 14px; }

    &--success {
      background: rgba($success, 0.1);
      color: $success;
    }

    &--warn {
      background: rgba($warn, 0.1);
      color: $warn;
    }
  }
}

// ── Settings Sections ──
.settings-section {
  background: $surface;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;

  &--danger {
    border: 1px solid rgba($warn, 0.2);
  }

  &__header {
    padding: 16px 24px;
    border-bottom: 1px solid $divider;

    h2 {
      font-size: 15px;
      font-weight: 600;
      margin: 0;
      color: $text-primary;
      display: flex;
      align-items: center;
      gap: 8px;

      .mdi { font-size: 18px; color: $text-secondary; }
    }
  }

  &__body {
    padding: 20px 24px;
  }

  &__desc {
    font-size: 13px;
    color: $text-secondary;
    margin: 0 0 16px;
  }

  &__tabs {
    display: flex;
    border-bottom: 1px solid $divider;
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  &__tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 12px 20px;
    font-size: 13px;
    font-weight: 500;
    color: $text-secondary;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    transition: color 200ms, border-color 200ms;
    font-family: inherit;

    .mdi { font-size: 16px; }

    &:hover { color: $primary; }

    &--active {
      color: $primary;
      border-bottom-color: $primary;
      font-weight: 600;
    }
  }
}

// ── Settings Fields ──
.settings-field {
  margin-bottom: 16px;

  > label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: $text-secondary;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  &__input-wrap {
    input, select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid $divider;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      color: $text-primary;
      background: transparent;
      outline: none;
      transition: border-color 200ms;

      &:focus { border-color: $primary; }
    }

    select {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23808080'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 10px 6px;
      padding-right: 32px;
    }
  }

  &__error {
    display: block;
    font-size: 12px;
    color: $warn;
    margin-top: 4px;
  }

  &--row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid rgba($divider, 0.5);

    &:last-of-type { border-bottom: none; }

    > label {
      margin-bottom: 0;
      text-transform: none;
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
      flex-shrink: 0;
    }
  }

  &__value-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__value {
    font-size: 13px;
    color: $text-secondary;
  }

  &--toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;

    > label {
      margin-bottom: 0;
      text-transform: none;
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
    }
  }

  &__actions {
    padding-top: 8px;
  }
}

// ── Toggle Switch ──
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: $divider;
  transition: background 200ms;
  padding: 0;

  &--on {
    background: $primary;
  }

  &__knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    transition: transform 200ms;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  &--on &__knob {
    transform: translateX(20px);
  }
}

// ── Buttons ──
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: background 200ms, opacity 200ms;
  white-space: nowrap;

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--primary {
    background: $primary;
    color: #fff;
    &:hover:not(:disabled) { background: $primary-dark; }
  }

  &--ghost {
    background: transparent;
    color: $text-secondary;
    border: 1px solid $divider;
    &:hover:not(:disabled) { background: rgba(0, 0, 0, 0.04); }
  }

  &--danger {
    background: $warn;
    color: #fff;
    &:hover:not(:disabled) { background: darken($warn, 8%); }
  }

  &--accent {
    color: $primary;
    border-color: rgba($primary, 0.3);
  }

  &--sm {
    padding: 5px 10px;
    font-size: 12px;
  }
}

// ── Device Row ──
.device-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba($divider, 0.5);

  &:last-child { border-bottom: none; }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba($primary, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .mdi { font-size: 20px; color: $primary; }
  }

  &__info { flex: 1; min-width: 0; }

  &__title {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
  }

  &__os {
    font-size: 12px;
    color: $text-secondary;
  }

  &__actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
}

// ── Archive Row ──
.archive-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba($divider, 0.5);

  &:last-child { border-bottom: none; }

  &--clickable { cursor: pointer; }
  &--clickable:hover { background: rgba(0, 0, 0, 0.02); margin: 0 -24px; padding: 10px 24px; }

  &__icon {
    font-size: 20px;
    color: $text-secondary;
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba($primary, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;

    img { width: 100%; height: 100%; object-fit: cover; }
    .mdi { font-size: 18px; color: $primary; }
  }

  &__info { flex: 1; min-width: 0; }

  &__title {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
  }

  &__desc {
    font-size: 12px;
    color: $text-secondary;
    margin-top: 2px;
  }
}

// ── Utilities ──
.settings-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;

  .mdi { font-size: 28px; color: $primary; }
}

.settings-empty {
  text-align: center;
  padding: 24px;
  font-size: 13px;
  color: $text-secondary;
}

// ── Modal ──
.profile-modal {
  background: $surface;
  border-radius: 16px;
  width: 440px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  animation: profile-modal-in 200ms ease-out;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid $divider;

    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }

    button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 20px;
      color: $text-secondary;
      padding: 4px;
      border-radius: 6px;
      transition: background 200ms;

      &:hover { background: rgba(0, 0, 0, 0.06); }
    }
  }

  &__body {
    padding: 20px 24px;

    p {
      font-size: 14px;
      color: $text-secondary;
      margin: 0;
    }

    .settings-field { margin-bottom: 16px; }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 24px;
    border-top: 1px solid $divider;
  }
}

@keyframes profile-modal-in {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>

<!-- Dark mode (unscoped) -->
<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .profile-page {
    background: #1e1e1e;
  }

  .profile-card {
    background: $dark-card;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);

    &__name { color: $dark-text-light; }
    &__bio { color: $dark-text-muted; }
    &__initials { color: $primary-light; }
    &__avatar { background: rgba($primary-light, 0.1); }
  }

  .settings-section {
    background: $dark-card;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);

    &--danger { border-color: rgba($warn, 0.3); }

    &__header {
      border-color: $dark-border;
      h2 { color: $dark-text-light; .mdi { color: $dark-text-muted; } }
    }

    &__desc { color: $dark-text-muted; }

    &__tabs { border-color: $dark-border; }

    &__tab {
      color: $dark-text-muted;
      &:hover { color: $primary-light; }
      &--active { color: $primary-light; border-bottom-color: $primary-light; }
    }
  }

  .settings-field {
    > label { color: $dark-text-muted; }

    &__input-wrap {
      input, select {
        border-color: $dark-border;
        color: $dark-text-light;
        background: transparent;

        &:focus { border-color: $primary-light; }
      }

      select {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E");
      }
    }

    &--row {
      border-color: $dark-border;
      > label { color: $dark-text-light; }
    }

    &--toggle > label { color: $dark-text-light; }

    &__value { color: $dark-text-muted; }
  }

  .toggle-switch {
    background: $dark-border;
    &--on { background: $primary-light; }
  }

  .btn {
    &--primary { background: $primary-light; &:hover:not(:disabled) { background: lighten($primary-light, 5%); } }
    &--ghost {
      color: $dark-text-muted;
      border-color: $dark-border;
      &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.06); }
    }
    &--accent { color: $primary-light; border-color: rgba($primary-light, 0.3); }
  }

  .device-row {
    border-color: $dark-border;
    &__icon { background: rgba($primary-light, 0.1); .mdi { color: $primary-light; } }
    &__title { color: $dark-text-light; }
    &__os { color: $dark-text-muted; }
  }

  .archive-row {
    border-color: $dark-border;
    &--clickable:hover { background: rgba(255, 255, 255, 0.04); }
    &__icon { color: $dark-text-muted; }
    &__avatar { background: rgba($primary-light, 0.1); .mdi { color: $primary-light; } }
    &__title { color: $dark-text-light; }
    &__desc { color: $dark-text-muted; }
  }

  .settings-loader .mdi { color: $primary-light; }
  .settings-empty { color: $dark-text-muted; }

  .profile-modal {
    background: $dark-card;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);

    &__header {
      border-color: $dark-border;
      h3 { color: $dark-text-light; }
      button { color: $dark-text-muted; &:hover { background: rgba(255, 255, 255, 0.08); } }
    }

    &__body p { color: $dark-text-muted; }
    &__footer { border-color: $dark-border; }
  }
}
</style>
