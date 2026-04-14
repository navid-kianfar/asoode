<template>
  <div class="app-grid">
    <v-table v-if="items.length" density="comfortable">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.field" :class="col.cssClass">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="index">
          <td v-for="col in columns" :key="col.field" :class="col.cssClass">
            <slot :name="col.field" :item="item" :value="item[col.field]">
              {{ item[col.field] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </v-table>

    <div v-else class="text-center pa-8 text-medium-emphasis">
      {{ $t('NO_DATA') }}
    </div>

    <div v-if="totalPages > 1" class="d-flex justify-center pa-4">
      <v-pagination :model-value="page" :length="totalPages" @update:model-value="onPageChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { GridFilter, GridResult, GridCommand } from '@asoode/shared';
import { httpService } from '@/services/http.service';
import { OperationResultStatus } from '@asoode/shared';

interface Column {
  field: string;
  label: string;
  cssClass?: string;
}

const props = defineProps<{
  filter: GridFilter;
  columns: Column[];
}>();

const emit = defineEmits<{ command: [cmd: GridCommand<any>] }>();

const items = ref<any[]>([]);
const page = ref(1);
const totalPages = ref(0);
const loading = ref(false);

async function loadData() {
  loading.value = true;
  const result = await httpService.grid<any>({ ...props.filter, page: page.value });
  if (result.status === OperationResultStatus.Success) {
    items.value = result.data.items;
    totalPages.value = result.data.totalPages;
  }
  loading.value = false;
}

function onPageChange(p: number) {
  page.value = p;
  loadData();
}

onMounted(loadData);

watch(() => props.filter, loadData, { deep: true });

defineExpose({ reload: loadData });
</script>
