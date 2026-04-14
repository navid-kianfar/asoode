<template>
  <div class="te" :class="{ 'te--compact': compact }">
    <!-- Toolbar -->
    <div v-if="editor" class="te__toolbar">
      <button
        v-for="btn in toolbarButtons"
        :key="btn.action"
        class="te__tool"
        :class="{ active: btn.isActive?.() }"
        :title="btn.title"
        @click="btn.command()"
      >
        <i class="mdi" :class="btn.icon"></i>
      </button>

      <span class="te__tool-sep"></span>

      <!-- Emoji -->
      <div class="te__emoji-wrap" ref="emojiRef">
        <button class="te__tool" title="Emoji" @click="openEmoji">
          <i class="mdi mdi-emoticon-outline"></i>
        </button>
        <Teleport to="body">
          <transition name="te-pop">
            <div
              v-if="showEmoji"
              ref="emojiPanelRef"
              class="te__emoji-panel"
              :style="{ top: emojiPos.top + 'px', left: emojiPos.left + 'px' }"
            >
              <span
                v-for="emoji in emojis"
                :key="emoji"
                class="te__emoji"
                @click="insertEmoji(emoji)"
              >{{ emoji }}</span>
            </div>
          </transition>
        </Teleport>
      </div>

      <!-- Mention trigger -->
      <button v-if="members?.length" class="te__tool" title="@ Mention" @click="triggerMention">
        <i class="mdi mdi-at"></i>
      </button>

      <!-- Send button (compact mode) -->
      <template v-if="compact">
        <span class="te__tool-spacer"></span>
        <button
          class="te__send"
          :disabled="!hasContent"
          @click="onSubmit"
        >
          <i class="mdi mdi-send"></i>
        </button>
      </template>
    </div>

    <!-- Editor content -->
    <editor-content :editor="editor" class="te__content" :style="{ minHeight: minHeight || (compact ? '60px' : '120px') }" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { onClickOutside } from '@vueuse/core';

const props = withDefaults(defineProps<{
  modelValue?: string;
  placeholder?: string;
  members?: Array<{ id: string; name: string; initials: string }>;
  compact?: boolean;
  minHeight?: string;
}>(), {
  compact: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  submit: [];
}>();

const showEmoji = ref(false);
const emojiRef = ref<HTMLElement>();
const emojiPanelRef = ref<HTMLElement>();
const emojiPos = ref({ top: 0, left: 0 });

function openEmoji() {
  if (showEmoji.value) {
    showEmoji.value = false;
    return;
  }
  if (emojiRef.value) {
    const rect = emojiRef.value.getBoundingClientRect();
    const panelWidth = 260;
    let left = rect.left;
    if (left + panelWidth > window.innerWidth - 8) {
      left = window.innerWidth - panelWidth - 8;
    }
    emojiPos.value = { top: rect.bottom + 6, left };
  }
  showEmoji.value = true;
}

const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '👍', '👎', '👏', '🙌', '🤝', '🙏', '❤️', '🔥', '⭐', '✅',
  '❌', '⚡', '💡', '📌', '📎', '🎯', '🏆', '🚀', '💪', '👀',
];

onClickOutside(emojiRef, () => { showEmoji.value = false; }, { ignore: [emojiPanelRef] });

// Build mention extension config
const mentionConfig = computed(() => {
  if (!props.members?.length) return {};
  return {
    HTMLAttributes: { class: 'te-mention' },
    suggestion: {
      items: ({ query }: { query: string }) => {
        return (props.members || [])
          .filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5);
      },
      render: () => {
        let component: HTMLElement | null = null;
        let items: any[] = [];
        let selectedIndex = 0;
        let command: any = null;

        return {
          onStart: (p: any) => {
            command = p.command;
            items = p.items;
            selectedIndex = 0;

            component = document.createElement('div');
            component.className = 'te-mention-list';
            items.forEach((item: any, index: number) => {
              const btn = document.createElement('button');
              btn.className = 'te-mention-item' + (index === 0 ? ' selected' : '');
              btn.innerHTML = `<span class="te-mention-initials">${item.initials}</span><span>${item.name}</span>`;
              btn.addEventListener('click', () => {
                command({ id: item.id, label: item.name });
              });
              component!.appendChild(btn);
            });

            document.body.appendChild(component);
            const rect = p.clientRect?.();
            if (rect && component) {
              component.style.position = 'fixed';
              component.style.left = `${rect.left}px`;
              component.style.top = `${rect.bottom + 4}px`;
              component.style.zIndex = '9999';
            }
          },
          onUpdate: (p: any) => {
            items = p.items;
            command = p.command;
            if (component) {
              component.innerHTML = '';
              items.forEach((item: any, index: number) => {
                const btn = document.createElement('button');
                btn.className = 'te-mention-item' + (index === selectedIndex ? ' selected' : '');
                btn.innerHTML = `<span class="te-mention-initials">${item.initials}</span><span>${item.name}</span>`;
                btn.addEventListener('click', () => {
                  command({ id: item.id, label: item.name });
                });
                component!.appendChild(btn);
              });
            }
          },
          onKeyDown: (p: any) => {
            if (p.event.key === 'ArrowUp') {
              selectedIndex = (selectedIndex - 1 + items.length) % items.length;
              updateSelection();
              return true;
            }
            if (p.event.key === 'ArrowDown') {
              selectedIndex = (selectedIndex + 1) % items.length;
              updateSelection();
              return true;
            }
            if (p.event.key === 'Enter') {
              if (items[selectedIndex]) {
                command({ id: items[selectedIndex].id, label: items[selectedIndex].name });
              }
              return true;
            }
            return false;
          },
          onExit: () => {
            component?.remove();
            component = null;
          },
        };

        function updateSelection() {
          if (!component) return;
          const btns = component.querySelectorAll('.te-mention-item');
          btns.forEach((btn, i) => {
            btn.classList.toggle('selected', i === selectedIndex);
          });
        }
      },
    },
  };
});

