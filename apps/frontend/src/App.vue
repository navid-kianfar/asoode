<template>
  <v-app>
    <template v-if="appStore.loaded">
      <template v-if="authStore.isAuthenticated && appStore.profileLoaded">
        <!-- Authenticated layout: header + content (no sidebar, matching Angular) -->
        <AppHeader />
        <v-main>
          <router-view />
        </v-main>
        <MessengerShortcut v-if="!isMessengerPage" />
      </template>
      <template v-else-if="!authStore.isAuthenticated">
        <!-- Anonymous layout -->
        <v-main>
          <router-view />
        </v-main>
      </template>
      <template v-else>
        <AppLoadingSkeleton />
      </template>
    </template>
    <template v-else>
      <AppLoadingSkeleton />
    </template>

    <!-- Global modals container -->
    <div id="modal-container"></div>
    <ModalRenderer />

    <!-- PWA update prompt -->
    <PwaUpdatePrompt />
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useTheme } from 'vuetify';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';
import { useSocket } from '@/composables/useSocket';
import { useGlobalSocketHandlers } from '@/composables/useGlobalSocketHandlers';
import { useNotificationSocketHandler } from '@/composables/useNotificationSocketHandler';
import AppHeader from '@/components/core/AppHeader.vue';
import AppLoadingSkeleton from '@/components/core/skeletons/AppLoadingSkeleton.vue';
import PwaUpdatePrompt from '@/components/core/PwaUpdatePrompt.vue';
import MessengerShortcut from '@/components/features/messenger/MessengerShortcut.vue';
import ModalRenderer from '@/components/core/ModalRenderer.vue';

const appStore = useAppStore();
const authStore = useAuthStore();
const theme = useTheme();
const route = useRoute();
const router = useRouter();
const { connect, disconnect } = useSocket();

useGlobalSocketHandlers();
useNotificationSocketHandler();

const isMessengerPage = computed(() => route.path.startsWith('/messenger'));

onMounted(async () => {
  await appStore.init();

  // Listen for notification clicks from service worker
  navigator.serviceWorker?.addEventListener('message', handleSwMessage);
});

onUnmounted(() => {
  navigator.serviceWorker?.removeEventListener('message', handleSwMessage);
});

function handleSwMessage(event: MessageEvent) {
  if (event.data?.type === 'NOTIFICATION_CLICK' && event.data.url) {
    router.push(event.data.url);
  }
}

// Connect/disconnect socket based on auth state
watch(
  () => authStore.isAuthenticated,
  (authenticated) => {
    if (authenticated && authStore.userId) {
      connect();
    } else {
      disconnect();
    }
  },
  { immediate: true }
);

// Sync dark mode
watch(
  () => authStore.profile?.darkMode,
  (darkMode) => {
    if (darkMode !== undefined) {
      theme.global.name.value = darkMode ? 'dark' : 'light';
      document.body.classList.toggle('dark-mode', darkMode);
    }
  },
  { immediate: true }
);
</script>

<style lang="scss">
@import '@/styles/main.scss';
</style>
