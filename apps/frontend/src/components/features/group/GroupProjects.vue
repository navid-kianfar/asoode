<template>
  <section class="group-projects">
    <header class="group-projects__header">
      <div class="group-projects__heading">
        <p class="group-projects__eyebrow">{{ $t('PROJECTS') }}</p>
        <p class="group-projects__summary">
          Browse every project this group participates in, with quick signals for complexity, members, and delivery scope.
        </p>
      </div>

      <div class="group-projects__meta">
        <span class="group-projects__chip">
          <i class="mdi mdi-briefcase-outline"></i>
          <strong>{{ projects.length }}</strong>
          <span class="group-projects__chip-label">{{ $t('PROJECTS') }}</span>
        </span>
      </div>
    </header>

    <div v-if="!projects.length" class="projects-empty">
      <i class="mdi mdi-briefcase-off-outline"></i>
      <span>{{ $t('NO_PROJECT_ACCESS') }}</span>
    </div>

    <div v-else class="projects-grid">
      <article
        v-for="project in projects"
        :key="project.id"
        class="project-card"
        @click="openProject(project)"
      >
        <div class="project-card__header">
          <div class="project-card__identity">
            <div class="project-card__icon" :class="{ 'project-card__icon--simple': !project.complex }">
              <i :class="project.complex ? 'mdi mdi-sitemap' : 'mdi mdi-briefcase-outline'"></i>
            </div>
            <div>
              <h3>{{ project.title }}</h3>
              <p>{{ truncate(project.description, 180) || $t('ROAD_MAP') }}</p>
            </div>
          </div>
          <span class="project-card__badge">
            {{ project.complex ? $t('TREE_VIEW') : $t('PROJECTS') }}
          </span>
        </div>

        <div class="project-card__stats">
          <div class="project-card__stat">
            <span>{{ $t('SEASONS') }}</span>
            <strong>{{ project.seasons?.length || 0 }}</strong>
          </div>
          <div class="project-card__stat">
            <span>{{ $t('WORK_PACKAGES') }}</span>
            <strong>{{ project.workPackages?.length || 0 }}</strong>
          </div>
          <div class="project-card__stat">
            <span>{{ $t('TASKS') }}</span>
            <strong>{{ project.tasks || 0 }}</strong>
          </div>
          <div class="project-card__stat">
            <span>{{ $t('MEMBERS') }}</span>
            <strong>{{ individualCount(project) }}</strong>
          </div>
        </div>

        <div class="project-card__members">
          <span class="project-card__member-chip">
            <i class="mdi mdi-account-multiple-outline"></i>
            {{ individualCount(project) }} {{ $t('INDIVIDUAL_USERS') }}
          </span>
          <span
            v-for="member in project.members"
            v-show="member.isGroup"
            :key="member.recordId"
            class="project-card__member-chip"
          >
            <i class="mdi mdi-account-group-outline"></i>
            {{ getGroupName(member.recordId) }}
          </span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project.store';
import { useGroupStore } from '@/stores/group.store';
import { AccessType, type GroupViewModel, type ProjectViewModel } from '@asoode/shared';

const props = defineProps<{
  group: GroupViewModel;
  permission: AccessType;
}>();

const router = useRouter();
const projectStore = useProjectStore();
const groupStore = useGroupStore();

const projects = computed<ProjectViewModel[]>(() => {
  return projectStore.projects.filter(project =>
    project.members?.some(member => member.isGroup && member.recordId === props.group.id),
  );
});

function truncate(text: string | undefined, maxLen: number): string {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return `${text.substring(0, maxLen)}...`;
}

function individualCount(project: ProjectViewModel): number {
  const nonGroupMembers = (project.members || []).filter(member => !member.isGroup);
  const pendingCount = (project as any).pending?.length || 0;
  return nonGroupMembers.length + pendingCount;
}

function getGroupName(groupId: string): string {
  const group = groupStore.groups.find(item => item.id === groupId);
  return group?.title || '';
}

function openProject(project: ProjectViewModel) {
  router.push(`/project/${project.id}`);
}

onMounted(async () => {
  await projectStore.load();
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.group-projects {
  display: grid;
  gap: 18px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding-top: 4px;

    @media (max-width: 900px) {
      flex-direction: column;
    }
  }

  &__heading {
    max-width: 620px;
  }

  &__eyebrow {
    margin: 0 0 6px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $text-secondary;
  }

  &__summary {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: $text-secondary;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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
  }

  &__chip-label {
    color: $text-secondary;
  }
}

.projects-empty {
  min-height: 220px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: $text-secondary;

  .mdi {
    font-size: 28px;
    color: #6366f1;
  }
}

.projects-grid {
  display: grid;
  gap: 14px;
}

.project-card {
  display: block;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.05);
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.08);
    border-color: #cbd5e1;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;

    @media (max-width: 760px) {
      flex-direction: column;
    }
  }

  &__identity {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: $text-primary;
    }

    p {
      margin: 4px 0 0;
      font-size: 13px;
      line-height: 1.5;
      color: $text-secondary;
      max-width: 720px;
    }
  }

  &__icon {
    width: 42px;
    height: 42px;
    border-radius: 13px;
    background: rgba(79, 70, 229, 0.12);
    color: #4f46e5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .mdi {
      font-size: 20px;
    }

    &--simple {
      background: rgba(14, 165, 233, 0.12);
      color: #0284c7;
    }
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: $text-secondary;
    font-size: 12px;
    font-weight: 600;
  }

  &__stats {
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;

    @media (max-width: 900px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  &__stat {
    padding: 12px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;

    span {
      display: block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: $text-secondary;
    }

    strong {
      display: block;
      margin-top: 6px;
      font-size: 20px;
      line-height: 1;
      color: $text-primary;
    }
  }

  &__members {
    margin-top: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__member-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    padding: 0 10px;
    border-radius: 999px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: $text-secondary;
    font-size: 12px;
    font-weight: 600;
  }
}
</style>

<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .group-projects {
    &__eyebrow,
    &__summary,
    &__chip,
    &__chip-label {
      color: $dark-text-muted;
    }

    &__chip {
      background: rgba(30, 41, 59, 0.85);
      border-color: rgba(71, 85, 105, 0.7);
    }
  }

  .projects-empty,
  .project-card {
    background: rgba(30, 41, 59, 0.72);
    border-color: rgba(71, 85, 105, 0.68);
    color: $dark-text-muted;
    box-shadow: none;
  }

  .project-card {
    &:hover {
      box-shadow: 0 18px 32px rgba(0, 0, 0, 0.18);
      border-color: rgba(100, 116, 139, 0.82);
    }

    &__identity {
      h3 {
        color: $dark-text-light;
      }

      p {
        color: $dark-text-muted;
      }
    }

    &__badge,
    &__member-chip,
    &__stat {
      background: rgba(15, 23, 42, 0.46);
      border-color: rgba(71, 85, 105, 0.68);
    }

    &__badge,
    &__member-chip {
      color: $dark-text-muted;
    }

    &__stat {
      span {
        color: $dark-text-muted;
      }

      strong {
        color: $dark-text-light;
      }
    }
  }
}
</style>
