import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  type IdentityObject, type ProfileViewModel, type LoginResultViewModel,
  type RegisterResultViewModel, type ForgotResultViewModel, type DeviceViewModel,
  type MemberInfoViewModel, type OperationResult,
  OperationResultStatus, API, STORAGE_KEYS,
} from '@asoode/shared';
import type { LoginDto, RegisterDto, ForgotDto, ResetPasswordDto, ChangePasswordDto, UpdateProfileDto, ConfirmDto } from '@asoode/shared';
import { httpService } from '@/services/http.service';
import router from '@/router';

export const useAuthStore = defineStore('auth', () => {
  const identity = ref<IdentityObject | null>(null);
  const profile = ref<ProfileViewModel | null>(null);

  // Initialize from localStorage
  const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
  if (raw) {
    try {
      identity.value = JSON.parse(raw);
    } catch {}
  }

  const isAuthenticated = computed(() => !!identity.value?.token);
  const token = computed(() => identity.value?.token || '');
  const userId = computed(() => identity.value?.userId || '');

  function setIdentity(data: IdentityObject) {
    identity.value = data;
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(data));
  }

  function logout() {
    identity.value = null;
    profile.value = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    router.push('/login');
  }

  async function login(model: LoginDto): Promise<OperationResult<LoginResultViewModel>> {
    const result = await httpService.post<LoginResultViewModel>(API.ACCOUNT_LOGIN, model);
    if (result.status === OperationResultStatus.Success && result.data?.token) {
      setIdentity({
        token: result.data.token,
        userId: result.data.userId,
        username: result.data.username,
      });
    }
    return result;
  }

  async function register(model: RegisterDto): Promise<OperationResult<RegisterResultViewModel>> {
    return httpService.post<RegisterResultViewModel>(API.ACCOUNT_REGISTER, model);
  }

  async function forgot(model: ForgotDto): Promise<OperationResult<ForgotResultViewModel>> {
    return httpService.post<ForgotResultViewModel>(API.ACCOUNT_FORGOT, model);
  }

  async function resetPassword(model: ResetPasswordDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.ACCOUNT_RECOVER, model);
  }

  async function loadProfile(): Promise<OperationResult<ProfileViewModel>> {
    const result = await httpService.post<ProfileViewModel>(API.ACCOUNT_PROFILE);
    if (result.status === OperationResultStatus.Success) {
      profile.value = result.data;
    }
    return result;
  }

  async function updateProfile(model: UpdateProfileDto): Promise<OperationResult<boolean>> {
    return httpService.formUpload<boolean>(API.ACCOUNT_PROFILE_UPDATE, model);
  }

  async function changePassword(model: ChangePasswordDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.ACCOUNT_PASSWORD_CHANGE, model);
  }

  async function changeEmail(model: { email: string }): Promise<OperationResult<string>> {
    return httpService.post<string>(API.ACCOUNT_EMAIL_CHANGE, model);
  }

  async function changePhone(model: { phone: string }): Promise<OperationResult<string>> {
    return httpService.post<string>(API.ACCOUNT_PHONE_CHANGE, model);
  }

  async function confirmPhone(model: ConfirmDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.ACCOUNT_PHONE_CONFIRM, model);
  }

  async function confirmEmail(model: ConfirmDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.ACCOUNT_EMAIL_CONFIRM, model);
  }

  async function verifyAccount(params: ConfirmDto): Promise<OperationResult<LoginResultViewModel>> {
    const result = await httpService.post<LoginResultViewModel>(API.ACCOUNT_CONFIRM, params);
    if (result.status === OperationResultStatus.Success && result.data?.token) {
      setIdentity({
        token: result.data.token,
        userId: result.data.userId,
        username: result.data.username,
      });
    }
    return result;
  }

  async function resendVerification(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.ACCOUNT_RESEND_VERIFICATION(id));
  }

  async function devices(): Promise<OperationResult<DeviceViewModel[]>> {
    return httpService.post<DeviceViewModel[]>(API.ACCOUNT_DEVICES);
  }

  async function addDevice(model: { title: string }): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.ACCOUNT_DEVICES_ADD, model);
  }

  async function removeDevice(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.ACCOUNT_DEVICES_REMOVE(id));
  }

  async function toggleDevice(id: string): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.ACCOUNT_DEVICES_TOGGLE(id));
  }

  async function renameDevice(id: string, model: { title: string }): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.ACCOUNT_DEVICES_RENAME(id), model);
  }

  async function getMemberInfo(memberId: string): Promise<OperationResult<MemberInfoViewModel>> {
    return httpService.post<MemberInfoViewModel>(API.ACCOUNT_MEMBER_PROFILE(memberId));
  }

  return {
    identity, profile, isAuthenticated, token, userId,
    setIdentity, logout, login, register, forgot, resetPassword,
    loadProfile, updateProfile, changePassword, changeEmail, changePhone,
    confirmPhone, confirmEmail, verifyAccount, resendVerification,
    devices, addDevice, removeDevice, toggleDevice, renameDevice, getMemberInfo,
  };
});
