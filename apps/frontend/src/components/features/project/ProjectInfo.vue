<template>
  <div
    class="project-info"
    :class="{ simple: !project.complex, template: isTemplate }"
    @click="openProject($event)"
  >
    <div class="title">
      <i :class="project.complex ? 'mdi mdi-sitemap' : 'mdi mdi-package-variant'"></i>
      &nbsp;<span>{{ project.title }}</span>
    </div>
    <div class="description">{{ truncate(project.description, 200) }}</div>
    <div v-if="project.complex" class="details">
      <div class="item">
        <i class="mdi mdi-flag"></i>&nbsp;
        <span>{{ (project.seasons?.length || 0) }} {{ $t('SEASONS') }}</span>
      </div>
      <div class="item">
        <i class="mdi mdi-file-tree"></i>&nbsp;
        <span>{{ (project.subProjects?.length || 0) }} {{ $t('SUB_PROJECTS') }}</span>
      </div>
      <div class="item">
        <i class="mdi mdi-package-variant"></i>&nbsp;
        <span>{{ (project.workPackages?.length || 0) }} {{ $t('WORK_PACKAGES') }}</span>
      </div>
      <div class="item">
        <i class="mdi mdi-card-text-outline"></i>&nbsp;
        <span>{{ project.tasks || 0 }} {{ $t('CARDS') }}</span>
      </div>
    </div>
    <div class="members">
      <div class="item">
        <i class="mdi mdi-account-multiple"></i>&nbsp;
        <span>{{ individualCount }}&nbsp;{{ $t('INDIVIDUAL_USERS') }}</span>
      </div>
      &nbsp;
      <template v-for="m in project.members" :key="m.id">
        <div v-if="m.isGroup" class="item">
          <i class="mdi mdi-account-group"></i>&nbsp;
          <span>{{ getGroupName(m.recordId) }}</span>
        </div>
        &nbsp;
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGroupStore } from '@/stores/group.store';

const props = defineProps<{
  project: any;
  template?: boolean;
}>();

const router = useRouter();
const groupStore = useGroupStore();

const isTemplate = computed(() => !!props.template);

const individualCount = computed(() => {
  const nonGroupMembers = (props.project.members || []).filter((m: any) => !m.isGroup);
  const pending = props.project.pending?.length || 0;
  return nonGroupMembers.length + pending;
});

function truncate(text: string | undefined, length: number): string {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function getGroupName(recordId: string): string {
  const group = groupStore.groups.find((g) => g.id === recordId);
  return group?.title || recordId;
}

function openProject(event: Event) {
  event.stopPropagation();
  event.preventDefault();
  const p = props.project;
  if (p.archivedAt) {
    if (p.complex) {
      router.push('/project/' + p.id + '/archived');
      return;
    }
    router.push('/work-package/' + p.workPackages[0].id + '/archived');
    return;
  }
  if (p.complex) {
    router.push('/project/' + p.id);
    return;
  }
  router.push('/work-package/' + p.workPackages[0].id);
}
</script>

<style lang="scss">
.project-info {
  padding: 20px;
  margin: 0 0 20px;
  border-radius: 5px;
  display: flex;
  flex-wrap: wrap;
  background: #ffffff;
  color: #444444;
  cursor: pointer;

  .title {
    display: flex;
    align-items: center;
    min-width: 200px;
    max-width: 300px;
    width: 300px;
    margin-bottom: 10px;

    i {
      font-size: 2rem;
    }
  }

  .description {
    min-width: 300px;
    width: 300px;
    margin-bottom: 10px;
    display: flex;
    color: #999999;
    text-align: justify;
    font-size: 0.8rem;
  }

  .details {
    display: flex;
    min-width: 300px;
    flex-wrap: wrap;
    width: 450px;
    margin-bottom: 10px;

    .item {
      display: flex;
      align-items: center;
      padding: 0 15px;

      i {
        font-size: 0.9rem;
      }
      span {
        font-size: 0.8rem;
      }
    }
  }

  .members {
    color: #ffffff;
    display: flex;
    min-width: 300px;
    flex-wrap: wrap;

    .item {
      display: flex;
      background-color: #e6e6e6;
      padding: 5px 10px;
      color: #444444;
      border-radius: 15px;
      align-items: center;
      max-height: 33px;
      min-width: 130px;
      margin-bottom: 10px;

      i {
        font-size: 0.9rem;
      }
      span {
        font-size: 0.8rem;
      }
    }
  }

  &.simple {
    .title {
      min-width: 300px;
      width: 300px;
      flex-grow: 1;
      max-width: unset;
    }
  }

  &.template {
    background: #cfaf4e;
    color: #ffffff;

    .description {
      color: #ffffff;
    }
  }
}

@media (max-width: 500px) {
  .project-info {
    .details,
    .members {
      min-width: unset;
    }
  }
}

body.dark-mode {
  .project-info {
    background: #3b3b3b;
    color: #cccccc;

    .description {
      color: #888888;
    }

    .details .item {
      color: #999999;
    }

    .members .item {
      background-color: #555555;
      color: #cccccc;
    }

    &.template {
      background: #8a7530;
      color: #ffffff;

      .description {
        color: #ffffff;
      }
    }
  }
}
</style>
