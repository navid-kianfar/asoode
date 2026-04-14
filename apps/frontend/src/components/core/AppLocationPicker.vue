<template>
  <div class="app-location-picker">
    <label v-if="label" class="text-caption text-medium-emphasis mb-1 d-block">{{ label }}</label>
    <div class="location-display d-flex align-center ga-2">
      <v-icon>mdi-map-marker</v-icon>
      <span v-if="modelValue">{{ modelValue }}</span>
      <span v-else class="text-medium-emphasis">{{ $t('NO_LOCATION') }}</span>
      <v-spacer />
      <v-btn size="small" variant="text" @click="$emit('pick')">
        {{ $t('SELECT') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string;
  label?: string;
}>();

defineEmits<{ 'update:modelValue': [value: string]; pick: [] }>();
</script>
