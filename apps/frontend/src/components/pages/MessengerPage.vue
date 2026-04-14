<template>
  <MessengerSkeleton v-if="loading" />
  <div v-else class="msg-page" :class="{ 'msg-page--mobile-conv': isMobile && mobileView === 'conversation' }">
    <!-- Sidebar -->
    <aside class="msg-page__sidebar" :class="{ 'msg-page__sidebar--hidden': isMobile && mobileView !== 'channels' }">
      <div class="msg-page__search">
        <i class="mdi mdi-magnify msg-page__search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          class="msg-page__search-input"
          :placeholder="$t('SEARCH_CHANNELS')"
        />
      </div>

      <div class="msg-page__channels">
        <div
          v-for="channel in filteredChannels"
          :key="channel.id"
          class="msg-page__channel"
          :class="{ 'msg-page__channel--active': activeChannelId === channel.id }"
          @click="selectChannel(channel)"
        >
          <div class="msg-page__channel-avatar">
            {{ channel.title?.charAt(0)?.toUpperCase() || '?' }}
          </div>
          <div class="msg-page__channel-info">
            <div class="msg-page__channel-header">
              <span class="msg-page__channel-title">{{ channel.title }}</span>
              <span v-if="getLastMessageTime(channel)" class="msg-page__channel-time">
                {{ getLastMessageTime(channel) }}
              </span>
            </div>
            <p class="msg-page__channel-preview">
              {{ channel.messages?.[channel.messages.length - 1]?.message || '' }}
            </p>
          </div>
        </div>

        <div v-if="!filteredChannels.length" class="msg-page__empty-channels">
          {{ $t('NO_CHANNELS') }}
        </div>
      </div>
    </aside>

    <!-- Main conversation area -->
    <main class="msg-page__main" :class="{ 'msg-page__main--hidden': isMobile && mobileView === 'channels' }">
      <!-- Mobile back button -->
      <div v-if="isMobile && activeChannel" class="msg-page__mobile-header">
        <button class="msg-page__back-btn" @click="goBackToChannels">
          <i class="mdi mdi-arrow-left"></i>
        </button>
        <div class="msg-page__mobile-title">{{ activeChannel.title }}</div>
        <button v-if="activeChannel" class="msg-page__files-btn" @click="showFiles = !showFiles">
          <i class="mdi mdi-paperclip"></i>
        </button>
      </div>

      <ConversationSkeleton v-if="channelLoading" />
      <template v-else-if="activeChannel">
        <Conversation
          :channel="activeChannel"
          @toggle-files="showFiles = !showFiles"
        />
      </template>
      <div v-else class="msg-page__placeholder">
        <div class="msg-page__placeholder-content">
          <i class="mdi mdi-forum-outline msg-page__placeholder-icon"></i>
          <h3 class="msg-page__placeholder-title">{{ $t('SELECT_CONVERSATION') }}</h3>
          <p class="msg-page__placeholder-text">{{ $t('CHOOSE_CHANNEL_TO_START') }}</p>
        </div>
      </div>
    </main>

    <!-- Files panel (toggleable) -->
    <aside
      v-if="activeChannel && showFiles"
      class="msg-page__files-panel"
      :class="{ 'msg-page__files-panel--mobile': isMobile }"
    >
      <div v-if="isMobile" class="msg-page__files-panel-header">
        <button class="msg-page__back-btn" @click="showFiles = false">
          <i class="mdi mdi-close"></i>
        </button>
        <span>{{ $t('FILES') }}</span>
      </div>
      <ChannelFiles :channel="activeChannel" />
    </aside>
    <!-- Mobile files overlay backdrop -->
    <div
      v-if="isMobile && showFiles"
      class="msg-page__overlay"
      @click="showFiles = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useMessengerStore } from '@/stores/messenger.store';
import { useViewContext } from '@/composables/useViewContext';
import { useMessengerSocketHandlers } from '@/composables/useMessengerSocketHandlers';
import { OperationResultStatus, type ChannelViewModel } from '@asoode/shared';
import Conversation from '@/components/features/messenger/Conversation.vue';
import ChannelFiles from '@/components/features/messenger/ChannelFiles.vue';
import MessengerSkeleton from '@/components/core/skeletons/MessengerSkeleton.vue';
import ConversationSkeleton from '@/components/core/skeletons/ConversationSkeleton.vue';

