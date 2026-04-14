<template>
  <div class="fi-empty">
    <!-- CSS art: open folder -->
    <div class="fi-empty__art">
      <div class="fi-empty__folder">
        <div class="fi-empty__folder-back"></div>
        <div class="fi-empty__folder-tab"></div>
        <div class="fi-empty__folder-front"></div>
        <div class="fi-empty__folder-shine"></div>
      </div>
      <!-- Floating dots decoration -->
      <div class="fi-empty__dot fi-empty__dot--1"></div>
      <div class="fi-empty__dot fi-empty__dot--2"></div>
      <div class="fi-empty__dot fi-empty__dot--3"></div>
    </div>
    <div class="fi-empty__title">{{ $t('NO_FILES_HERE') }}</div>
    <div class="fi-empty__desc">{{ message || $t('NO_FILES_DESCRIPTION') }}</div>
    <button v-if="showAction" class="fi-empty__btn" @click="$emit('action')">
      <i class="mdi mdi-upload"></i>
      {{ $t('UPLOAD_FILES') }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string;
  showAction?: boolean;
}>();

defineEmits<{ action: [] }>();
</script>

<style lang="scss">
.fi-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 8px;

  &__art {
    position: relative;
    width: 120px;
    height: 100px;
    margin-bottom: 16px;
  }

  &__folder {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 72px;
  }

  // Back panel (slightly visible behind)
  &__folder-back {
    position: absolute;
    bottom: 0;
    left: 2px;
    right: 2px;
    height: 56px;
    background: #e8c34a;
    border-radius: 4px 8px 8px 8px;
  }

  // Tab on top
  &__folder-tab {
    position: absolute;
    top: 0;
    left: 2px;
    width: 36px;
    height: 16px;
    background: #e8c34a;
    border-radius: 6px 6px 0 0;
  }

  // Front panel (open, tilted forward)
  &__folder-front {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 48px;
    background: linear-gradient(165deg, #fce588 0%, #f5c842 40%, #e8b730 100%);
    border-radius: 2px 6px 8px 8px;
    box-shadow: 0 4px 16px rgba(245, 183, 49, 0.3);
    transform: perspective(200px) rotateX(-5deg);
    transform-origin: bottom center;
  }

  // Shine on front panel
  &__folder-shine {
    position: absolute;
    bottom: 24px;
    left: 4px;
    right: 4px;
    height: 18px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 100%);
    border-radius: 2px 6px 0 0;
    transform: perspective(200px) rotateX(-5deg);
    transform-origin: bottom center;
  }

  // Decorative floating dots
  &__dot {
    position: absolute;
    border-radius: 50%;
    opacity: 0.5;

    &--1 {
      width: 8px;
      height: 8px;
      background: #e0d4f0;
      top: 8px;
      right: 12px;
      animation: fi-float 3s ease-in-out infinite;
    }

    &--2 {
      width: 6px;
      height: 6px;
      background: #d4e8f7;
      top: 20px;
      left: 8px;
      animation: fi-float 3s ease-in-out 1s infinite;
    }

    &--3 {
      width: 5px;
      height: 5px;
      background: #fce588;
      top: 4px;
      left: 28px;
      animation: fi-float 3s ease-in-out 2s infinite;
    }
  }

  &__title {
    font-size: 1.1rem;
    font-weight: 500;
    color: #555;
  }

  &__desc {
    font-size: 0.85rem;
    color: #999;
    max-width: 300px;
    text-align: center;
  }

  &__btn {
    margin-top: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    border: none;
    border-radius: 6px;
    background: #673AB7;
    color: #fff;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.15s;

    &:hover {
      background: #5a2da8;
    }
  }
}

@keyframes fi-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

body.dark-mode {
  .fi-empty {
    &__folder-back {
      background: #9e8528;
    }
    &__folder-tab {
      background: #9e8528;
    }
    &__folder-front {
      background: linear-gradient(165deg, #d4a833 0%, #b8922a 40%, #9e7e22 100%);
      box-shadow: 0 4px 16px rgba(158, 133, 40, 0.25);
    }
    &__folder-shine {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%);
    }
    &__dot--1 { background: #6a5a8e; }
    &__dot--2 { background: #4a6e8e; }
    &__dot--3 { background: #9e8528; }
    &__title { color: #999; }
    &__desc { color: #666; }
    &__btn {
      background: #59a8ef;
      &:hover { background: #4a90d9; }
    }
  }
}
</style>
