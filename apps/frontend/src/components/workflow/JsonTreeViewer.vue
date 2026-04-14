<template>
  <div class="jtv">
    <div v-if="data === null || data === undefined" class="jtv__empty">
      <i class="mdi mdi-code-json"></i>
      <span>No data</span>
    </div>
    <div v-else class="jtv__root">
      <JsonNode
        v-for="(val, key) in normalizedData"
        :key="String(key)"
        :label="String(key)"
        :value="val"
        :node-id="nodeId"
        :path="String(key)"
        :depth="0"
        :default-open="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import JsonNode from './JsonNode.vue';

const props = defineProps<{
  data: any;
  nodeId: string;
}>();

const normalizedData = computed(() => {
  if (props.data && typeof props.data === 'object') return props.data;
  return { value: props.data };
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.jtv {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.7rem;
  line-height: 1.6;
  overflow: auto;
  max-height: 300px;
}

.jtv__empty {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  color: $text-disabled;
  font-size: 0.72rem;
  i { font-size: 1rem; }
}

.jtv__root {
  padding: 4px 0;
}
</style>
