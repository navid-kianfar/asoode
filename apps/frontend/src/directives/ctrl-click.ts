import type { Directive } from 'vue';

export const ctrlClick: Directive = {
  mounted(el: HTMLElement, binding) {
    el.addEventListener('click', (e: MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof binding.value === 'function') {
          binding.value(e);
        }
      }
    });
  },
};