const messengerStore = useMessengerStore();
const { updateContext: updateFocusContext } = useViewContext('channel', '');

const searchQuery = ref('');
const activeChannelId = ref('');
const activeChannel = ref<ChannelViewModel | null>(null);
useMessengerSocketHandlers(activeChannel, activeChannelId);
const showFiles = ref(false);
const loading = ref(true);
const channelLoading = ref(false);

// Mobile responsive state
const isMobile = ref(window.innerWidth <= 768);
const mobileView = ref<'channels' | 'conversation'>('channels');

function onResize() {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) {
    mobileView.value = 'channels';
  }
}

onMounted(() => {
  window.addEventListener('resize', onResize);
});
onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});

const filteredChannels = computed(() => {
  const channels = messengerStore.channels?.directs || [];
  if (!searchQuery.value) return channels;
  return channels.filter((c) => c.title?.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

function getLastMessageTime(channel: ChannelViewModel): string {
  const messages = channel.messages;
  if (!messages?.length) return '';
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg.createdAt) return '';
  const d = typeof lastMsg.createdAt === 'string' ? new Date(lastMsg.createdAt) : lastMsg.createdAt;
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const dayMs = 86400000;

  if (diff < dayMs && now.getDate() === d.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < dayMs * 7) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

async function selectChannel(channel: ChannelViewModel) {
  activeChannelId.value = channel.id;
  updateFocusContext(channel.id);
  channelLoading.value = true;
  if (isMobile.value) {
    mobileView.value = 'conversation';
  }
  const result = await messengerStore.fetchChannel(channel.id);
  if (result.status === OperationResultStatus.Success) {
    activeChannel.value = result.data;
  }
  channelLoading.value = false;
}

function goBackToChannels() {
  mobileView.value = 'channels';
  showFiles.value = false;
}

onMounted(async () => {
  await messengerStore.load();
  loading.value = false;
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.msg-page {
  display: flex;
  height: calc(100vh - 64px);
  background: $surface;
  overflow: hidden;
  position: relative;

  // ─── Sidebar ───────────────────────────────────────
  &__sidebar {
    width: 280px;
    min-width: 280px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid $divider;
    background: $surface;

    @media (max-width: 768px) {
      width: 100%;
      min-width: 100%;
      border-right: none;
    }

    &--hidden {
      display: none;
    }
  }

  &__search {
    position: relative;
    padding: $spacing-md;
    border-bottom: 1px solid $divider;
  }

  &__search-icon {
    position: absolute;
    left: 28px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    color: $text-secondary;
    pointer-events: none;
  }

  &__search-input {
    width: 100%;
    height: 40px;
    padding: 0 12px 0 36px;
    border: 1px solid $divider;
    border-radius: $border-radius-md;
    color: $text-primary;
    background: $background;
    outline: none;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &::placeholder {
      color: $text-disabled;
    }

    &:focus {
      border-color: $primary-light;
      box-shadow: 0 0 0 3px rgba($primary, 0.1);
    }
  }

  &__channels {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: $spacing-sm 0;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 4px;
    }
  }

  &__channel {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px $spacing-md;
    min-height: 60px;
    cursor: pointer;
    transition: background $transition-fast;
    user-select: none;

    &:hover {
      background: rgba($primary, 0.04);
    }

    &--active {
      background: rgba($primary-light, 0.12);

      .msg-page__channel-title {
        color: $primary;
        font-weight: 600;
      }

      &:hover {
        background: rgba($primary-light, 0.16);
      }
    }
  }

  &__channel-avatar {
    width: 44px;
    height: 44px;
    min-width: 44px;
    border-radius: 50%;
    background: $primary;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  &__channel-info {
    flex: 1;
    min-width: 0;
  }

  &__channel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 2px;
  }

  &__channel-title {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__channel-time {
    font-size: 11px;
    color: $text-secondary;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__channel-preview {
    font-size: 12px;
    color: $text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
    line-height: 1.4;
  }

  &__empty-channels {
    padding: $spacing-xl $spacing-md;
    text-align: center;
    color: $text-secondary;
    font-size: 13px;
  }

  // ─── Mobile Header ──────────────────────────────────
  &__mobile-header {
    display: none;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid $divider;
    background: $surface;
    flex-shrink: 0;

    @media (max-width: 768px) {
      display: flex;
    }
  }

  &__back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    border-radius: 50%;
    cursor: pointer;
    color: $text-primary;
    font-size: 20px;
    flex-shrink: 0;
    transition: background $transition-fast;

    &:hover {
      background: rgba(0, 0, 0, 0.06);
    }
  }

  &__mobile-title {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__files-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    border-radius: 50%;
    cursor: pointer;
    color: $text-secondary;
    font-size: 20px;
    flex-shrink: 0;
    transition: background $transition-fast;

    &:hover {
      background: rgba(0, 0, 0, 0.06);
    }
  }

  // ─── Main Area ─────────────────────────────────────
  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: $background;

    @media (max-width: 768px) {
      width: 100%;
    }

    &--hidden {
      display: none;
    }
  }

  &__placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__placeholder-content {
    text-align: center;
    padding: $spacing-xl;
  }

  &__placeholder-icon {
    font-size: 56px;
    color: $divider;
    display: block;
    margin-bottom: $spacing-md;

    @media (max-width: 600px) {
      font-size: 40px;
    }
  }

  &__placeholder-title {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 $spacing-sm;

    @media (max-width: 600px) {
      font-size: 16px;
    }
  }

  &__placeholder-text {
    font-size: 13px;
    color: $text-secondary;
    margin: 0;
  }

  // ─── Files Panel ───────────────────────────────────
  &__files-panel {
    width: 280px;
    min-width: 280px;
    border-left: 1px solid $divider;
    background: $surface;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 4px;
    }

    &--mobile {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(320px, 85vw);
      min-width: unset;
      z-index: 200;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
      animation: msg-files-slide-in 200ms ease-out;
    }
  }

  &__files-panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid $divider;
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 199;
  }
}

@keyframes msg-files-slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

// ─── Dark Mode ─────────────────────────────────────
body.dark-mode {
  .msg-page {
    background: $dark-background;

    &__sidebar {
      background: $dark-card;
      border-right-color: $dark-border;
    }

    &__search {
      border-bottom-color: $dark-border;
    }

    &__search-icon {
      color: $dark-text-muted;
    }

    &__search-input {
      background: $dark-background;
      border-color: $dark-border;
      color: $dark-text-light;

      &::placeholder {
        color: $dark-text-muted;
      }

      &:focus {
        border-color: $primary-light;
        box-shadow: 0 0 0 3px rgba($primary-light, 0.15);
      }
    }

    &__channels {
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
      }
    }

    &__channel {
      &:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      &--active {
        background: rgba($primary-light, 0.1);

        &:hover {
          background: rgba($primary-light, 0.14);
        }
      }
    }

    &__channel-avatar {
      background: $primary-light;
    }

    &__channel-title {
      color: $dark-text-light;
    }

    &__channel-time {
      color: $dark-text-muted;
    }

    &__channel-preview {
      color: $dark-text-muted;
    }

    &__empty-channels {
      color: $dark-text-muted;
    }

    &__mobile-header {
      background: $dark-card;
      border-bottom-color: $dark-border;
    }

    &__back-btn {
      color: $dark-text-light;
      &:hover { background: rgba(255, 255, 255, 0.08); }
    }

    &__mobile-title {
      color: $dark-text-light;
    }

    &__files-btn {
      color: $dark-text-muted;
      &:hover { background: rgba(255, 255, 255, 0.08); }
    }

    &__main {
      background: $dark-background;
    }

    &__placeholder-icon {
      color: $dark-border;
    }

    &__placeholder-title {
      color: $dark-text-light;
    }

    &__placeholder-text {
      color: $dark-text-muted;
    }

    &__files-panel {
      background: $dark-card;
      border-left-color: $dark-border;

      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
      }

      &--mobile {
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.4);
      }
    }

    &__files-panel-header {
      color: $dark-text-light;
      border-bottom-color: $dark-border;
    }

    &__overlay {
      background: rgba(0, 0, 0, 0.5);
    }
  }
}
</style>
