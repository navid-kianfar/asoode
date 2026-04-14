<template>
  <AppConfirm
    v-model="visible"
    :title="resolvedHeading"
    :message="resolvedMessage"
    :icon="resolvedIcon"
    :tone="tone"
    :action-label="resolvedActionLabel"
    :cancel-label="resolvedCancelLabel"
    :action-color="resolvedActionColor"
    :loading="waiting"
    :persistent="true"
    @confirm="onConfirm"
    @cancel="onCancel"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppConfirm from '../core/AppConfirm.vue';

const props = defineProps<{
  title?: string;
  heading?: string;
  message?: string;
  icon?: string;
  actionColor?: string;
  actionLabel?: string;
  cancelLabel?: string;
  action?: () => Promise<any>;
  cancel?: () => Promise<any>;
}>();

const emit = defineEmits<{ confirm: []; cancel: [] }>();
const visible = ref(true);
const waiting = ref(false);
const { t, te } = useI18n();

function translateMaybe(value?: string): string {
  if (!value) return '';
  return te(value) ? t(value) : value;
}

const tone = computed(() => {
  if (props.actionColor === 'error' || props.actionColor === 'danger') return 'danger';
  if (props.actionColor === 'warning') return 'warn';
  return 'primary';
});

const resolvedHeading = computed(() => translateMaybe(props.heading) || translateMaybe(props.title) || t('CONFIRM'));
const resolvedMessage = computed(() => translateMaybe(props.message));
const resolvedActionLabel = computed(() => translateMaybe(props.actionLabel) || t('CONFIRM'));
const resolvedCancelLabel = computed(() => translateMaybe(props.cancelLabel) || t('CANCEL'));
const resolvedActionColor = computed(() => props.actionColor || (tone.value === 'danger' ? 'error' : 'primary'));
const resolvedIcon = computed(() => {
  if (props.icon) return props.icon;
  if (tone.value === 'danger') return 'mdi-alert-octagon-outline';
  if (tone.value === 'warn') return 'mdi-alert-outline';
  return 'mdi-shield-check-outline';
});

async function onConfirm() {
  waiting.value = true;
  try {
    if (props.action) await props.action();
    emit('confirm');
  } finally {
    waiting.value = false;
  }
}

async function onCancel() {
  if (props.cancel) await props.cancel();
  emit('cancel');
  visible.value = false;
}
</script>
