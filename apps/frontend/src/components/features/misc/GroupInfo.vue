<template>
  <v-card variant="outlined" class="pa-3">
    <div class="d-flex align-center mb-2">
      <v-avatar size="36" color="deep-purple" class="mr-3">
        <span class="text-white text-caption">{{ group.title?.charAt(0) || 'G' }}</span>
      </v-avatar>
      <div>
        <div class="font-weight-medium">{{ group.title }}</div>
        <div class="text-caption text-medium-emphasis">{{ group.membersCount || 0 }} members</div>
      </div>
    </div>
    <div v-if="group.description" class="text-body-2 text-medium-emphasis">{{ group.description }}</div>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{ group: any }>();
</script>
