<template>
  <v-card class="pa-4">
    <h4 class="text-subtitle-1 mb-3">{{ $t('IMPORT') }}</h4>
    <template v-if="step === 1">
      <div class="d-flex flex-wrap ga-3 mb-4">
        <v-card
          v-for="src in sources"
          :key="src.value"
          variant="outlined"
          class="pa-3 flex-grow-1 cursor-pointer text-center"
          :class="{ 'border-primary': selected === src.value }"
          @click="selected = src.value"
        >
          <v-icon size="28">{{ src.icon }}</v-icon>
          <div class="text-caption mt-1">{{ $t(src.label) }}</div>
        </v-card>
      </div>
      <v-btn color="primary" :disabled="!selected" @click="step = 2">{{ $t('NEXT') }}</v-btn>
    </template>
    <template v-if="step === 2">
      <v-file-input v-model="file" :label="$t('SELECT_FILE')" class="mb-3" />
      <div class="d-flex ga-2">
        <v-btn variant="text" @click="step = 1">{{ $t('BACK') }}</v-btn>
        <v-btn color="primary" :disabled="!file" :loading="importing" @click="onImport">{{ $t('IMPORT') }}</v-btn>
      </div>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{ done: [] }>();
const step = ref(1);
const selected = ref('');
const file = ref<File[] | null>(null);
const importing = ref(false);

const sources = [
  { value: 'trello', label: 'TRELLO', icon: 'mdi-trello' },
  { value: 'jira', label: 'JIRA', icon: 'mdi-jira' },
  { value: 'csv', label: 'CSV', icon: 'mdi-file-delimited' },
  { value: 'json', label: 'JSON', icon: 'mdi-code-json' },
];

async function onImport() {
  importing.value = true;
  // Placeholder for import logic
  setTimeout(() => {
    importing.value = false;
    emit('done');
  }, 1000);
}
</script>
