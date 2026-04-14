<template>
  <div class="group-chart-view">
    <div class="org-chart-tree">
      <!-- Root Node -->
      <div class="chart-node chart-node--root" @click="onNodeClick(group)">
        <div class="node-avatar">
          <img v-if="group.avatar" :src="group.avatar" alt="" />
          <i v-else class="mdi mdi-domain"></i>
        </div>
        <div class="node-info">
          <div class="node-title">{{ group.title }}</div>
          <div class="node-desc">{{ group.description || $t('GROUPS') }}</div>
        </div>
      </div>

      <!-- Connector -->
      <div v-if="childGroups.length" class="connector-vertical"></div>
      <div
        v-if="childGroups.length > 1"
        class="connector-horizontal"
        :style="{ width: `${(childGroups.length - 1) * 220}px` }"
      ></div>

      <!-- Child nodes -->
      <div v-if="childGroups.length" class="children-row">
        <div
          v-for="child in childGroups"
          :key="child.id"
          class="child-node-wrapper"
        >
          <div class="connector-vertical connector-vertical--short"></div>
          <div class="chart-node" @click="onNodeClick(child)">
            <div class="node-avatar node-avatar--small">
              <img v-if="child.avatar" :src="child.avatar" alt="" />
              <i v-else class="mdi mdi-account-group"></i>
            </div>
            <div class="node-info">
              <div class="node-title">{{ child.title }}</div>
              <div class="node-members">
                {{ child.members?.length || 0 }} {{ $t('MEMBERS') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!childGroups.length" class="no-children">
        <i class="mdi mdi-sitemap-outline"></i>
        <span>{{ $t('NO_SUB_GROUPS') }}</span>
      </div>

      <!-- Connect sub-group -->
      <div v-if="canEditGroup" class="connect-action">
        <button class="page-btn page-btn--subtle" @click="showConnectModal = true">
          <i class="mdi mdi-plus-circle-outline"></i>
          {{ $t('CONNECT_SUB_GROUP') }}
        </button>
      </div>
    </div>

    <!-- Connect Modal -->
    <AppModal
      v-model="showConnectModal"
      :title="$t('CONNECT_SUB_GROUP')"
      :width="480"
      @close="showConnectModal = false"
    >
      <div class="connect-modal-body">
        <div v-if="loadingNotAttached" class="loading-state">
          <i class="mdi mdi-loading mdi-spin"></i>
        </div>
        <template v-else-if="notAttachedGroups.length">
          <div class="connect-list">
            <div
              v-for="g in notAttachedGroups"
              :key="g.id"
              class="connect-item"
              @click="onConnect(g)"
            >
              <div class="connect-item-avatar">
                <img v-if="g.avatar" :src="g.avatar" alt="" />
                <i v-else class="mdi mdi-account-group"></i>
              </div>
              <div class="connect-item-info">
                <span class="connect-item-title">{{ g.title }}</span>
                <span class="connect-item-meta">
                  {{ g.members?.length || 0 }} {{ $t('MEMBERS') }}
                </span>
              </div>
              <i class="mdi mdi-plus connect-add-icon"></i>
            </div>
          </div>
        </template>
        <div v-else class="empty-state">
          <i class="mdi mdi-information-outline"></i>
          <span>{{ $t('NO_AVAILABLE_GROUPS') }}</span>
        </div>
      </div>
      <template #footer>
        <v-btn variant="text" @click="showConnectModal = false">
          {{ $t('CLOSE') }}
        </v-btn>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGroupStore } from '@/stores/group.store';
import {
  AccessType,
  OperationResultStatus,
  type GroupViewModel,
} from '@asoode/shared';

const props = defineProps<{
  group: GroupViewModel;
  permission: AccessType;
}>();

const router = useRouter();
const groupStore = useGroupStore();

const showConnectModal = ref(false);
const loadingNotAttached = ref(false);
const notAttachedGroups = ref<GroupViewModel[]>([]);

const canEditGroup = computed(() => {
  return props.permission === AccessType.Owner || props.permission === AccessType.Admin;
});

const childGroups = computed(() => {
  return groupStore.groups.filter((g) => g.parentId === props.group.id);
});

function onNodeClick(g: GroupViewModel) {
  if (g.id !== props.group.id) {
    router.push(`/group/${g.id}`);
  }
}

async function loadNotAttached() {
  loadingNotAttached.value = true;
  const result = await groupStore.notAttached(props.group.id);
  if (result.status === OperationResultStatus.Success) {
    notAttachedGroups.value = result.data || [];
  }
  loadingNotAttached.value = false;
}

async function onConnect(child: GroupViewModel) {
  const result = await groupStore.connect(props.group.id, { id: child.id });
  if (result.status === OperationResultStatus.Success) {
    showConnectModal.value = false;
    await groupStore.load();
  }
}

watch(showConnectModal, (val) => {
  if (val) loadNotAttached();
});

onMounted(async () => {
  await groupStore.load();
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.group-chart-view {
  width: 100%;
  padding: 8px 0;
}

.org-chart-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  overflow-x: auto;
}

.chart-node {
  background: $surface;
  border: 1px solid rgba(226, 232, 240, 0.82);
  border-radius: 16px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  min-width: 220px;
  max-width: 280px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

  &:hover {
    border-color: rgba(99, 102, 241, 0.3);
    background: #fcfdfe;
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
  }

  &--root {
    border: 1px solid rgba(199, 210, 254, 0.8);
    background: #fdfdff;
    padding: 18px 24px;
    
    .node-avatar {
      background: linear-gradient(135deg, #4f46e5, #3b82f6);
      width: 48px;
      height: 48px;
      i { font-size: 24px; color: #fff; }
    }

    .node-title {
      font-size: 1rem;
      font-weight: 700;
      color: #1e1b4b;
    }
  }
}

.node-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.6);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  i {
    color: #4338ca;
    font-size: 20px;
  }

  &--small {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    i { font-size: 18px; }
  }
}

.node-info {
  min-width: 0;
  flex: 1;

  .node-title {
    font-weight: 600;
    font-size: 0.9rem;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .node-desc,
  .node-members {
    font-size: 0.75rem;
    color: $text-secondary;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.connector-vertical {
  width: 1px;
  height: 32px;
  background: #cbd5e1;
  opacity: 0.6;

  &--short {
    height: 20px;
  }
}

.connector-horizontal {
  height: 1px;
  background: #cbd5e1;
  opacity: 0.6;
}

.children-row {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.child-node-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.no-children {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: $text-disabled;
  padding: 32px;
  gap: 8px;

  i { font-size: 32px; opacity: 0.5; }
  span { font-size: 13px; font-weight: 500; }
}

.connect-action {
  margin-top: 32px;
}

/* Connect Modal Styles */
.connect-modal-body {
  padding: 12px 0;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: $text-disabled;
  gap: 12px;
  i { font-size: 24px; }
}

.connect-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.connect-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  transition: all 0.2s ease;

  &:hover {
    background: #eff6ff;
    border-color: #dbeafe;
    transform: translateX(4px);
    
    .connect-add-icon {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  .connect-item-avatar {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    border: 1px solid #e2e8f0;

    img { width: 100%; height: 100%; object-fit: cover; }
    i { color: #6366f1; font-size: 18px; }
  }

  .connect-item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .connect-item-title {
    font-size: 13px;
    font-weight: 600;
    color: $text-primary;
  }

  .connect-item-meta {
    font-size: 11px;
    color: $text-secondary;
  }

  .connect-add-icon {
    font-size: 18px;
    color: #6366f1;
    opacity: 0.3;
    transition: all 0.2s ease;
  }
}
</style>

<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .group-chart-view {
    .chart-node {
      background: rgba(30, 41, 59, 0.5);
      border-color: rgba(71, 85, 105, 0.7);

      &:hover {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(99, 102, 241, 0.5);
      }

      &--root {
        background: rgba(49, 46, 129, 0.15);
        border-color: rgba(129, 140, 248, 0.4);
        
        .node-title { color: #eef2ff; }
      }

      .node-avatar {
        background: #1e293b;
        border-color: rgba(71, 85, 105, 0.5);
        i { color: #818cf8; }
      }

      .node-title { color: $dark-text-light; }
      .node-desc, .node-members { color: $dark-text-muted; }
    }

    .connector-vertical, .connector-horizontal {
      background: #475569;
    }

    .no-children { color: $dark-text-muted; }

    .connect-item {
      background: rgba(30, 41, 59, 0.6);
      border-color: rgba(71, 85, 105, 0.5);

      &:hover {
        background: rgba(30, 41, 59, 0.9);
        border-color: rgba(99, 102, 241, 0.4);
      }

      .connect-item-avatar {
        background: #0f172a;
        border-color: rgba(71, 85, 105, 0.5);
        i { color: #818cf8; }
      }

      .connect-item-title { color: $dark-text-light; }
      .connect-item-meta { color: $dark-text-muted; }
    }
  }
}
</style>
