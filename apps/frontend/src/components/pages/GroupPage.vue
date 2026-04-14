<template>
  <div class="group-page">
    <GroupSkeleton v-if="waiting" />

    <template v-else-if="group">
      <div class="group-shell">
        <section class="group-overview">
          <div class="group-overview__main">
            <div class="group-overview__identity">
              <div class="group-overview__avatar">
                <img v-if="group.avatar" :src="group.avatar" alt="" />
                <i v-else class="mdi mdi-domain"></i>
              </div>

              <div class="group-overview__copy">
                <div class="group-overview__eyebrow">{{ $t('GROUPS') }}</div>
                <div class="group-overview__title-row">
                  <h1>{{ group.title }}</h1>
                </div>
                <p class="group-overview__desc">
                  {{ group.description || group.subTitle || $t('GROUPS') }}
                </p>
              </div>
            </div>

            <div class="group-overview__side">
              <div class="group-overview__topbar">
                <button class="page-btn page-btn--subtle" @click="openDetail()">
                  <i class="mdi mdi-information-outline"></i>
                  {{ $t('DETAIL') }}
                </button>
                <button
                  v-if="canEditGroup"
                  class="page-btn page-btn--subtle"
                  :disabled="!!group.archivedAt"
                  @click="openDetail(true)"
                >
                  <i class="mdi mdi-pencil-outline"></i>
                  {{ $t('EDIT') }}
                </button>
              </div>

              <div class="group-overview__chips">
                <a
                  v-if="group.website"
                  class="group-overview__chip group-overview__chip--link"
                  :href="normalizedWebsite"
                  target="_blank"
                  rel="noopener"
                >
                  <i class="mdi mdi-web"></i>
                  {{ group.website }}
                </a>
                <span class="group-overview__chip">
                  <i class="mdi mdi-shield-account-outline"></i>
                  {{ accessLabel }}
                </span>
              </div>
            </div>
          </div>

          <div class="group-metrics">
            <div
              v-for="metric in metrics"
              :key="metric.label"
              class="group-metrics__card"
            >
              <div class="group-metrics__meta">
                <span class="group-metrics__label">{{ $t(metric.label) }}</span>
                <i :class="`mdi ${metric.icon}`"></i>
              </div>
              <div class="group-metrics__value">{{ metric.value }}</div>
              <div v-if="metric.helper" class="group-metrics__helper">{{ metric.helper }}</div>
            </div>
          </div>
        </section>
      </div>

      <div class="group-tabs">
        <div class="group-tabs__inner">
          <button
            v-for="tab in visibleTabs"
            :key="tab.value"
            class="group-tabs__tab"
            :class="{ 'group-tabs__tab--active': activeTab === tab.value }"
            @click="activeTab = tab.value"
          >
            <i :class="`mdi ${tab.icon}`"></i>
            <span>{{ $t(tab.label) }}</span>
          </button>
        </div>
      </div>

      <div class="group-content">
        <GroupChart v-if="activeTab === 'chart'" :permission="permission" :group="group" />
        <GroupMembers v-if="activeTab === 'members'" :permission="permission" :group="group" />
        <GroupProjects v-if="activeTab === 'projects'" :permission="permission" :group="group" />
        <HumanResources v-if="activeTab === 'hr'" :permission="permission" :group="group" />
        <GroupTimespent v-if="activeTab === 'timespent'" :permission="permission" :group="group" />
        <GroupReports v-if="activeTab === 'reports'" :permission="permission" :group="group" />
        <GroupSettings v-if="activeTab === 'settings'" :permission="permission" :group="group" />
      </div>
    </template>

    <div v-else class="group-page__empty">
      <i class="mdi mdi-account-group-outline"></i>
      <span>{{ $t('NOT_FOUND') }}</span>
    </div>

    <AppModal
      v-model="showDetailModal"
      :title="group?.title"
      :subtitle="$t('GROUPS')"
      :width="640"
      :loading="detailSaving"
      @close="showDetailModal = false"
    >
      <div v-if="group" class="group-modal-scroll">
        <template v-if="!detailEditing">
          <div class="group-modal-view">
            <div class="group-modal-identity">
              <div class="group-modal-avatar">
                <img v-if="group.avatar" :src="group.avatar" alt="" />
                <v-icon v-else size="48" color="primary">mdi-domain</v-icon>
              </div>
              <div class="group-modal-info">
                <h3>{{ group.title }}</h3>
                <p v-if="group.description">{{ group.description }}</p>
                <div v-if="group.createdAt" class="group-modal-date">
                  <span class="text-caption text-disabled">{{ $t('CREATED_AT') }}:</span>
                  <span class="text-caption ml-1 font-weight-bold">{{ formatDate(group.createdAt) }}</span>
                </div>
              </div>
            </div>

            <v-divider class="my-4" />

            <div class="group-modal-fields">
              <div v-for="field in detailFields" :key="field.key" class="group-modal-field">
                <div class="text-overline text-disabled">{{ $t(field.label) }}</div>
                <div class="group-modal-field-value" :dir="field.ltr ? 'ltr' : 'auto'">
                  {{ (group as any)[field.key] || '—' }}
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="group-modal-edit">
            <AppInput
              v-for="field in editableFields"
              :key="field.key"
              v-model="(detailForm as any)[field.key]"
              :label="$t(field.label)"
              :textArea="field.textarea"
              :rows="field.textarea ? 3 : 1"
              dense
              class="mb-4"
            />
          </div>
        </template>
      </div>

      <template #footer>
        <template v-if="!detailEditing">
          <v-btn
            v-if="canEditGroup"
            color="primary"
            variant="elevated"
            prepend-icon="mdi-pencil-outline"
            :disabled="!!group?.archivedAt"
            @click="detailEditing = true"
          >
            {{ $t('EDIT') }}
          </v-btn>
          <v-btn variant="text" @click="showDetailModal = false">
            {{ $t('CLOSE') }}
          </v-btn>
        </template>
        <template v-else>
          <v-btn variant="text" @click="detailEditing = false">
            {{ $t('CANCEL') }}
          </v-btn>
          <v-btn color="primary" elevation="2" :loading="detailSaving" @click="saveDetail">
            {{ $t('SAVE_CHANGES') }}
          </v-btn>
        </template>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useGroupStore } from '@/stores/group.store';
