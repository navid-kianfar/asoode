<template>
  <div v-if="uploads.length && !hidden" class="fuo">
    <div class="fuo-header">
      <div class="fuo-title">
        {{ $t('CURRENTLY_UPLOADING_FILES').replace('{0}', String(uploads.length)) }}
      </div>
      <button class="fuo-close" @click="hidden = true">
        <i class="mdi mdi-close"></i>
      </button>
    </div>
    <div class="fuo-list">
      <div
        v-for="(upload, idx) in uploads"
        :key="idx"
        :class="['fuo-item', { 'fuo-item--success': upload.success, 'fuo-item--failed': upload.failed }]"
      >
        <div class="fuo-progress-bg">
          <div class="fuo-progress" :style="{ width: upload.progress + '%' }"></div>
        </div>
        <div class="fuo-info">
          <span class="fuo-name">{{ upload.name }}</span>
          <span class="fuo-status">
            <i v-if="!upload.success && !upload.failed" class="mdi mdi-loading mdi-spin"></i>
            <i v-if="upload.success" class="mdi mdi-check"></i>
            <i v-if="upload.failed" class="mdi mdi-alert"></i>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { UploadViewModel } from '@asoode/shared';

defineProps<{ uploads: UploadViewModel[] }>();

const hidden = ref(false);
</script>

<style lang="scss">
.fuo {
  width: 320px;
  max-height: 400px;
  position: fixed;
  bottom: 0;
  right: 16px;
  background: #fff;
  z-index: 100;
  border-radius: 10px 10px 0 0;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.fuo-header {
  display: flex;
  align-items: center;
  background: #673AB7;
  color: #fff;
  padding: 10px 12px;
}

.fuo-title {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
}

.fuo-close {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0 4px;
  opacity: 0.8;
  &:hover { opacity: 1; }
}

.fuo-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
}

.fuo-item {
  margin: 4px 0;
  border-radius: 6px;
  background: #f5f5f5;
  position: relative;
  overflow: hidden;
}

.fuo-progress-bg {
  height: 36px;
}

.fuo-progress {
  height: 100%;
  background: #e0d4ef;
  border-radius: 6px;
  transition: width 0.3s;
}

.fuo-info {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 10px;
  z-index: 1;
}

.fuo-name {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fuo-status {
  flex-shrink: 0;
  i { font-size: 0.9rem; color: #999; }
}

.fuo-item--success {
  .fuo-progress { background: #ddf2e5; }
  .fuo-status i { color: #3d8f4d; }
}

.fuo-item--failed {
  .fuo-progress { background: #f4e3e3; }
  .fuo-status i { color: #b63d3c; }
}

body.dark-mode {
  .fuo {
    background: #313131;
  }
  .fuo-header {
    background: #59a8ef;
  }
  .fuo-item {
    background: #3b3b3b;
  }
  .fuo-progress {
    background: #4a4a5a;
  }
  .fuo-item--success .fuo-progress { background: #2d4a35; }
  .fuo-item--failed .fuo-progress { background: #4a2d2d; }
}
</style>
