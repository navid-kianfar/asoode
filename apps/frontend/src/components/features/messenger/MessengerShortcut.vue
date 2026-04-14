<template>
  <div class="messenger-shortcut">
    <!-- FAB Button -->
    <button class="messenger-shortcut__fab" @click="togglePanel" :class="{ 'messenger-shortcut__fab--active': open }">
      <i :class="['mdi', open ? 'mdi-close' : 'mdi-chat']"></i>
      <span v-if="unreadCount > 0 && !open" class="messenger-shortcut__badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Chat Panel -->
    <transition name="messenger-shortcut__panel-anim">
      <div v-if="open" class="messenger-shortcut__panel">
        <!-- Panel Header -->
        <div class="messenger-shortcut__panel-header">
          <template v-if="selectedChannel">
            <button class="messenger-shortcut__back-btn" @click="selectedChannel = null">
              <i class="mdi mdi-arrow-left"></i>
            </button>
            <div class="messenger-shortcut__panel-avatar messenger-shortcut__panel-avatar--sm">
              {{ getChannelInitials(selectedChannel) }}
            </div>
            <span class="messenger-shortcut__panel-title">{{ selectedChannel.title }}</span>
          </template>
          <template v-else>
            <i class="mdi mdi-chat messenger-shortcut__panel-icon"></i>
            <span class="messenger-shortcut__panel-title">{{ $t('MESSENGER') }}</span>
          </template>
          <button class="messenger-shortcut__close-btn" @click="open = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <!-- Channel List View -->
        <template v-if="!selectedChannel">
          <!-- Search -->
          <div class="messenger-shortcut__search">
            <i class="mdi mdi-magnify messenger-shortcut__search-icon"></i>
            <input
              v-model="searchQuery"
              type="text"
              class="messenger-shortcut__search-input"
              :placeholder="$t('SEARCH')"
            />
            <button
              v-if="searchQuery"
              class="messenger-shortcut__search-clear"
              @click="searchQuery = ''"
            >
              <i class="mdi mdi-close-circle"></i>
            </button>
          </div>

          <!-- Channel List -->
          <div class="messenger-shortcut__channels">
            <button
              v-for="channel in filteredChannels"
              :key="channel.id"
              class="messenger-shortcut__channel"
              @click="selectChannel(channel)"
            >
              <div class="messenger-shortcut__channel-avatar">
                {{ getChannelInitials(channel) }}
              </div>
              <div class="messenger-shortcut__channel-info">
                <span class="messenger-shortcut__channel-name">{{ channel.title }}</span>
                <span v-if="getLastMessage(channel)" class="messenger-shortcut__channel-preview">
                  {{ getLastMessage(channel) }}
                </span>
              </div>
            </button>

            <!-- Empty channels -->
            <div v-if="!filteredChannels.length" class="messenger-shortcut__empty">
              <i class="mdi mdi-chat-outline"></i>
              <span>{{ $t('NO_CHANNELS') }}</span>
            </div>
          </div>
        </template>

        <!-- Conversation View -->
        <template v-else>
          <!-- Messages -->
          <div ref="messagesRef" class="messenger-shortcut__messages">
            <div
              v-for="msg in recentMessages"
              :key="msg.id"
              class="messenger-shortcut__message"
            >
              <span class="messenger-shortcut__message-author">
                {{ msg.member?.fullName || 'Unknown' }}
              </span>
              <span class="messenger-shortcut__message-text">{{ msg.message }}</span>
            </div>

            <div v-if="!recentMessages.length" class="messenger-shortcut__empty">
              <i class="mdi mdi-chat-outline"></i>
              <span>No messages yet</span>
            </div>
          </div>

          <!-- Quick Input -->
          <div class="messenger-shortcut__input">
            <input
              v-model="quickMessage"
              type="text"
              class="messenger-shortcut__input-field"
              :placeholder="$t('TYPE_MESSAGE')"
              @keydown.enter="sendQuickMessage"
            />
            <button
              class="messenger-shortcut__send-btn"
              :class="{ 'messenger-shortcut__send-btn--active': quickMessage.trim() }"
              :disabled="!quickMessage.trim()"
              @click="sendQuickMessage"
            >
              <i class="mdi mdi-send"></i>
            </button>
          </div>
        </template>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useMessengerStore } from '@/stores/messenger.store';
import { OperationResultStatus, type ChannelViewModel } from '@asoode/shared';

const messengerStore = useMessengerStore();

const open = ref(false);
const searchQuery = ref('');
const selectedChannel = ref<ChannelViewModel | null>(null);
const quickMessage = ref('');
const messagesRef = ref<HTMLElement>();

const unreadCount = ref(0);

