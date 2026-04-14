<template>
  <div class="org-node text-center">
    <v-card variant="outlined" class="pa-2 d-inline-block mb-2" min-width="120">
      <v-avatar size="32" color="primary" class="mb-1">
        <v-img v-if="node.avatar" :src="node.avatar" />
        <span v-else class="text-white" style="font-size: 11px">{{ node.initials || '?' }}</span>
      </v-avatar>
      <div class="text-caption font-weight-medium">{{ node.fullName }}</div>
      <div v-if="node.role" class="text-caption text-medium-emphasis">{{ node.role }}</div>
    </v-card>
    <div v-if="node.children?.length" class="d-flex justify-center ga-4 mt-2">
      <OrgChartNode v-for="child in node.children" :key="child.id" :node="child" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  node: {
    id: string;
    fullName: string;
    initials?: string;
    role?: string;
    avatar?: string;
    children?: any[];
  };
}>();
</script>
