<template>
  <v-card class="pa-6 text-center">
    <v-icon size="48" color="primary" class="mb-3">mdi-rocket-launch</v-icon>
    <h3 class="text-h6 mb-2">{{ $t('UPGRADE_PLAN') }}</h3>
    <p class="text-body-2 text-medium-emphasis mb-4">{{ $t('UPGRADE_PLAN_DESC') }}</p>
    <div class="d-flex flex-wrap ga-3 justify-center mb-4">
      <v-card
        v-for="plan in plans"
        :key="plan.value"
        variant="outlined"
        class="pa-4 cursor-pointer"
        :class="{ 'border-primary': selected === plan.value }"
        style="min-width: 150px"
        @click="selected = plan.value"
      >
        <div class="text-h5 font-weight-bold text-primary">{{ plan.price }}</div>
        <div class="font-weight-medium">{{ $t(plan.label) }}</div>
        <div class="text-caption text-medium-emphasis">{{ plan.features }}</div>
      </v-card>
    </div>
    <v-btn color="primary" size="large" :disabled="!selected" @click="$emit('upgrade', selected)">
      {{ $t('UPGRADE') }}
    </v-btn>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineEmits<{ upgrade: [plan: string] }>();
const selected = ref('');

const plans = [
  { value: 'pro', label: 'PRO', price: '$9/mo', features: '50 projects, 20 members' },
  { value: 'business', label: 'BUSINESS', price: '$29/mo', features: 'Unlimited projects & members' },
  { value: 'enterprise', label: 'ENTERPRISE', price: 'Contact us', features: 'Custom limits, SLA, SSO' },
];
</script>
