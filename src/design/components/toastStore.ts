import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  /** Milliseconds before auto-dismiss; 0 keeps it until dismissed. */
  durationMs: number;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id' | 'durationMs'> & { durationMs?: number }) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;
const MAX_VISIBLE = 4;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    const toast: Toast = { durationMs: t.tone === 'danger' ? 8000 : 4500, ...t, id };
    set((s) => ({ toasts: [...s.toasts, toast].slice(-MAX_VISIBLE) }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Imperative helper usable outside React components. */
export const toast = {
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: 'info', title, description }),
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: 'success', title, description }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: 'warning', title, description }),
  danger: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: 'danger', title, description }),
};
