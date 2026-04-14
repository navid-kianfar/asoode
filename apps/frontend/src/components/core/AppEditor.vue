<template>
  <div class="app-editor">
    <label v-if="label" class="text-caption text-medium-emphasis mb-1 d-block">{{ label }}</label>
    <div v-if="editor" class="editor-toolbar d-flex ga-1 mb-1">
      <v-btn size="x-small" variant="text" icon @click="editor.chain().focus().toggleBold().run()">
        <v-icon size="16">mdi-format-bold</v-icon>
      </v-btn>
      <v-btn size="x-small" variant="text" icon @click="editor.chain().focus().toggleItalic().run()">
        <v-icon size="16">mdi-format-italic</v-icon>
      </v-btn>
      <v-btn size="x-small" variant="text" icon @click="editor.chain().focus().toggleBulletList().run()">
        <v-icon size="16">mdi-format-list-bulleted</v-icon>
      </v-btn>
      <v-btn size="x-small" variant="text" icon @click="editor.chain().focus().toggleOrderedList().run()">
        <v-icon size="16">mdi-format-list-numbered</v-icon>
      </v-btn>
    </div>
    <editor-content :editor="editor" class="editor-content" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
  label?: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: props.placeholder || '' }),
  ],
  onUpdate: () => {
    emit('update:modelValue', editor.value?.getHTML() || '');
  },
});

watch(() => props.modelValue, (val) => {
  if (editor.value && val !== editor.value.getHTML()) {
    editor.value.commands.setContent(val || '', false);
  }
});
</script>

<style scoped lang="scss">
.editor-content {
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 4px;
  padding: 8px 12px;
  min-height: 120px;

  :deep(.ProseMirror) {
    outline: none;
    min-height: 100px;

    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: rgba(0, 0, 0, 0.38);
      pointer-events: none;
      height: 0;
    }
  }
}
</style>