import { usePermission } from '@/composables/usePermission';
import {
  AccessType,
  OperationResultStatus,
  type GroupViewModel,
} from '@asoode/shared';
import GroupChart from '@/components/features/group/GroupChart.vue';
import GroupMembers from '@/components/features/group/GroupMembers.vue';
import GroupProjects from '@/components/features/group/GroupProjects.vue';
import HumanResources from '@/components/features/hr/HumanResources.vue';
import GroupTimespent from '@/components/features/group/GroupTimespent.vue';
import GroupReports from '@/components/features/group/GroupReports.vue';
import GroupSettings from '@/components/features/group/GroupSettings.vue';
import GroupSkeleton from '@/components/core/skeletons/GroupSkeleton.vue';

const route = useRoute();
const router = useRouter();
const groupStore = useGroupStore();
const { canAdmin, canEdit } = usePermission();
const { t } = useI18n();

const waiting = ref(true);
const group = ref<GroupViewModel | null>(null);
const permission = ref<AccessType>(AccessType.Visitor);
const activeTab = ref('chart');

const showDetailModal = ref(false);
const detailEditing = ref(false);
const detailSaving = ref(false);
const detailForm = ref({
  title: '',
  description: '',
  brandTitle: '',
  supervisorName: '',
  supervisorNumber: '',
  responsibleName: '',
  responsibleNumber: '',
  email: '',
  website: '',
  postalCode: '',
  address: '',
  tel: '',
  fax: '',
  nationalId: '',
  registrationId: '',
});

const canEditGroup = computed(() => canAdmin(permission.value) || canEdit(permission.value));

const allTabs = [
  { value: 'chart', label: 'ORGANIZATION_CHART', icon: 'mdi-sitemap' },
  { value: 'members', label: 'MEMBERS', icon: 'mdi-account-group-outline' },
  { value: 'projects', label: 'PROJECTS', icon: 'mdi-briefcase-outline' },
  { value: 'hr', label: 'HUMAN_RESOURCES', icon: 'mdi-badge-account-outline' },
  { value: 'timespent', label: 'TIME_SPENT', icon: 'mdi-timer-outline' },
  { value: 'reports', label: 'REPORTS', icon: 'mdi-chart-bar' },
  { value: 'settings', label: 'SETTINGS', icon: 'mdi-cog-outline' },
];

