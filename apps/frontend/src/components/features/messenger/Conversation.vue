<template>
  <div class="msg-conv">
    <!-- Header -->
    <header class="msg-conv__header">
      <div class="msg-conv__header-info">
        <div class="msg-conv__header-avatar">
          {{ channel.title?.charAt(0)?.toUpperCase() || '?' }}
        </div>
        <div>
          <h3 class="msg-conv__header-title">{{ channel.title }}</h3>
          <span v-if="channel.members?.length" class="msg-conv__header-meta">
            {{ channel.members.length }} {{ $t('MEMBERS') }}
          </span>
        </div>
      </div>
      <div class="msg-conv__header-actions">
        <button
          class="msg-conv__icon-btn"
          :title="$t('SHARED_FILES')"
          @click="$emit('toggle-files')"
        >
          <i class="mdi mdi-folder-outline"></i>
        </button>
      </div>
    </header>

    <!-- Messages area -->
    <div ref="messagesContainer" class="msg-conv__messages">
      <template v-if="channel.messages?.length">
        <template v-for="(group, gi) in groupedMessages" :key="gi">
          <!-- Date separator -->
          <div class="msg-conv__date-sep">
            <span class="msg-conv__date-sep-label">{{ group.date }}</span>
          </div>

          <!-- Messages -->
          <div
            v-for="msg in group.messages"
            :key="msg.id"
            class="msg-conv__row"
            :class="{
              'msg-conv__row--own': isOwnMessage(msg),
              'msg-conv__row--other': !isOwnMessage(msg),
            }"
          >
            <!-- Avatar for other users -->
            <div v-if="!isOwnMessage(msg)" class="msg-conv__avatar">
              {{ msg.member?.initials || '?' }}
            </div>

            <div
              class="msg-conv__bubble"
              :class="{
                'msg-conv__bubble--own': isOwnMessage(msg),
                'msg-conv__bubble--other': !isOwnMessage(msg),
              }"
            >
              <!-- Sender name -->
              <div v-if="!isOwnMessage(msg) && msg.member" class="msg-conv__sender">
                {{ msg.member.fullName }}
              </div>

              <!-- Reply indicator -->
              <div v-if="msg.replyId" class="msg-conv__reply">
                <div class="msg-conv__reply-text">{{ getReplyPreview(msg.replyId) }}</div>
              </div>

              <!-- Attachment chip -->
              <div v-if="msg.path" class="msg-conv__attachment">
                <i class="mdi mdi-paperclip msg-conv__attachment-icon"></i>
                <span class="msg-conv__attachment-name">{{ getFileName(msg.path) }}</span>
              </div>

              <!-- Message text -->
              <p v-if="msg.message" class="msg-conv__text">{{ msg.message }}</p>

              <!-- Timestamp -->
              <span class="msg-conv__time">{{ formatTime(msg.createdAt) }}</span>
            </div>
          </div>
        </template>
      </template>

      <div v-else class="msg-conv__empty">
        <i class="mdi mdi-message-text-outline msg-conv__empty-icon"></i>
        <p class="msg-conv__empty-text">{{ $t('NO_MESSAGES') }}</p>
      </div>
    </div>

    <!-- Input area -->
    <div class="msg-conv__input-area">
      <button class="msg-conv__icon-btn" :title="$t('ATTACH_FILE')" @click="showFilePicker = true">
        <i class="mdi mdi-paperclip"></i>
      </button>
      <input
        v-model="newMessage"
        type="text"
        class="msg-conv__text-input"
        :placeholder="$t('TYPE_MESSAGE')"
        @keydown.enter.exact="sendMessage"
      />
      <button
        class="msg-conv__send-btn"
        :class="{ 'msg-conv__send-btn--disabled': !newMessage.trim() || sending }"
        :disabled="!newMessage.trim() || sending"
        :title="$t('SEND')"
        @click="sendMessage"
      >
        <i v-if="!sending" class="mdi mdi-send"></i>
        <span v-else class="msg-conv__send-spinner"></span>
      </button>
      <input
        ref="fileInput"
        type="file"
        multiple
        class="msg-conv__file-input"
        @change="onFilesSelected"
      />
    </div>

    <ChatAttachmentPicker
      :visible="showFilePicker"
      :channel-id="channel.id"
      @close="showFilePicker = false"
      @attached="onAttached"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useMessengerStore } from '@/stores/messenger.store';
import { useAuthStore } from '@/stores/auth.store';
import { OperationResultStatus, type ChannelViewModel, type ConversationViewModel } from '@asoode/shared';
import { useCulturedDate } from '@/composables/useCulturedDate';
import ChatAttachmentPicker from '@/components/modals/ChatAttachmentPicker.vue';

