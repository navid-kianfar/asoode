<template>
  <v-btn
    :color="color"
    :loading="waiting"
    :disabled="disabled || waiting"
    :variant="variant"
    :size="size"
    :prepend-icon="icon"
    @click="$emit('click', $event)"
  >
    {{ label }}
    <slot />
  </v-btn>
</template>

<script setup lang="ts">
defineProps<{
  label?: string;
  icon?: string;
  color?: string;
  waiting?: boolean;
  disabled?: boolean;
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain';
  size?: string;
}>();

defineEmits<{ click: [e: Event] }>();
</script>
