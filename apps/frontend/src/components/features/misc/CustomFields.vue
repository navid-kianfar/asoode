<template>
  <div>
    <div class="d-flex align-center mb-3">
      <h4 class="text-subtitle-1">{{ $t('CUSTOM_FIELDS') }}</h4>
      <v-spacer />
      <v-btn size="small" variant="outlined" @click="onAdd">
        <v-icon start>mdi-plus</v-icon>{{ $t('ADD_FIELD') }}
      </v-btn>
    </div>
    <div v-for="field in fields" :key="field.id" class="d-flex align-center mb-2 ga-2">
      <v-text-field v-model="field.label" density="compact" hide-details :label="$t('LABEL')" style="max-width: 200px" />
      <v-select v-model="field.type" :items="fieldTypes" density="compact" hide-details :label="$t('TYPE')" style="max-width: 150px" />
      <v-btn icon variant="text" size="small" color="error" @click="onRemove(field)">
        <v-icon size="small">mdi-delete</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const fields = ref<{ id: string; label: string; type: string }[]>([]);
const fieldTypes = ['Text', 'Number', 'Date', 'Dropdown', 'Checkbox'];

let counter = 0;
function onAdd() {
  fields.value.push({ id: `cf-${++counter}`, label: '', type: 'Text' });
}

function onRemove(field: { id: string }) {
  fields.value = fields.value.filter(f => f.id !== field.id);
}
</script>
