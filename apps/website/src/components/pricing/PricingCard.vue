<template>
  <v-card
    :class="['h-100 pa-6 d-flex flex-column', highlight ? 'pricing-highlight' : '']"
    :elevation="highlight ? 4 : 1"
    rounded="xl"
  >
    <div v-if="highlight" class="pricing-badge">{{ badge }}</div>

    <h3 class="text-h5 font-weight-bold mb-1">{{ name }}</h3>
    <p class="text-body-2 text-medium-emphasis mb-4">{{ description }}</p>

    <div class="mb-2">
      <span class="text-h3 font-weight-bold text-primary">{{ price }}</span>
      <span v-if="suffix" class="text-body-2 text-medium-emphasis">{{ suffix }}</span>
    </div>

    <p v-if="limits" class="text-caption text-medium-emphasis mb-4">{{ limits }}</p>

    <v-btn
      :color="highlight ? 'primary' : undefined"
      :variant="highlight ? 'flat' : 'outlined'"
      block
      class="text-none mb-6"
      size="large"
      :href="ctaLink"
    >
      {{ cta }}
    </v-btn>

    <v-divider class="mb-4" />

    <div class="flex-grow-1">
      <div
        v-for="feature in features"
        :key="feature.text"
        class="d-flex align-center ga-2 mb-2"
      >
        <v-icon
          :color="feature.included ? 'success' : 'grey-lighten-1'"
          size="18"
        >
          {{ feature.included ? 'mdi-check' : 'mdi-close' }}
        </v-icon>
        <span
          class="text-body-2"
          :class="{ 'text-medium-emphasis': !feature.included }"
        >
          {{ feature.text }}
        </span>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  description: string
  price: string
  suffix?: string
  limits?: string
  cta: string
  ctaLink: string
  highlight?: boolean
  badge?: string
  features: { text: string; included: boolean }[]
}>()
</script>
