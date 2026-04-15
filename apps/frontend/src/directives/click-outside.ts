import type { Directive } from 'vue';

export const clickOutside: Directive<HTMLElement & { _clickOutsideHandler?: (e: MouseEvent) => void }, (e: MouseEvent) => void> = {
  mounted(el, binding) {
    el._clickOutsideHandler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!el.contains(target)) {
        binding.value(e);
      }
    };
    // Use setTimeout to avoid catching the same click that opened the dropdown
    setTimeout(() => {
      document.addEventListener('mousedown', el._clickOutsideHandler!);
    }, 0);
  },
  unmounted(el) {
    if (el._clickOutsideHandler) {
      document.removeEventListener('mousedown', el._clickOutsideHandler);
    }
  },
};