interface MessageGroup {
  date: string;
  messages: ConversationViewModel[];
}

const props = defineProps<{ channel: ChannelViewModel }>();

defineEmits<{
  'toggle-files': [];
}>();

const messengerStore = useMessengerStore();
const authStore = useAuthStore();
const { formatDate } = useCulturedDate();

const messagesContainer = ref<HTMLElement>();
const fileInput = ref<HTMLInputElement>();
const newMessage = ref('');
const sending = ref(false);
const showFilePicker = ref(false);

function onAttached() {
  // Refresh the conversation after files are attached
  messengerStore.fetchChannel(props.channel.id);
}

const groupedMessages = computed<MessageGroup[]>(() => {
  const messages = props.channel.messages || [];
  const dateMap = new Map<string, ConversationViewModel[]>();

  for (const msg of messages) {
    const d = new Date(msg.createdAt);
    const key = d.toDateString();
    if (!dateMap.has(key)) dateMap.set(key, []);
    dateMap.get(key)!.push(msg);
  }

  const result: MessageGroup[] = [];
  for (const [key, msgs] of dateMap) {
    result.push({
      date: formatDate(key) || key,
      messages: msgs,
    });
  }
  return result;
});

function isOwnMessage(msg: ConversationViewModel): boolean {
  return msg.userId === authStore.userId;
}

function getReplyPreview(replyId: string): string {
  const messages = props.channel.messages || [];
  const original = messages.find((m) => m.id === replyId);
  if (!original) return '...';
  const text = original.message || '';
  return text.length > 80 ? text.substring(0, 80) + '...' : text;
}

function getFileName(path: string): string {
  if (!path) return '';
  return path.split('/').pop() || path;
}

function formatTime(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

async function sendMessage() {
  const text = newMessage.value.trim();
  if (!text || sending.value) return;

  sending.value = true;
  const result = await messengerStore.send(props.channel.id, { message: text });
  if (result.status === OperationResultStatus.Success && result.data) {
    props.channel.messages.push(result.data);
    newMessage.value = '';
    scrollToBottom();
  }
  sending.value = false;
}

function triggerFileUpload() {
  fileInput.value?.click();
}

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  if (!files.length) return;

  sending.value = true;
  await messengerStore.attach(props.channel.id, files, () => {});
  sending.value = false;
  input.value = '';
}

