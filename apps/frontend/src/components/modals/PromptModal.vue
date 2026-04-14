<template>
  <AppModal
    v-model="visible"
    :title="title"
    :subtitle="summary"
    :width="width || 500"
    :persistent="true"
    :loading="actionWaiting"
    @close="onCancel"
  >
    <div v-if="icon" class="text-center mb-4">
      <v-icon size="48" color="primary">{{ icon }}</v-icon>
    </div>

    <AppForm :form="form" :waiting="actionWaiting" @submit="onAction" />

    <div v-if="progress?.uploading" class="mt-4">
      <v-progress-linear :model-value="progress.uploadPercent" color="primary" height="6" rounded />
    </div>

    <template #footer>
      <v-btn variant="text" :loading="cancelWaiting" @click="onCancel">
        {{ cancelLabel || $t('CANCEL') }}
      </v-btn>
      <v-btn
        :color="actionColor || 'primary'"
        :loading="actionWaiting"
        elevation="2"
        @click="onAction"
      >
        {{ actionLabel || $t('SAVE') }}
      </v-btn>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from '@/composables/useForm';
import type { FormViewModel, ModalProgress } from '@asoode/shared';
import AppForm from '@/components/core/AppForm.vue';
import AppModal from '../core/AppModal.vue';

const props = defineProps<{
  title?: string;
  summary?: string;
  icon?: string;
  form: FormViewModel[];
  progress?: ModalProgress;
  actionColor?: string;
  actionLabel?: string;
  cancelLabel?: string;
  actionWaiting?: boolean;
  cancelWaiting?: boolean;
  width?: number;
  action?: (params: any, form: FormViewModel[]) => Promise<any>;
  cancel?: (params?: any, form?: FormViewModel[]) => Promise<any>;
}>();

const emit = defineEmits<{ action: [result: any]; cancel: [] }>();
const { prepare } = useForm();
const visible = ref(true);

async function onAction() {
  const { model, isValid } = prepare(props.form);
  if (!isValid) return;
  if (props.action) {
    const result = await props.action(model, props.form);
    emit('action', result);
  }
}

async function onCancel() {
  if (props.cancel) {
    const { model } = prepare(props.form);
    await props.cancel(model, props.form);
  }
  emit('cancel');
  visible.value = false;
}
</script>
