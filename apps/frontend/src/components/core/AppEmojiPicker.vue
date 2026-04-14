<template>
  <v-menu :close-on-content-click="false">
    <template #activator="{ props }">
      <v-btn icon variant="text" size="small" v-bind="props">
        <v-icon>mdi-emoticon-outline</v-icon>
      </v-btn>
    </template>
    <v-card class="pa-2" max-width="300">
      <div class="d-flex flex-wrap ga-1">
        <span
          v-for="emoji in emojis"
          :key="emoji"
          class="emoji-item cursor-pointer pa-1 rounded"
          @click="onSelect?.(emoji)"
        >{{ emoji }}</span>
      </div>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
defineProps<{ onSelect?: (emoji: string) => void }>();

const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '👍', '👎', '👏', '🙌', '🤝', '🙏', '❤️', '🔥', '⭐', '✅',
  '❌', '⚡', '💡', '📌', '📎', '🎯', '🏆', '🚀', '💪', '👀',
];
</script>

<style scoped>
.emoji-item:hover {
  background: rgba(0, 0, 0, 0.06);
}
</style>
