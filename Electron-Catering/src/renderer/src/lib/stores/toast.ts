import { writable } from 'svelte/store';

export interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

function createToastStore() {
  const { subscribe, update } = writable<ToastItem[]>([]);
  let counter = 0;

  function push(type: ToastItem['type'], message: string) {
    const id = ++counter;
    update((items) => [...items, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }

  function dismiss(id: number) {
    update((items) => items.filter((t) => t.id !== id));
  }

  return {
    subscribe,
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    info: (message: string) => push('info', message),
    dismiss,
  };
}

export const toast = createToastStore();
