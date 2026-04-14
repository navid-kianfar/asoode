<template>
  <nav class="app-header" v-if="authStore.isAuthenticated">
    <h1>
      <a @click.prevent="$router.push('/dashboard')" href="/dashboard">
        <img
          class="logo"
          :src="`/assets/images/asoode-logo${authStore.profile?.darkMode ? '-dark' : ''}.svg`"
          alt=""
        />
        <img
          class="logo-alt"
          :src="`/assets/images/logo-${authStore.profile?.darkMode ? 'dark' : 'colored'}.svg`"
          alt=""
        />
      </a>
    </h1>

    <button class="create-button" @click="prepareCreate">
      <i class="mdi mdi-plus"></i>
      <span>{{ $t('CREATE') }}</span>
    </button>

    <div class="flex-spacer"></div>

    <!-- Search trigger (centered) -->
    <button class="search-trigger" @click="showCommandPalette = true" :title="$t('SEARCH_ANYWHERE')">
      <i class="mdi mdi-magnify"></i>
      <span class="search-trigger__label">{{ $t('SEARCH_ANYWHERE') }}</span>
      <kbd class="search-trigger__kbd">{{ isMac ? '⌘' : 'Ctrl' }}+K</kbd>
    </button>

    <div class="flex-spacer"></div>

    <div class="action-container">
      <a class="nav-link" @click.prevent="$router.push('/tasks')" href="/tasks" :title="$t('INBOX')">
        <i class="mdi mdi-inbox-outline"></i>
        <span class="nav-link__label">{{ $t('INBOX') }}</span>
      </a>
      <a class="nav-link" @click.prevent="$router.push('/files')" href="/files" :title="$t('FILES')">
        <i class="mdi mdi-folder-outline"></i>
        <span class="nav-link__label">{{ $t('FILES') }}</span>
      </a>
      <a class="nav-link" @click.prevent="$router.push('/messenger')" href="/messenger" :title="$t('MESSENGER')">
        <i class="mdi mdi-chat-outline"></i>
        <span class="nav-link__label">{{ $t('MESSENGER') }}</span>
      </a>
      <a class="nav-link" @click.prevent="$router.push('/workflows')" href="/workflows" :title="$t('WORKFLOWS')">
        <i class="mdi mdi-sitemap-outline"></i>
        <span class="nav-link__label">{{ $t('WORKFLOWS') }}</span>
      </a>

      <NotificationCenter />

      <a class="account-info" @click.prevent="$router.push('/account')" href="/account" :title="$t('ACCOUNT')">
        <img
          v-if="authStore.profile?.avatar"
          :src="authStore.profile.avatar"
          alt=""
        />
        <template v-else>{{ profileInitials }}</template>
      </a>
    </div>

  </nav>

  <!-- Create Wizard Modal -->
  <CreateWizardModal v-if="showCreateWizard" @close="showCreateWizard = false" />

  <!-- Command Palette -->
  <CommandPalette
    v-model:visible="showCommandPalette"
    @open-task="openedTaskId = $event"
  />

  <!-- Task Modal (opened from search) -->
  <TaskModal
    v-if="openedTaskId"
    :taskId="openedTaskId"
    @close="openedTaskId = ''"
    @open-task="openedTaskId = $event"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import CreateWizardModal from '@/components/modals/CreateWizardModal.vue';
import TaskModal from '@/components/modals/TaskModal.vue';
import CommandPalette from '@/components/core/CommandPalette.vue';
import NotificationCenter from '@/components/core/NotificationCenter.vue';

const authStore = useAuthStore();

const showCreateWizard = ref(false);
const showCommandPalette = ref(false);
const openedTaskId = ref('');

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const profileInitials = computed(() => {
  const p = authStore.profile;
  if (!p) return '?';
  return ((p.firstName?.charAt(0) || '') + (p.lastName?.charAt(0) || '')).toUpperCase() || '?';
});

function prepareCreate() {
  showCreateWizard.value = true;
}
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

nav.app-header {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 48px;
  border-bottom: 1px solid $divider;
  background-color: $surface;
  color: $text-primary;
  position: relative;
  gap: 8px;
}

