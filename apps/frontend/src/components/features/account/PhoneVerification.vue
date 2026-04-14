<template>
  <div
    :id="`verify-${prefix}`"
    :class="['otp-input-group', { 'has-error': hasError }]"
  >
    <input
      v-for="i in 6"
      :key="i"
      :id="`otp-${prefix}-${i}`"
      :disabled="disabled"
      type="text"
      maxlength="1"
      inputmode="numeric"
      autocomplete="one-time-code"
      class="otp-box"
      @keyup="onKeyUp($event, i)"
      @keydown="onKeyDown($event, i)"
      @paste="onPaste($event)"
      @focus="onFocus($event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

withDefaults(defineProps<{
  hasError?: boolean;
  disabled?: boolean;
  modelValue?: string;
}>(), {
  hasError: false,
  disabled: false,
  modelValue: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const prefix = ref(Date.now().toString());

function getContainer(): HTMLElement | null {
  return document.getElementById(`verify-${prefix.value}`);
}

function getInput(index: number): HTMLInputElement | null {
  const container = getContainer();
  if (!container) return null;
  return container.querySelector<HTMLInputElement>(`#otp-${prefix.value}-${index}`);
}

function collectValue() {
  const container = getContainer();
  if (!container) return;
  const inputs = container.querySelectorAll<HTMLInputElement>('.otp-box');
  let model = '';
  inputs.forEach((el) => {
    model += el.value;
  });
  emit('update:modelValue', model);
}

function onFocus(event: FocusEvent) {
  (event.target as HTMLInputElement).select();
}

function onKeyDown(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace') {
    const current = getInput(index);
    if (current && !current.value && index > 1) {
      event.preventDefault();
      const prev = getInput(index - 1);
      if (prev) {
        prev.value = '';
        prev.focus();
        collectValue();
      }
    }
  }
}

function onKeyUp(event: KeyboardEvent, index: number) {
  const isDigit = /^\d$/.test(event.key);

  if (isDigit) {
    let nextIndex = index + 1;
    if (nextIndex <= 6) {
      const next = getInput(nextIndex);
      if (next) {
        next.select();
        next.focus();
      }
    }
  }

  collectValue();
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault();
  const paste = event.clipboardData?.getData('text') || '';
  const digits = paste.replace(/\D/g, '').slice(0, 6);
  const container = getContainer();
  if (!container) return;
  const inputs = container.querySelectorAll<HTMLInputElement>('.otp-box');
  digits.split('').forEach((d, i) => {
    if (inputs[i]) inputs[i].value = d;
  });
  collectValue();
  const lastIndex = Math.min(digits.length, 6);
  if (inputs[lastIndex - 1]) {
    inputs[lastIndex - 1].focus();
  }
}

onMounted(() => {
  const first = getInput(1);
  if (first) first.focus();
});
</script>

<style scoped lang="scss">
.otp-input-group {
  display: flex;
  justify-content: center;
  gap: 8px;
  direction: ltr;
  margin: 8px 0;
}

.otp-box {
  width: 48px;
  height: 48px;
  text-align: center;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1.25rem;
  font-weight: 600;
  outline: none;
  padding: 0;
  background: #f7f8fa;
  color: #292d34;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
  font-family: 'Inter', monospace;
  caret-color: #7b68ee;

  &:focus {
    border-color: #7b68ee;
    box-shadow: 0 0 0 3px rgba(123, 104, 238, 0.1);
    background: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.has-error .otp-box {
  border-color: #e74c3c;
  animation: shake 0.4s ease;

  &:focus {
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

// ─── Dark Mode ──────────────────────────────────────────────
:global(body.dark-mode) {
  .otp-box {
    background: #2a2a3a;
    border-color: #3d3d50;
    color: #e2e8f0;

    &:focus {
      background: #33334a;
    }
  }
}
</style>