const filteredChannels = computed(() => {
  const channels = messengerStore.channels.directs || [];
  if (!searchQuery.value.trim()) return channels;
  const q = searchQuery.value.toLowerCase();
  return channels.filter((c) => c.title?.toLowerCase().includes(q));
});

const recentMessages = computed(() => {
  if (!selectedChannel.value?.messages) return [];
  return selectedChannel.value.messages.slice(-20);
});

function togglePanel() {
  open.value = !open.value;
  if (open.value) {
    selectedChannel.value = null;
    searchQuery.value = '';
  }
}

function getChannelInitials(channel: ChannelViewModel): string {
  if (!channel.title) return '?';
  return channel.title
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function getLastMessage(channel: ChannelViewModel): string {
  const messages = channel.messages;
  if (!messages?.length) return '';
  const last = messages[messages.length - 1];
  return last.message || '';
}

function selectChannel(channel: ChannelViewModel) {
  selectedChannel.value = channel;
  nextTick(() => scrollToBottom());
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
}

async function sendQuickMessage() {
  const text = quickMessage.value.trim();
  if (!text || !selectedChannel.value) return;

  const result = await messengerStore.send(selectedChannel.value.id, { message: text });
  if (result.status === OperationResultStatus.Success && result.data) {
    selectedChannel.value.messages.push(result.data);
    quickMessage.value = '';
    nextTick(() => scrollToBottom());
  }
}

watch(
  () => selectedChannel.value?.messages?.length,
  () => nextTick(() => scrollToBottom())
);
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.messenger-shortcut {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;

  // FAB
  &__fab {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background-color: $primary;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    transition: all $transition-normal;
    position: relative;

    .mdi {
      font-size: 24px;
      transition: transform $transition-fast;
    }

    &:hover {
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.97);
    }

    &--active {
      background-color: $primary-dark;

      .mdi {
        transform: rotate(90deg);
      }
    }
  }

  // Badge
  &__badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background-color: $warn;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    box-shadow: 0 2px 6px rgba($warn, 0.4);
    animation: messenger-shortcut-badge-pulse 2s ease-in-out infinite;
  }

  // Panel
  &__panel {
    position: absolute;
    bottom: 70px;
    right: 0;
    width: 360px;
    max-height: 500px;
    background-color: $surface;
    border-radius: 12px;
    box-shadow: $shadow-4;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  // Panel animation
  &__panel-anim-enter-active,
  &__panel-anim-leave-active {
    transition: all $transition-normal;
  }

  &__panel-anim-enter-from,
  &__panel-anim-leave-to {
    opacity: 0;
    transform: translateY(12px) scale(0.95);
  }

  // Panel Header
  &__panel-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm + 4px $spacing-md;
    background-color: $primary;
    color: #fff;
    min-height: 48px;
  }

  &__panel-icon {
    font-size: 20px;
    opacity: 0.9;
  }

  &__panel-avatar {
    &--sm {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
    }
  }

  &__panel-title {
    font-size: 14px;
    font-weight: 600;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__back-btn {
    width: 28px;
    height: 28px;
    border-radius: $border-radius-sm;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background-color $transition-fast;

    .mdi {
      font-size: 18px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &__close-btn {
    width: 28px;
    height: 28px;
    border-radius: $border-radius-sm;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-left: auto;
    transition: background-color $transition-fast;

    .mdi {
      font-size: 16px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  // Search
  &__search {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm + 4px $spacing-sm + 4px;
    border-bottom: 1px solid $divider;
    position: relative;
  }

  &__search-icon {
    font-size: 18px;
    color: $text-secondary;
    position: absolute;
    left: 20px;
    pointer-events: none;
  }

  &__search-input {
    width: 100%;
    height: 36px;
    padding: 0 32px 0 36px;
    border: 1px solid $divider;
    border-radius: $border-radius-md;
    background-color: rgba(0, 0, 0, 0.03);
    font-size: 13px;
    color: $text-primary;
    outline: none;
    transition: all $transition-fast;

    &::placeholder {
      color: $text-disabled;
    }

    &:focus {
      border-color: $primary-light;
      background-color: $surface;
      box-shadow: 0 0 0 3px rgba($primary, 0.08);
    }
  }

  &__search-clear {
    position: absolute;
    right: 20px;
    width: 20px;
    height: 20px;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-disabled;
    padding: 0;

    .mdi {
      font-size: 16px;
    }

    &:hover {
      color: $text-secondary;
    }
  }

  // Channels
  &__channels {
    flex: 1;
    overflow-y: auto;
    max-height: 380px;
    padding: $spacing-xs;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.12);
      border-radius: 4px;
    }
  }

  &__channel {
    display: flex;
    align-items: center;
    gap: $spacing-sm + 4px;
    width: 100%;
    padding: $spacing-sm + 2px $spacing-sm;
    border-radius: $border-radius-md;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background-color $transition-fast;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    &:active {
      background-color: rgba(0, 0, 0, 0.07);
    }
  }

  &__channel-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: $primary;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__channel-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__channel-name {
    font-size: 13px;
    font-weight: 500;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  &__channel-preview {
    font-size: 12px;
    color: $text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  // Messages
  &__messages {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-sm + 4px;
    max-height: 340px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.12);
      border-radius: 4px;
    }
  }

  &__message {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: $spacing-sm $spacing-sm + 2px;
    border-radius: $border-radius-md;
    transition: background-color $transition-fast;

    &:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }

    & + & {
      margin-top: 2px;
    }
  }

  &__message-author {
    font-size: 12px;
    font-weight: 600;
    color: $primary;
    line-height: 1.3;
  }

  &__message-text {
    font-size: 13px;
    color: $text-primary;
    line-height: 1.45;
    word-break: break-word;
    white-space: pre-wrap;
  }

  // Quick Input
  &__input {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm + 4px;
    border-top: 1px solid $divider;
  }

  &__input-field {
    flex: 1;
    height: 36px;
    padding: 0 $spacing-sm + 4px;
    border: 1px solid $divider;
    border-radius: $border-radius-md;
    background-color: rgba(0, 0, 0, 0.03);
    font-size: 13px;
    color: $text-primary;
    outline: none;
    transition: all $transition-fast;

    &::placeholder {
      color: $text-disabled;
    }

    &:focus {
      border-color: $primary-light;
      background-color: $surface;
      box-shadow: 0 0 0 3px rgba($primary, 0.08);
    }
  }

  &__send-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background-color: rgba(0, 0, 0, 0.06);
    color: $text-disabled;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all $transition-fast;

    .mdi {
      font-size: 18px;
    }

    &--active {
      background-color: $primary;
      color: #fff;

      &:hover {
        background-color: $primary-dark;
      }
    }

    &:disabled {
      cursor: default;
    }
  }

  // Empty state
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    padding: $spacing-xl $spacing-md;
    color: $text-disabled;

    .mdi {
      font-size: 32px;
    }

    span {
      font-size: 13px;
    }
  }
}

