<template>
  <div class="project-reports">
    <!-- No projects -->
    <div v-if="!projectStore.projects.length" class="no-projects">
      <h5>{{ $t('NO_PROJECTS_YET') }}</h5>
      <div class="create-holder" @click="openModal">
        <div class="plus">
          <i class="mdi mdi-plus"></i>
        </div>
        <div class="actions-text">
          {{ $t('CREATE_SIMPLE_OR_COMPLEX_PROJECT') }}
        </div>
      </div>
    </div>

    <!-- Projects list -->
    <div v-if="projectStore.projects.length" class="projects-container">
      <template v-for="project in projectStore.projects" :key="project.id">
        <div
          v-if="shouldShow(project)"
          :class="['project-info', { simple: !project.complex }]"
          @click="openProject(project)"
        >
          <div class="title">
            <i class="mdi" :class="project.complex ? 'mdi-sitemap' : 'mdi-briefcase'" style="font-size: 2rem"></i>
            &nbsp;<span>{{ project.title }}</span>
          </div>
          <div class="description">{{ truncate(project.description, 200) }}</div>
          <div v-if="project.complex" class="details">
            <div class="item">
              <i class="mdi mdi-flag"></i>&nbsp;
              <span>{{ formatN($t('N_SEASONS'), project.seasons?.length || 0) }}</span>
            </div>
            <div class="item">
              <i class="mdi mdi-file-tree"></i>&nbsp;
              <span>{{ formatN($t('N_SUB_PROJECT'), project.subProjects?.length || 0) }}</span>
            </div>
            <div class="item">
              <i class="mdi mdi-briefcase"></i>&nbsp;
              <span>{{ formatN($t('N_WORK_PACKAGE'), project.workPackages?.length || 0) }}</span>
            </div>
            <div class="item">
              <i class="mdi mdi-checkbox-marked-outline"></i>&nbsp;
              <span>{{ formatN($t('N_CARDS'), project.tasks || 0) }}</span>
            </div>
          </div>
          <div class="members">
            <div class="item">
              <i class="mdi mdi-account-group"></i>&nbsp;
              <span>{{ getNonGroupMembers(project) }}&nbsp;{{ $t('INDIVIDUAL_USERS') }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project.store';
import type { ProjectViewModel } from '@asoode/shared';

const props = defineProps<{ filter: number }>();

const router = useRouter();
const projectStore = useProjectStore();

function shouldShow(project: ProjectViewModel): boolean {
  // filter: 0=All, 1=Simple, 2=Complex, 3=Archived
  if (props.filter === 3) return false; // Archived handled separately
  if (props.filter === 0) return true;
  if (props.filter === 1) return !project.complex;
  if (props.filter === 2) return project.complex;
  return true;
}

function openProject(project: ProjectViewModel) {
  if (project.archivedAt) {
    if (project.complex) {
      router.push(`/project/${project.id}/archived`);
      return;
    }
    if (project.workPackages?.length) {
      router.push(`/work-package/${project.workPackages[0].id}/archived`);
    }
    return;
  }
  if (project.complex) {
    router.push(`/project/${project.id}`);
    return;
  }
  if (project.workPackages?.length) {
    router.push(`/work-package/${project.workPackages[0].id}`);
  } else {
    router.push(`/project/${project.id}`);
  }
}

function openModal() {
  // TODO: Open create wizard modal
}

function truncate(text: string | undefined, length: number): string {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function formatN(template: string, count: number): string {
  return template.replace(/\{0\}/g, String(count));
}

function getNonGroupMembers(project: ProjectViewModel): number {
  const nonGroup = (project.members || []).filter((m: any) => !m.isGroup);
  return nonGroup.length + (project.pending?.length || 0);
}
</script>

<style scoped lang="scss">
.project-reports {
  padding: 20px;
  overflow-x: hidden;

  .no-projects {
    h5 {
      color: #808080;
      font-weight: 400;
    }

    .create-holder {
      margin-top: 20px;
      display: flex;
      background: #ffffff;
      padding: 20px;
      border-radius: 5px;
      cursor: pointer;

      .plus {
        display: flex;
        width: 50px;
        justify-content: center;

        i {
          color: #b3b3b3;
          font-size: 0.8rem;
          width: 30px;
          height: 30px;
          text-align: center;
          border: 1px dashed #b3b3b3;
          border-radius: 50px;
          padding-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .actions-text {
        color: #999999;
        display: flex;
        flex-grow: 1;
        align-items: center;
      }
    }
  }
}

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
}

@media (max-width: 500px) {
  .project-info {
    .details,
    .members {
      min-width: unset;
    }
  }
// Dark mode handled in _dashboard.scss
}
</style>
