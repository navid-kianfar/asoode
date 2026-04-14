<template>
  <div class="notif-center" v-click-outside="close">
    <button class="notif-center__bell" @click="toggle" :title="$t('NOTIFICATIONS')">
      <i class="mdi mdi-bell-outline"></i>
      <span v-if="notificationStore.unreadCount" class="notif-center__badge">
        {{ notificationStore.unreadCount > 9 ? '9+' : notificationStore.unreadCount }}
      </span>
    </button>

    <transition name="notif-dropdown">
      <div v-if="open" class="notif-center__dropdown">
        <div class="notif-center__header">
          <span class="notif-center__title">{{ $t('NOTIFICATIONS') }}</span>
          <button
            v-if="notificationStore.unreadCount"
            class="notif-center__mark-all"
            @click="notificationStore.markAllAsRead()"
          >
            {{ $t('MARK_ALL_READ') }}
          </button>
        </div>

        <div class="notif-center__list" v-if="notificationStore.notifications.length">
          <div
            v-for="n in notificationStore.notifications"
            :key="n.id"
            class="notif-center__item"
            :class="{ 'notif-center__item--unread': !n.read }"
            @click="onClickNotification(n)"
          >
            <div class="notif-center__item-avatar">
              <img v-if="n.avatar" :src="n.avatar" alt="" />
              <i v-else class="mdi mdi-bell-outline"></i>
            </div>
            <div class="notif-center__item-content">
              <div class="notif-center__item-title">{{ n.title || n.description }}</div>
              <div v-if="n.title && n.description" class="notif-center__item-desc">{{ n.description }}</div>
              <div class="notif-center__item-time">{{ formatTime(n.createdAt) }}</div>
            </div>
            <div v-if="!n.read" class="notif-center__item-dot"></div>
          </div>
        </div>

        <div v-else class="notif-center__empty">
          <i class="mdi mdi-bell-check-outline"></i>
          <span>{{ $t('NO_NOTIFICATIONS') }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore, type AppNotification } from '@/stores/notification.store';

const notificationStore = useNotificationStore();
const router = useRouter();
const open = ref(false);

function toggle() {
  open.value = !open.value;
}

function close() {
  open.value = false;
}

function onClickNotification(n: AppNotification) {
  notificationStore.markAsRead(n.id);
  if (n.url) {
    router.push(n.url);
    open.value = false;
  }
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.notif-center {
  position: relative;
  display: inline-flex;
}

.notif-center__bell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: $border-radius-sm;
  color: $text-secondary;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  transition: color $transition-fast, background-color $transition-fast;

  &:hover {
    color: $primary;
    background-color: rgba($primary, 0.06);
  }
}

.notif-center__badge {
  position: absolute;
  top: 2px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: $warn;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}

.notif-center__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  max-height: 480px;
  background: $surface;
  border: 1px solid $divider;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notif-center__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid $divider;
}

.notif-center__title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.notif-center__mark-all {
  font-size: 12px;
  color: $primary;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.notif-center__list {
  overflow-y: auto;
  flex: 1;
}

.notif-center__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color $transition-fast;

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }

  &--unread {
    background-color: rgba($primary, 0.04);
  }
}

.notif-center__item-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba($primary, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: $primary;
  font-size: 14px;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
}

.notif-center__item-content {
  flex: 1;
  min-width: 0;
}

.notif-center__item-title {
  font-size: 13px;
  font-weight: 500;
  color: $text-primary;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notif-center__item-desc {
  font-size: 12px;
  color: $text-secondary;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notif-center__item-time {
  font-size: 11px;
  color: $text-disabled;
  margin-top: 3px;
}

.notif-center__item-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $primary;
  margin-top: 6px;
}

.notif-center__empty {
  padding: 48px 16px;
  text-align: center;
  color: $text-disabled;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  .mdi {
    font-size: 32px;
    opacity: 0.5;
  }

  span {
    font-size: 13px;
  }
}

// Transition
.notif-dropdown-enter-active,
.notif-dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.notif-dropdown-enter-from,
.notif-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

<!-- Dark mode overrides -->
<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .notif-center__bell {
    color: $dark-text-muted;

    &:hover {
      color: $primary-light;
      background-color: rgba($primary-light, 0.1);
    }
  }

  .notif-center__dropdown {
    background: $dark-card;
    border-color: $dark-border;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  .notif-center__header {
    border-color: $dark-border;
  }

  .notif-center__title {
    color: $dark-text-light;
  }

  .notif-center__mark-all {
    color: $primary-light;
  }

  .notif-center__item {
    &:hover {
      background-color: rgba(255, 255, 255, 0.04);
    }

    &--unread {
      background-color: rgba($primary-light, 0.06);
    }
  }

  .notif-center__item-avatar {
    background: rgba($primary-light, 0.15);
    color: $primary-light;
  }

  .notif-center__item-title {
    color: $dark-text-light;
  }

  .notif-center__item-desc {
    color: $dark-text-muted;
  }

  .notif-center__item-time {
    color: rgba(255, 255, 255, 0.3);
  }

  .notif-center__item-dot {
    background: $primary-light;
  }

  .notif-center__empty {
    color: $dark-text-muted;
  }
}
</style>
