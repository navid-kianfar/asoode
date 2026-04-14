<template>
  <div class="modal-renderer">
    <component
      v-for="modal in modals"
      :key="modal.id"
      :is="modal.component"
      v-bind="modal.props"
      @confirm="modal.resolve(true)"
      @cancel="modal.resolve(false)"
      @close="modal.resolve(null)"
      @action="modal.resolve($event)"
    />
  </div>
</template>

<script setup lang="ts">
import { useModal } from '@/composables/useModal';

const { modals } = useModal();
</script>

<style lang="scss">
.modal-renderer {
  position: relative;
  z-index: 9999;
}
</style>
