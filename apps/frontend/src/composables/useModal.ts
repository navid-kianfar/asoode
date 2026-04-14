import { ref, shallowRef, markRaw, type Component } from 'vue';
import type { ModalParameters, PromptModalParameters } from '@asoode/shared';

import ConfirmModal from '@/components/modals/ConfirmModal.vue';
import PromptModal from '@/components/modals/PromptModal.vue';

interface ModalInstance {
  id: number;
  component: Component;
  props: Record<string, any>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

const modals = ref<ModalInstance[]>([]);
let nextId = 0;

export function useModal(): {
  modals: typeof modals;
  show: <T = any>(component: Component, data?: any, options?: any) => Promise<T>;
  confirm: (options: ModalParameters) => Promise<boolean>;
  alert: (options: ModalParameters) => Promise<void>;
  prompt: (options: PromptModalParameters) => Promise<any>;
  closeAll: () => void;
} {
  function show<T = any>(component: Component, data?: any, options?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      modals.value.push({
        id,
        component: markRaw(shallowRef(component) as any),
        props: { ...data, ...options },
        resolve: (val: any) => {
          modals.value = modals.value.filter((m) => m.id !== id);
          resolve(val);
        },
        reject: (reason?: any) => {
          modals.value = modals.value.filter((m) => m.id !== id);
          reject(reason);
        },
      });
    });
  }

  function confirm(options: ModalParameters): Promise<boolean> {
    return new Promise((resolve) => {
      const id = nextId++;
      modals.value.push({
        id,
        component: markRaw(ConfirmModal as any),
        props: {
          ...options,
          type: 'confirm',
          onConfirm: async () => {
            modals.value = modals.value.filter((m) => m.id !== id);
            resolve(true);
          },
          onCancel: async () => {
            modals.value = modals.value.filter((m) => m.id !== id);
            resolve(false);
          },
        },
        resolve: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }

  function alert(options: ModalParameters): Promise<void> {
    return new Promise((resolve) => {
      const id = nextId++;
      modals.value.push({
        id,
        component: markRaw(ConfirmModal as any),
        props: {
          ...options,
          type: 'alert',
          onConfirm: async () => {
            modals.value = modals.value.filter((m) => m.id !== id);
            resolve();
          },
        },
        resolve: () => resolve(),
        reject: () => resolve(),
      });
    });
  }

  function prompt(options: PromptModalParameters): Promise<any> {
    return new Promise((resolve) => {
      const id = nextId++;
      modals.value.push({
        id,
        component: markRaw(PromptModal as any),
        props: {
          ...options,
          type: 'prompt',
          onAction: async (params: any) => {
            modals.value = modals.value.filter((m) => m.id !== id);
            resolve(params);
          },
          onCancel: async () => {
            modals.value = modals.value.filter((m) => m.id !== id);
            resolve(null);
          },
        },
        resolve,
        reject: () => resolve(null),
      });
    });
  }

  function closeAll(): void {
    modals.value.forEach((m) => m.reject());
    modals.value = [];
  }

  return { modals, show, confirm, alert, prompt, closeAll };
}