h1 {
  margin: 0;
  line-height: 0;
  flex-shrink: 0;

  a {
    text-decoration: none !important;
    display: block;
    line-height: 0;

    img {
      width: 90px;
      display: block;
    }
  }
}

.logo-alt {
  display: none;
}

.create-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-inline-start: 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 6px 12px;
  background-color: $primary;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: background-color $transition-fast;

  .mdi {
    font-size: 16px;
  }

  &:hover {
    background-color: $primary-dark;
  }
}

.flex-spacer {
  flex-grow: 1;
}

.action-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: $border-radius-sm;
  color: $text-secondary;
  text-decoration: none !important;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color $transition-fast, background-color $transition-fast;
  white-space: nowrap;

  .mdi {
    font-size: 18px;
  }

  &:hover {
    color: $primary;
    background-color: rgba($primary, 0.06);
  }
}

.nav-link__label {
  @media (max-width: 900px) {
    display: none;
  }
}

.search-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border: 1px solid $divider;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.02);
  color: $text-secondary;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all $transition-fast;
  white-space: nowrap;
  width: 100%;
  max-width: 480px;

  .mdi {
    font-size: 16px;
    color: $text-disabled;
  }

  &__label {
    flex: 1;
    text-align: start;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__kbd {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 5px;
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.06);
    color: $text-disabled;
    font-family: inherit;
    border: none;
    line-height: 1;
    flex-shrink: 0;

    @media (max-width: 500px) {
      display: none;
    }
  }

  &:hover {
    border-color: $primary-light;
    background: rgba($primary, 0.04);
    color: $text-primary;
  }
}

.account-info {
  color: $primary;
  border: 2px solid rgba($primary, 0.2);
  background: rgba($primary, 0.08);
  display: flex;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  text-decoration: none !important;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  margin-left: 4px;
  cursor: pointer;
  transition: all $transition-fast;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  &:hover {
    border-color: $primary;
    background: rgba($primary, 0.15);
  }
}

// Responsive
@media (max-width: 800px) {
  .logo {
    display: none;
  }
  .logo-alt {
    display: block;
    width: 28px !important;
    height: 36px;
  }
}

@media (max-width: 600px) {
  nav.app-header {
    padding: 0 10px;
    gap: 4px;
  }

  .create-button span {
    display: none;
  }
  .create-button {
    padding: 6px 8px;
    margin-inline-start: 4px;
  }

  .flex-spacer {
    display: none;
  }

  .search-trigger {
    flex: 1;
    min-width: 0;
  }

  .action-container {
    flex-shrink: 0;
  }

  .nav-link {
    padding: 8px 10px;
    min-height: 44px;
    min-width: 44px;
    justify-content: center;
  }

  .account-info {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 400px) {
  nav.app-header {
    padding: 0 8px;
    gap: 2px;
  }

  .nav-link {
    padding: 8px 8px;
  }
}
</style>

<!-- Non-scoped dark mode (header) -->
<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .app-header {
    background-color: $dark-card;
    border-color: $dark-border;
    color: $dark-text-light;

    .nav-link {
      color: $dark-text-muted;

      &:hover {
        color: $primary-light;
        background-color: rgba($primary-light, 0.1);
      }
    }

    .create-button {
      background-color: $primary-light;

      &:hover {
        background-color: lighten($primary-light, 5%);
      }
    }

    .search-trigger {
      border-color: $dark-border;
      background: rgba(255, 255, 255, 0.04);
      color: $dark-text-muted;

      .mdi {
        color: $dark-text-muted;
      }

      &__kbd {
        background: rgba(255, 255, 255, 0.08);
        color: $dark-text-muted;
      }

      &:hover {
        border-color: $primary-light;
        background: rgba($primary-light, 0.08);
        color: $dark-text-light;
      }
    }

    .account-info {
      color: $primary-light;
      border-color: rgba($primary-light, 0.3);
      background: rgba($primary-light, 0.1);

      &:hover {
        border-color: $primary-light;
        background: rgba($primary-light, 0.2);
      }
    }
  }

}
</style>