watch(() => props.channel.messages?.length, () => {
  scrollToBottom();
});

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.msg-conv {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  // ─── Header ──────────────────────────────────────
  &__header {
    height: 48px;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 $spacing-md;
    border-bottom: 1px solid $divider;
    background: $surface;
  }

  &__header-info {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__header-avatar {
    width: 32px;
    height: 32px;
    min-width: 32px;
    border-radius: 50%;
    background: $primary;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
  }

  &__header-title {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
    line-height: 1.3;
  }

  &__header-meta {
    font-size: 11px;
    color: $text-secondary;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  // ─── Icon Button (shared) ────────────────────────
  &__icon-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: $border-radius-sm;
    background: transparent;
    color: $text-secondary;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    transition: background $transition-fast, color $transition-fast;

    &:hover {
      background: rgba($primary, 0.08);
      color: $primary;
    }
  }

  // ─── Messages ────────────────────────────────────
  &__messages {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-md $spacing-lg;
    display: flex;
    flex-direction: column;
    gap: 4px;

    &::-webkit-scrollbar {
      width: 5px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.12);
      border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.2);
    }
  }

  // ─── Date Separator ──────────────────────────────
  &__date-sep {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: $spacing-md 0;
    position: relative;

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: $divider;
    }
  }

  &__date-sep-label {
    font-size: 11px;
    font-weight: 500;
    color: $text-secondary;
    padding: 2px 12px;
    background: $background;
    border-radius: 10px;
    white-space: nowrap;
    letter-spacing: 0.3px;
    user-select: none;
  }

  // ─── Message Row ─────────────────────────────────
  &__row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 4px;

    &--own {
      justify-content: flex-end;
    }

    &--other {
      justify-content: flex-start;
    }
  }

  // ─── Avatar ──────────────────────────────────────
  &__avatar {
    width: 28px;
    height: 28px;
    min-width: 28px;
    border-radius: 50%;
    background: $primary-light;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  // ─── Bubble ──────────────────────────────────────
  &__bubble {
    max-width: 65%;
    min-width: 80px;
    padding: 8px 12px;
    position: relative;
    word-break: break-word;

    &--own {
      background: $primary;
      color: #fff;
      border-radius: 12px 12px 4px 12px;
    }

    &--other {
      background: #f0f0f0;
      color: $text-primary;
      border-radius: 12px 12px 12px 4px;
    }
  }

  // ─── Sender Name ─────────────────────────────────
  &__sender {
    font-size: 11px;
    font-weight: 600;
    color: $primary;
    margin-bottom: 2px;
  }

  // ─── Reply ───────────────────────────────────────
  &__reply {
    padding: 6px 8px;
    margin-bottom: 6px;
    border-left: 3px solid currentColor;
    border-radius: $border-radius-sm;
    opacity: 0.75;
  }

  &__bubble--own &__reply {
    background: rgba(255, 255, 255, 0.12);
    border-left-color: rgba(255, 255, 255, 0.5);
  }

  &__bubble--other &__reply {
    background: rgba(0, 0, 0, 0.04);
    border-left-color: $primary-light;
  }

  &__reply-text {
    font-size: 12px;
    line-height: 1.4;
  }

  // ─── Attachment ──────────────────────────────────
  &__attachment {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: $border-radius-sm;
    margin-bottom: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: background $transition-fast;
  }

  &__bubble--own &__attachment {
    background: rgba(255, 255, 255, 0.15);

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }

  &__bubble--other &__attachment {
    background: rgba(0, 0, 0, 0.06);

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  }

  &__attachment-icon {
    font-size: 14px;
  }

  &__attachment-name {
    max-width: 160px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // ─── Message Text ────────────────────────────────
  &__text {
    margin: 0;
    font-size: 13.5px;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  // ─── Timestamp ───────────────────────────────────
  &__time {
    display: block;
    font-size: 10px;
    text-align: right;
    margin-top: 4px;
    opacity: 0.6;
    line-height: 1;
  }

  // ─── Empty state ─────────────────────────────────
  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    padding: $spacing-xl;
  }

  &__empty-icon {
    font-size: 48px;
    color: $divider;
  }

  &__empty-text {
    font-size: 13px;
    color: $text-secondary;
    margin: 0;
  }

  // ─── Input Area ──────────────────────────────────
  &__input-area {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: 10px $spacing-md;
    border-top: 1px solid $divider;
    background: $surface;
  }

  &__text-input {
    flex: 1;
    height: 38px;
    padding: 0 14px;
    border: 1px solid $divider;
    border-radius: 20px;
    font-size: 13px;
    color: $text-primary;
    background: $background;
    outline: none;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &::placeholder {
      color: $text-disabled;
    }

    &:focus {
      border-color: $primary-light;
      box-shadow: 0 0 0 3px rgba($primary, 0.08);
    }
  }

  &__send-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: $primary;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: background $transition-fast, transform $transition-fast;

    &:hover:not(:disabled) {
      background: $primary-dark;
      transform: scale(1.05);
    }

    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none !important;
    }
  }

  &__send-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: msg-conv-spin 0.6s linear infinite;
  }

  &__file-input {
    display: none;
  }
}

@keyframes msg-conv-spin {
  to {
    transform: rotate(360deg);
  }
}

// ─── Dark Mode ─────────────────────────────────────
body.dark-mode {
  .msg-conv {
    &__header {
      background: $dark-card;
      border-bottom-color: $dark-border;
    }

    &__header-title {
      color: $dark-text-light;
    }

    &__header-meta {
      color: $dark-text-muted;
    }

    &__icon-btn {
      color: $dark-text-muted;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        color: $primary-light;
      }
    }

    &__messages {
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.12);
      }
      &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    &__date-sep {
      &::before,
      &::after {
        background: $dark-border;
      }
    }

    &__date-sep-label {
      background: $dark-background;
      color: $dark-text-muted;
    }

    &__bubble--other {
      background: #444;
      color: $dark-text-light;
    }

    &__sender {
      color: $primary-light;
    }

    &__bubble--other .msg-conv__reply {
      background: rgba(255, 255, 255, 0.06);
      border-left-color: $primary-light;
    }

    &__bubble--other .msg-conv__attachment {
      background: rgba(255, 255, 255, 0.08);

      &:hover {
        background: rgba(255, 255, 255, 0.12);
      }
    }

    &__empty-icon {
      color: $dark-border;
    }

    &__empty-text {
      color: $dark-text-muted;
    }

    &__input-area {
      background: $dark-card;
      border-top-color: $dark-border;
    }

    &__text-input {
      background: $dark-background;
      border-color: $dark-border;
      color: $dark-text-light;

      &::placeholder {
        color: $dark-text-muted;
      }

      &:focus {
        border-color: $primary-light;
        box-shadow: 0 0 0 3px rgba($primary-light, 0.12);
      }
    }
  }
}
</style>