const extensions = computed(() => {
  const exts: any[] = [
    StarterKit.configure({
      heading: props.compact ? false : { levels: [1, 2, 3] },
    }),
    Placeholder.configure({ placeholder: props.placeholder || '' }),
  ];

  if (props.members?.length) {
    exts.push(Mention.configure(mentionConfig.value));
  }

  return exts;
});

const editor = useEditor({
  content: props.modelValue || '',
  extensions: extensions.value,
  editorProps: {
    handleKeyDown: (_view: any, event: KeyboardEvent) => {
      if (props.compact && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        onSubmit();
        return true;
      }
      return false;
    },
  },
  onUpdate: () => {
    emit('update:modelValue', editor.value?.getHTML() || '');
  },
});

const hasContent = computed(() => {
  if (!editor.value) return false;
  const text = editor.value.getText().trim();
  return text.length > 0;
});

// Toolbar buttons
const toolbarButtons = computed(() => {
  const buttons: Array<{
    action: string;
    icon: string;
    title: string;
    command: () => void;
    isActive?: () => boolean;
  }> = [];

  if (!editor.value) return buttons;

  buttons.push(
    { action: 'bold', icon: 'mdi-format-bold', title: 'Bold', command: () => editor.value!.chain().focus().toggleBold().run(), isActive: () => editor.value!.isActive('bold') },
    { action: 'italic', icon: 'mdi-format-italic', title: 'Italic', command: () => editor.value!.chain().focus().toggleItalic().run(), isActive: () => editor.value!.isActive('italic') },
    { action: 'strike', icon: 'mdi-format-strikethrough', title: 'Strikethrough', command: () => editor.value!.chain().focus().toggleStrike().run(), isActive: () => editor.value!.isActive('strike') },
  );

  if (!props.compact) {
    buttons.push(
      { action: 'code', icon: 'mdi-code-tags', title: 'Code', command: () => editor.value!.chain().focus().toggleCode().run(), isActive: () => editor.value!.isActive('code') },
    );
  }

  buttons.push(
    { action: 'bulletList', icon: 'mdi-format-list-bulleted', title: 'Bullet List', command: () => editor.value!.chain().focus().toggleBulletList().run(), isActive: () => editor.value!.isActive('bulletList') },
    { action: 'orderedList', icon: 'mdi-format-list-numbered', title: 'Ordered List', command: () => editor.value!.chain().focus().toggleOrderedList().run(), isActive: () => editor.value!.isActive('orderedList') },
  );

  return buttons;
});

function insertEmoji(emoji: string) {
  editor.value?.chain().focus().insertContent(emoji).run();
  showEmoji.value = false;
}

function triggerMention() {
  editor.value?.chain().focus().insertContent('@').run();
}

function onSubmit() {
  if (!hasContent.value) return;
  emit('submit');
}

// Sync external changes
watch(() => props.modelValue, (val) => {
  if (editor.value && val !== editor.value.getHTML()) {
    editor.value.commands.setContent(val || '', false);
  }
});

// Public method to clear editor
function clear() {
  editor.value?.commands.setContent('', false);
}

