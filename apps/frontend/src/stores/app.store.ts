import { defineStore } from 'pinia';
import { ref } from 'vue';
import { OperationResultStatus } from '@asoode/shared';
import { loadTranslations } from '@/plugins/i18n';
import { useAuthStore } from './auth.store';
import { useMessengerStore } from './messenger.store';
import { useGroupStore } from './group.store';
import { useProjectStore } from './project.store';

export const useAppStore = defineStore('app', () => {
  const loaded = ref(false);
  const profileLoaded = ref(false);

  async function init(): Promise<void> {
    // 1. Load translations
    await loadTranslations();

    // 2. If authenticated, refresh data
    const authStore = useAuthStore();
    if (authStore.isAuthenticated) {
      await refresh();
    }

    loaded.value = true;
  }

  async function refresh(): Promise<void> {
    const authStore = useAuthStore();
    const messengerStore = useMessengerStore();
    const groupStore = useGroupStore();
    const projectStore = useProjectStore();

    // Load profile
    const profileResult = await authStore.loadProfile();
    if (profileResult.status === OperationResultStatus.NotFound) {
      authStore.logout();
      return;
    }

    // Load data in parallel
    await Promise.all([
      messengerStore.load(),
      groupStore.load(),
      projectStore.load(),
    ]);

    profileLoaded.value = true;
  }

  return { loaded, profileLoaded, init, refresh };
});
