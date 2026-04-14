import type { Directive } from 'vue';

export const onlyNumber: Directive = {
  mounted(el: HTMLElement) {
    const input = el.tagName === 'INPUT' ? el : el.querySelector('input');
    if (!input) return;

    input.addEventListener('keydown', (e: Event) => {
      const event = e as KeyboardEvent;
      const allowed = [
        'Backspace', 'Tab', 'Enter', 'Escape',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Delete', 'Home', 'End',
      ];
      if (
        allowed.includes(event.key) ||
        (event.key >= '0' && event.key <= '9') ||
        (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key))
      ) {
        return;
      }
      event.preventDefault();
    });
  },
};
