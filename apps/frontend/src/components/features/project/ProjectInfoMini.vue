<template>
  <div class="project-info-mini">
    <i :class="project.complex ? 'mdi mdi-sitemap' : 'mdi mdi-package-variant'"></i>
    <div class="info">
      <div class="name">{{ project.title }}</div>
      <div class="description">{{ project.description }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ project: any }>();
</script>

<style lang="scss">
.project-info-mini {
  padding: 5px;
  border-radius: 5px;
  background: #ffffff;
  display: flex;

  > i {
    width: 40px;
    text-align: center;
    font-size: 30px;
  }

  .info {
    min-width: 100px;

    .name {
      color: #4d4d4d;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .description {
      color: #999999;
      font-size: 0.7rem;
      font-weight: 300;
    }
  }
}

body.dark-mode {
  .project-info-mini {
    background: #3b3b3b;

    > i {
      color: #999999;
    }

    .info {
      .name {
        color: #cccccc;
      }

      .description {
        color: #888888;
      }
    }
  }
}
</style>