const visibleTabs = computed(() => {
  if (permission.value === AccessType.Owner || permission.value === AccessType.Admin) {
    return allTabs;
  }
  return allTabs.filter(tab => tab.value !== 'settings');
});

const detailFields = [
  { key: 'brandTitle', label: 'BRAND_TITLE', ltr: false },
  { key: 'supervisorName', label: 'SUPERVISOR_NAME', ltr: false },
  { key: 'supervisorNumber', label: 'SUPERVISOR_NUMBER', ltr: true },
  { key: 'responsibleName', label: 'RESPONSIBLE_NAME', ltr: false },
  { key: 'responsibleNumber', label: 'RESPONSIBLE_NUMBER', ltr: true },
  { key: 'email', label: 'EMAIL', ltr: true },
  { key: 'website', label: 'WEBSITE', ltr: true },
  { key: 'postalCode', label: 'POSTAL_CODE', ltr: false },
  { key: 'address', label: 'ADDRESS', ltr: false },
  { key: 'tel', label: 'TEL', ltr: true },
  { key: 'fax', label: 'FAX', ltr: true },
  { key: 'geoLocation', label: 'LOCATION', ltr: false },
  { key: 'nationalId', label: 'NATIONAL_ID', ltr: true },
  { key: 'registrationId', label: 'REGISTRATION_ID', ltr: true },
];

const editableFields = [
  { key: 'title', label: 'TITLE' },
  { key: 'description', label: 'DESCRIPTION', textarea: true },
  { key: 'brandTitle', label: 'BRAND_TITLE' },
  { key: 'supervisorName', label: 'SUPERVISOR_NAME' },
  { key: 'supervisorNumber', label: 'SUPERVISOR_NUMBER' },
  { key: 'responsibleName', label: 'RESPONSIBLE_NAME' },
  { key: 'responsibleNumber', label: 'RESPONSIBLE_NUMBER' },
  { key: 'email', label: 'EMAIL' },
  { key: 'website', label: 'WEBSITE' },
  { key: 'postalCode', label: 'POSTAL_CODE' },
  { key: 'address', label: 'ADDRESS', textarea: true },
  { key: 'tel', label: 'TEL' },
  { key: 'fax', label: 'FAX' },
  { key: 'nationalId', label: 'NATIONAL_ID' },
  { key: 'registrationId', label: 'REGISTRATION_ID' },
];

const normalizedWebsite = computed(() => {
  if (!group.value?.website) return '#';
  return group.value.website.startsWith('http')
    ? group.value.website
    : `https://${group.value.website}`;
});

const accessLabel = computed(() => {
  switch (permission.value) {
    case AccessType.Owner:
      return t('OWNER');
    case AccessType.Admin:
      return t('ADMIN');
    case AccessType.Editor:
      return t('EDITOR');
    case AccessType.HiddenEditor:
      return t('HIDDEN_EDITOR');
    default:
      return t('VISITOR');
  }
});

const metrics = computed(() => {
  const current = group.value;
  if (!current) return [];

  return [
    {
      label: 'MEMBERS',
      value: current.members?.length || 0,
      helper: current.membersCapacity ? `${current.membersUsed}/${current.membersCapacity}` : '',
      icon: 'mdi-account-group-outline',
    },
    {
      label: 'PENDING',
      value: current.pending?.length || 0,
      helper: current.pending?.length ? t('PENDING') : '',
      icon: 'mdi-email-fast-outline',
    },
    {
      label: 'CREATED_AT',
      value: formatDate(current.createdAt),
      helper: current.registeredAt ? formatDate(current.registeredAt) : '',
      icon: 'mdi-calendar-range-outline',
    },
    {
      label: 'STORAGE',
      value: formatStorage(current.diskSpaceUsed),
      helper: current.diskSpaceCapacity ? `${formatStorage(current.diskSpaceCapacity)} ${t('TOTAL')}` : '',
      icon: 'mdi-database-outline',
    },
  ];
});

