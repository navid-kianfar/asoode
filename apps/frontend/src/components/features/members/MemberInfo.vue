<template>
  <v-card variant="flat" class="pa-3">
    <div class="d-flex align-center">
      <v-avatar size="48" :color="member.avatar ? undefined : 'primary'" class="mr-3">
        <v-img v-if="member.avatar" :src="member.avatar" />
        <span v-else class="text-white">{{ member.initials || '?' }}</span>
      </v-avatar>
      <div>
        <div class="font-weight-medium">{{ member.fullName }}</div>
        <div class="text-caption text-medium-emphasis">{{ member.email }}</div>
        <div v-if="member.phone" class="text-caption text-medium-emphasis">{{ member.phone }}</div>
      </div>
    </div>
    <div v-if="member.bio" class="text-body-2 mt-2">{{ member.bio }}</div>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{ member: any }>();
</script>
