<template>
  <div class="d-flex align-center ga-4">
    <AppDatePicker v-model="fromDate" :label="$t('FROM')" />
    <AppDatePicker v-model="toDate" :label="$t('TO')" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppDatePicker from './AppDatePicker.vue';

const props = defineProps<{ from?: Date | string; to?: Date | string }>();
const emit = defineEmits<{ 'update:from': [v: Date | string]; 'update:to': [v: Date | string] }>();

const fromDate = computed({
  get: () => props.from,
  set: (v) => emit('update:from', v!),
});
const toDate = computed({
  get: () => props.to,
  set: (v) => emit('update:to', v!),
});
</script>