async function fetchGroup() {
  waiting.value = true;
  const id = route.params.id as string;

  const local = groupStore.groups.find(item => item.id === id);
  if (local) {
    group.value = local;
    permission.value = groupStore.getPermission(local);
    waiting.value = false;
    return;
  }

  const op = await groupStore.fetch(id);
  if (op.status !== OperationResultStatus.Success) {
    waiting.value = false;
    router.push('/dashboard');
    return;
  }

  group.value = op.data;
  permission.value = groupStore.getPermission(op.data);
  waiting.value = false;
}

function openDetail(startEditing = false) {
  if (group.value) {
    detailForm.value = {
      title: group.value.title || '',
      description: group.value.description || '',
      brandTitle: group.value.brandTitle || '',
      supervisorName: group.value.supervisorName || '',
      supervisorNumber: group.value.supervisorNumber || '',
      responsibleName: group.value.responsibleName || '',
      responsibleNumber: group.value.responsibleNumber || '',
      email: group.value.email || '',
      website: group.value.website || '',
      postalCode: group.value.postalCode || '',
      address: group.value.address || '',
      tel: group.value.tel || '',
      fax: group.value.fax || '',
      nationalId: group.value.nationalId || '',
      registrationId: group.value.registrationId || '',
    };
  }

  detailEditing.value = startEditing && canEditGroup.value && !group.value?.archivedAt;
  showDetailModal.value = true;
}

function formatDate(date: Date | string | undefined | null): string {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString();
}

function formatStorage(value: number | undefined | null): string {
  if (!value) return '0 MB';

  const units = ['MB', 'GB', 'TB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const rounded = size >= 10 || unitIndex === 0 ? Math.round(size) : Number(size.toFixed(1));
  return `${rounded} ${units[unitIndex]}`;
}

async function saveDetail() {
  if (!group.value) return;

  detailSaving.value = true;
  const op = await groupStore.edit(group.value.id, detailForm.value);
  detailSaving.value = false;

  if (op.status === OperationResultStatus.Success) {
    Object.assign(group.value, detailForm.value);
    detailEditing.value = false;
  }
}

onMounted(fetchGroup);
watch(() => route.params.id, fetchGroup);
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.group-page {
  min-height: calc(100vh - 48px);
  background: $background;
  display: flex;
  flex-direction: column;

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: $text-secondary;
    gap: 8px;

    .mdi {
      font-size: 48px;
      color: $text-disabled;
    }
  }
}

.group-shell {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 18px 32px 10px;

  @media (max-width: 600px) {
    padding: 14px 12px 8px;
  }
}

.group-overview {
  padding: 8px 0 0;

  &__main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;

    @media (max-width: 900px) {
      flex-direction: column;
    }
  }

  &__identity {
    min-width: 0;
    flex: 1;
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  &__avatar {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(59, 130, 246, 0.14));
    border: 1px solid rgba(199, 210, 254, 0.8);
    color: #4338ca;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .mdi {
      font-size: 28px;
    }
  }

  &__copy {
    min-width: 0;

    h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.15;
      color: $text-primary;
    }
  }

  &__eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $text-secondary;
    margin-bottom: 6px;
  }

  &__title-row {
    display: flex;
    align-items: center;
  }

  &__desc {
    margin: 6px 0 0;
    max-width: 640px;
    color: $text-secondary;
    line-height: 1.45;
    font-size: 13px;
  }

  &__side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;

    @media (max-width: 900px) {
      align-items: flex-start;
    }
  }

  &__topbar {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;

    @media (max-width: 900px) {
      justify-content: flex-start;
    }
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;

    @media (max-width: 900px) {
      justify-content: flex-start;
    }
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-radius: 999px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: $text-secondary;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;

    &--link:hover {
      color: $text-primary;
      border-color: #cbd5e1;
    }
  }
}

.group-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }

  &__card {
    padding: 12px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    min-width: 0;
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;

    .mdi {
      font-size: 18px;
      color: #6366f1;
    }
  }

  &__label {
    color: $text-secondary;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__value {
    color: $text-primary;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.1;
  }

  &__helper {
    margin-top: 4px;
    color: $text-secondary;
    font-size: 12px;
    line-height: 1.35;
  }
}

