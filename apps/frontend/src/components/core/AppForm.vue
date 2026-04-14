<template>
  <v-form @submit.prevent="$emit('submit')">
    <template v-for="(field, idx) in visibleFields" :key="field.field || idx">
      <AppFormItem :field="field" :waiting="waiting" />
    </template>
    <slot />
  </v-form>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FormViewModel } from '@asoode/shared';
import AppFormItem from './AppFormItem.vue';

const props = defineProps<{
  form: FormViewModel[];
  waiting?: boolean;
}>();

defineEmits<{ submit: [] }>();

const visibleFields = computed(() => props.form.filter((f) => f.visible !== false));
</script>
