<template>
  <div class="app-captcha">
    <div class="d-flex align-center ga-2 mb-2">
      <img v-if="image" :src="image" alt="captcha" class="captcha-image rounded" />
      <v-btn icon size="small" variant="text" @click="refresh">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </div>
    <v-text-field
      :model-value="code"
      :label="$t('CAPTCHA_CODE')"
      density="compact"
      hide-details
      @update:model-value="$emit('update:code', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { httpService } from '@/services/http.service';
import { API, OperationResultStatus, type CaptchaResult } from '@asoode/shared';

const props = defineProps<{
  token?: string;
  code?: string;
}>();

const emit = defineEmits<{
  'update:token': [value: string];
  'update:code': [value: string];
}>();

const image = ref('');

async function refresh() {
  const result = await httpService.post<CaptchaResult>(API.CAPTCHA);
  if (result.status === OperationResultStatus.Success) {
    image.value = result.data.image;
    emit('update:token', result.data.token);
  }
}

onMounted(refresh);
</script>

<style scoped lang="scss">
.captcha-image {
  height: 40px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
