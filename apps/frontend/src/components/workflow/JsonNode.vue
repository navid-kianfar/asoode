<template>
  <div class="jn" :style="{ paddingLeft: depth * 14 + 'px' }">
    <!-- Expandable (object/array) -->
    <div
      v-if="isExpandable"
      class="jn__row jn__row--expandable"
      @click="expanded = !expanded"
    >
      <i class="mdi jn__chevron" :class="expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"></i>
      <span class="jn__key">{{ label }}</span>
      <span class="jn__badge" :class="'jn__badge--' + typeLabel">{{ typeLabel }}</span>
      <span v-if="!expanded" class="jn__preview">{{ preview }}</span>
    </div>

    <!-- Leaf value -->
    <div
      v-else
      class="jn__row jn__row--leaf"
      draggable="true"
      @dragstart="onDragStart"
      :title="`Drag to insert {{${nodeId}.${path}}}`"
    >
      <span class="jn__spacer"></span>
      <span class="jn__key">{{ label }}</span>
      <span class="jn__colon">:</span>
      <span class="jn__value" :class="'jn__value--' + valueType" @click="copyValue">
        {{ displayValue }}
      </span>
      <i class="mdi mdi-drag-vertical jn__drag-handle"></i>
    </div>

    <!-- Children -->
    <template v-if="isExpandable && expanded">
      <JsonNode
        v-for="(val, key) in value"
        :key="String(key)"
        :label="String(key)"
        :value="val"
        :node-id="nodeId"
        :path="isArrayParent ? path : buildPath(String(key))"
        :depth="depth + 1"
        :default-open="depth < 1"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  label: string;
  value: any;
  nodeId: string;
  path: string;
  depth: number;
  defaultOpen: boolean;
}>();

const expanded = ref(props.defaultOpen);

const valueType = computed(() => {
  if (props.value === null || props.value === undefined) return 'null';
  if (Array.isArray(props.value)) return 'array';
  return typeof props.value;
});

const isExpandable = computed(() => {
  return props.value !== null && typeof props.value === 'object';
});

const isArrayParent = computed(() => Array.isArray(props.value));

const typeLabel = computed(() => {
  if (Array.isArray(props.value)) return `array[${props.value.length}]`;
  if (typeof props.value === 'object' && props.value !== null) {
    return `object{${Object.keys(props.value).length}}`;
  }
  return valueType.value;
});

const displayValue = computed(() => {
  if (props.value === null) return 'null';
  if (props.value === undefined) return 'undefined';
  if (typeof props.value === 'string') return `"${props.value}"`;
  if (typeof props.value === 'boolean') return props.value ? 'true' : 'false';
  return String(props.value);
});

const preview = computed(() => {
  if (Array.isArray(props.value)) {
    if (props.value.length === 0) return '[]';
    return `[${props.value.length} items]`;
  }
  if (typeof props.value === 'object' && props.value !== null) {
    const keys = Object.keys(props.value);
    if (keys.length === 0) return '{}';
    if (keys.length <= 3) return `{ ${keys.join(', ')} }`;
    return `{ ${keys.slice(0, 3).join(', ')}, … }`;
  }
  return '';
});

function buildPath(key: string): string {
  return props.path ? `${props.path}` : key;
}

function onDragStart(e: DragEvent) {
  const expr = `\u007B\u007B${props.nodeId}.${props.path}\u007D\u007D`;
  e.dataTransfer?.setData('text/plain', expr);
  e.dataTransfer?.setData('application/x-workflow-expr', expr);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
}

function copyValue() {
  const raw = props.value === null ? 'null' : String(props.value);
  navigator.clipboard.writeText(raw).catch(() => {});
}
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.jn__row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 1px 4px;
  border-radius: 3px;
  min-height: 22px;
  cursor: default;

  &--expandable {
    cursor: pointer;
    &:hover { background: rgba($primary, 0.05); }
  }

  &--leaf {
    &:hover {
      background: rgba($primary, 0.04);
      .jn__drag-handle { opacity: 1; }
    }
  }
}

.jn__chevron {
  font-size: 0.8rem;
  color: $text-disabled;
  width: 16px;
  flex-shrink: 0;
  text-align: center;
}

.jn__spacer {
  width: 16px;
  flex-shrink: 0;
}

.jn__key {
  color: #9876aa;
  font-weight: 500;
  white-space: nowrap;
}

.jn__colon {
  color: $text-disabled;
  margin: 0 2px;
}

.jn__badge {
  font-size: 0.55rem;
  padding: 0 4px;
  border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;

  &--object\{, &[class*="--object"] {
    background: rgba(#64b5f6, 0.12);
    color: #64b5f6;
  }
  &[class*="--array"] {
    background: rgba(#81c784, 0.12);
    color: #81c784;
  }
}

.jn__preview {
  color: $text-disabled;
  font-size: 0.62rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.jn__value {
  cursor: pointer;
  border-radius: 2px;
  padding: 0 2px;

  &:hover { text-decoration: underline; }

  &--string { color: #6a8759; }
  &--number { color: #6897bb; }
  &--boolean { color: #cc7832; }
  &--null { color: $text-disabled; font-style: italic; }
}

.jn__drag-handle {
  opacity: 0;
  font-size: 0.8rem;
  color: $text-disabled;
  cursor: grab;
  margin-left: auto;
  transition: opacity 0.15s;
  &:active { cursor: grabbing; }
}

// Dark mode
:global(body.dark-mode) {
  .jn__key { color: #b39ddb; }
  .jn__row--expandable:hover { background: rgba(255, 255, 255, 0.04); }
  .jn__row--leaf:hover { background: rgba(255, 255, 255, 0.03); }
  .jn__value--string { color: #a5d6a7; }
  .jn__value--number { color: #90caf9; }
  .jn__value--boolean { color: #ffcc80; }
}
</style>