// Badge pulse animation
@keyframes messenger-shortcut-badge-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

// Dark mode
body.dark-mode {
  .messenger-shortcut {
    &__fab {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);

      &:hover {
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
      }
    }

    &__panel {
      background-color: $dark-card;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    &__panel-header {
      background-color: darken($primary, 8%);
    }

    &__search {
      border-bottom-color: $dark-border;
    }

    &__search-icon {
      color: $dark-text-muted;
    }

    &__search-input {
      border-color: $dark-border;
      background-color: $dark-card-inner;
      color: $dark-text-light;

      &::placeholder {
        color: $dark-text-muted;
      }

      &:focus {
        border-color: $primary-light;
        background-color: $dark-card-inner;
        box-shadow: 0 0 0 3px rgba($primary-light, 0.12);
      }
    }

    &__search-clear {
      color: $dark-text-muted;

      &:hover {
        color: $dark-text-light;
      }
    }

    &__channels {
      &::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.12);
      }
    }

    &__channel {
      &:hover {
        background-color: rgba(255, 255, 255, 0.06);
      }

      &:active {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }

    &__channel-avatar {
      background-color: $primary-light;
    }

    &__channel-name {
      color: $dark-text-light;
    }

    &__channel-preview {
      color: $dark-text-muted;
    }

    &__messages {
      &::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.12);
      }
    }

    &__message {
      &:hover {
        background-color: rgba(255, 255, 255, 0.03);
      }
    }

    &__message-author {
      color: $primary-light;
    }

    &__message-text {
      color: $dark-text-light;
    }

    &__input {
      border-top-color: $dark-border;
    }

    &__input-field {
      border-color: $dark-border;
      background-color: $dark-card-inner;
      color: $dark-text-light;

      &::placeholder {
        color: $dark-text-muted;
      }

      &:focus {
        border-color: $primary-light;
        background-color: $dark-card-inner;
        box-shadow: 0 0 0 3px rgba($primary-light, 0.12);
      }
    }

    &__send-btn {
      background-color: rgba(255, 255, 255, 0.08);
      color: $dark-text-muted;

      &--active {
        background-color: $primary-light;
        color: #fff;

        &:hover {
          background-color: lighten($primary-light, 5%);
        }
      }
    }

    &__empty {
      color: $dark-text-muted;
    }
  }
}
</style>