.group-tabs {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  position: sticky;
  top: 0;
  z-index: 10;

  &__inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    gap: 4px;
    overflow-x: auto;
    padding: 6px 32px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }

    @media (max-width: 600px) {
      padding: 6px 12px;
    }
  }

  &__tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 11px;
    font-size: 12px;
    font-weight: 600;
    color: $text-secondary;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 9px;
    cursor: pointer;
    white-space: nowrap;
    transition: color 200ms, border-color 200ms, background 200ms, box-shadow 200ms;
    font-family: inherit;
    min-height: 34px;

    .mdi {
      font-size: 14px;
    }

    &:hover {
      color: $text-primary;
      background: rgba(248, 250, 252, 0.92);
      border-color: rgba(226, 232, 240, 0.82);
    }

    &--active {
      color: #4338ca;
      background: rgba(238, 242, 255, 0.76);
      border-color: rgba(199, 210, 254, 0.88);
      box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.05);
    }

    @media (max-width: 600px) {
      padding: 7px 9px;

      span {
        display: none;
      }
    }
  }
}

.group-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 32px 40px;
  width: 100%;

  @media (max-width: 600px) {
    padding: 12px;
  }
}

.group-modal-scroll {
  max-height: 70vh;
  overflow-y: auto;
  padding: 4px;
}

.group-modal-view {
  display: flex;
  flex-direction: column;
}

.group-modal-identity {
  display: flex;
  gap: 16px;
  align-items: center;
}

.group-modal-avatar {
  width: 100px;
  height: 100px;
  border-radius: 20px;
  background: rgba(var(--v-theme-primary), 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), 0.1);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.group-modal-info {
  flex: 1;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: rgba(var(--v-theme-on-surface), 0.9);
  }

  p {
    margin: 4px 0 8px;
    font-size: 0.9rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
  }
}

.group-modal-fields {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.group-modal-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-modal-field-value {
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.85);
  padding: 8px 12px;
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), 0.05);
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 34px;
  border-radius: 10px;
  padding: 0 12px;
  border: 1px solid transparent;
  background: transparent;
  color: $text-primary;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &--subtle {
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    background: transparent;
    border-color: transparent;
    color: $text-secondary;

    &:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #e2e8f0;
      color: $text-primary;
    }
  }
}
</style>

<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .group-page {
    background: #1e1e1e;
  }

  .group-overview {
    &__copy h1 {
      color: $dark-text-light;
    }

    &__eyebrow,
    &__desc,
    &__chip {
      color: $dark-text-muted;
    }

    &__avatar {
      background: rgba(79, 70, 229, 0.18);
      color: #c7d2fe;
      border-color: #111827;
    }

    &__chip {
      background: rgba(30, 41, 59, 0.85);
      border-color: rgba(71, 85, 105, 0.7);
    }

    &__chip--link:hover {
      color: $dark-text-light;
      border-color: rgba(100, 116, 139, 0.85);
    }
  }

  .group-metrics {
    &__card {
      background: rgba(30, 41, 59, 0.7);
      border-color: rgba(71, 85, 105, 0.7);
    }

    &__label,
    &__helper {
      color: $dark-text-muted;
    }

    &__value {
      color: $dark-text-light;
    }
  }

  .group-tabs {
    background: $dark-card;
    border-color: $dark-border;

    &__tab {
      color: $dark-text-muted;

      &:hover {
        color: $dark-text-light;
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(71, 85, 105, 0.7);
      }

      &--active {
        color: $primary-light;
        border-color: rgba(129, 140, 248, 0.45);
        background: rgba(79, 70, 229, 0.15);
      }
    }
  }

  .group-modal-avatar {
    border-color: $dark-border;
  }

  .group-modal-info {
    h3 {
      color: $dark-text-light;
    }

    p {
      color: $dark-text-muted;
    }
  }

  .group-modal-field-value {
    color: $dark-text-light;
    border-color: $dark-border;
    background: rgba(30, 41, 59, 0.7);
  }

  .group-page .page-btn {
    &--subtle {
      color: $dark-text-muted;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(71, 85, 105, 0.7);
        color: $dark-text-light;
      }
    }
  }
}
</style>
