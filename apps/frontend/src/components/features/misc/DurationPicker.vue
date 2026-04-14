<template>
  <div class="d-flex align-center ga-2">
    <v-text-field
      v-model.number="hours"
      type="number"
      :label="$t('HOURS')"
      min="0"
      max="999"
      density="compact"
      hide-details
      style="max-width: 80px"
      @update:model-value="emitChange"
    />
    <span class="text-h6">:</span>
    <v-text-field
      v-model.number="minutes"
      type="number"
      :label="$t('MINUTES')"
      min="0"
      max="59"
      density="compact"
      hide-details
      style="max-width: 80px"
      @update:model-value="emitChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ modelValue?: number }>();
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const hours = ref(Math.floor((props.modelValue || 0) / 60));
const minutes = ref((props.modelValue || 0) % 60);

watch(() => props.modelValue, (val) => {
  hours.value = Math.floor((val || 0) / 60);
  minutes.value = (val || 0) % 60;
});

function emitChange() {
  emit('update:modelValue', (hours.value || 0) * 60 + (minutes.value || 0));
}
</script>