defineExpose({ clear });
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.te {
  border: 1px solid $divider;
  border-radius: $border-radius-md;
  overflow: hidden;
  transition: border-color $transition-fast;

  &:focus-within {
    border-color: $primary;
    box-shadow: 0 0 0 2px rgba($primary, 0.08);
  }

  &--compact {
    border-radius: 10px;
  }

  // Toolbar
  &__toolbar {
    display: flex;
    align-items: center;
    gap: 1px;
    padding: 4px 6px;
    background: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    flex-wrap: wrap;
  }

  &__tool {
    width: 28px;
    height: 28px;
    border: none;
    background: none;
    border-radius: $border-radius-sm;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-secondary;
    transition: all $transition-fast;
    flex-shrink: 0;

    i { font-size: 0.9rem; }

    &:hover { background: rgba(0, 0, 0, 0.06); color: $text-primary; }
    &.active { background: rgba($primary, 0.1); color: $primary; }
  }

  &__tool-sep {
    width: 1px;
    height: 18px;
    background: $divider;
    margin: 0 4px;
  }

  &__tool-spacer {
    flex: 1;
  }

  &__send {
    width: 30px;
    height: 30px;
    border: none;
    background: $primary;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    transition: all $transition-fast;

    i { font-size: 0.85rem; }

    &:hover { opacity: 0.9; }
    &:disabled { opacity: 0.3; cursor: default; }
  }

  // Emoji
  &__emoji-wrap {
    position: relative;
  }

  // Editor content area
  &__content {
    padding: 10px 14px;

    :deep(.ProseMirror) {
      outline: none;
      font-size: 0.85rem;
      line-height: 1.6;
      color: $text-primary;

      > *:first-child { margin-top: 0; }
      > *:last-child { margin-bottom: 0; }

      p { margin: 0 0 4px; }

      p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        color: $text-disabled;
        pointer-events: none;
        height: 0;
      }

      ul, ol {
        padding-left: 20px;
        margin: 4px 0;
      }

      code {
        background: rgba(0, 0, 0, 0.06);
        padding: 1px 4px;
        border-radius: 3px;
        font-size: 0.82rem;
      }

      h1 { font-size: 1.3rem; margin: 8px 0 4px; }
      h2 { font-size: 1.1rem; margin: 6px 0 3px; }
      h3 { font-size: 0.95rem; margin: 4px 0 2px; }
    }
  }

  &--compact &__content {
    padding: 8px 12px;

    :deep(.ProseMirror) {
      font-size: 0.82rem;
      min-height: 40px;
    }
  }

  &--compact &__toolbar {
    padding: 2px 4px;
  }

  &--compact &__tool {
    width: 24px;
    height: 24px;
    i { font-size: 0.8rem; }
  }
}

// Emoji popup transition
.te-pop-enter-active { transition: opacity 150ms ease, transform 150ms ease; }
.te-pop-leave-active { transition: opacity 100ms ease; }
.te-pop-enter-from, .te-pop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>

<!-- Mention suggestion list (global, appended to body) -->
<style lang="scss">
.te-mention-list {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px;
  min-width: 180px;
}

.te-mention-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.87);
  font-family: inherit;

  &:hover, &.selected { background: rgba(103, 58, 183, 0.08); }

  .te-mention-initials {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(103, 58, 183, 0.12);
    color: #673AB7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.55rem;
    font-weight: 700;
    flex-shrink: 0;
  }
}

// Emoji panel (teleported to body, needs global styles)
.te__emoji-panel {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
  width: 260px;
  max-height: 200px;
  overflow-y: auto;
}

.te__emoji {
  cursor: pointer;
  font-size: 1.1rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 120ms ease;

  &:hover { background: rgba(0, 0, 0, 0.06); }
}

// Mention chip in editor
.te-mention {
  background: rgba(103, 58, 183, 0.1);
  color: #673AB7;
  border-radius: 4px;
  padding: 1px 4px;
  font-weight: 500;
  font-size: 0.85em;
}

// Dark mode
body.dark-mode {
  .te {
    border-color: #555;
    &:focus-within { border-color: #9575CD; box-shadow: 0 0 0 2px rgba(#9575CD, 0.12); }
  }

  .te__toolbar { background: rgba(255, 255, 255, 0.03); border-color: rgba(255, 255, 255, 0.06); }
  .te__tool { color: #888; &:hover { background: rgba(255, 255, 255, 0.06); color: #ccc; } &.active { background: rgba(#9575CD, 0.15); color: #9575CD; } }
  .te__tool-sep { background: rgba(255, 255, 255, 0.08); }
  .te__send { background: #9575CD; }

  .te__emoji-panel {
    background: #3b3b3b;
    border-color: #555;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  }
  .te__emoji:hover { background: rgba(255, 255, 255, 0.08); }

  .te__content :deep(.ProseMirror) {
    color: #ddd;
    p.is-editor-empty:first-child::before { color: #666; }
    code { background: rgba(255, 255, 255, 0.08); }
  }

  .te-mention-list {
    background: #3b3b3b;
    border-color: #555;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  }

  .te-mention-item {
    color: #ddd;
    &:hover, &.selected { background: rgba(#9575CD, 0.15); }
    .te-mention-initials { background: rgba(#9575CD, 0.2); color: #B39DDB; }
  }

  .te-mention {
    background: rgba(#9575CD, 0.15);
    color: #B39DDB;
  }
}
</style>
