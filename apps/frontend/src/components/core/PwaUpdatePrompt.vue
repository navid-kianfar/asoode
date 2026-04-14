<template>
  <v-snackbar
    v-model="show"
    :timeout="-1"
    color="primary"
    location="bottom"
    multi-line
  >
    <div class="d-flex align-center">
      <v-icon start>mdi-update</v-icon>
      <span v-if="needRefresh">{{ $t('PWA_UPDATE_AVAILABLE') || 'Updating to new version...' }}</span>
      <span v-else>{{ $t('PWA_OFFLINE_READY') || 'App is ready for offline use.' }}</span>
    </div>
    <template #actions>
      <v-btn v-if="!needRefresh" variant="text" @click="close">
        {{ $t('PWA_DISMISS') || 'Dismiss' }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';

const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      setInterval(() => {
        registration.update();
      }, UPDATE_CHECK_INTERVAL);
    }
  },
});

const show = ref(false);

watch([needRefresh, offlineReady], ([refresh, offline]) => {
  if (refresh) {
    show.value = true;
    // Auto-reload after a brief delay so user sees the notification
    setTimeout(() => {
      updateServiceWorker(true);
    }, 1500);
  } else if (offline) {
    show.value = true;
  }
}, { immediate: true });

function close() {
  show.value = false;
  offlineReady.value = false;
}
</script>
