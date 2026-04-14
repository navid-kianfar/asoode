<template>
  <v-file-input
    :model-value="modelValue"
    :label="label"
    :accept="acceptString"
    :multiple="multiple"
    :disabled="disabled"
    :error-messages="errors"
    density="comfortable"
    :hide-details="!errors?.length"
    prepend-icon="mdi-paperclip"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FileType } from '@asoode/shared';

const props = defineProps<{
  modelValue?: File | File[];
  label?: string;
  fileType?: FileType;
  multiple?: boolean;
  disabled?: boolean;
  errors?: string[];
}>();

defineEmits<{ 'update:modelValue': [value: File | File[]] }>();

const acceptString = computed(() => {
  switch (props.fileType) {
    case FileType.Image: return 'image/*';
    case FileType.Audio: return 'audio/*';
    case FileType.Video: return 'video/*';
    case FileType.Excel: return '.xls,.xlsx,.csv';
    case FileType.Word: return '.doc,.docx';
    case FileType.Pdf: return '.pdf';
    default: return undefined;
  }
});
</script>
