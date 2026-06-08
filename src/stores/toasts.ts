import { create } from "zustand";

const TOAST_MAX_AGE = 5000; // msec

interface Toast {
  key: string;
  title: string;
  text: string;
  variant?: "secondary" | "success" | "danger" | "warning";
  created: number;
}

interface ToastsStore {
  toasts: Toast[];
  addToast: (title: string, text: string, variant?: Toast["variant"]) => string;
  removeToast: (key: string) => void;
  removeExpiredToasts: () => void;
}

export const useToastsStore = create<ToastsStore>()((set, get) => ({
  toasts: [],
  addToast: (title, text, variant) => {
    const key = crypto.randomUUID();
    set({
      toasts: [
        ...get().toasts,
        {
          key,
          title,
          text,
          variant,
          created: Date.now(),
        },
      ],
    });
    return key;
  },
  removeToast: (key) => {
    set({
      toasts: get().toasts.filter((toast) => toast.key !== key),
    });
  },
  removeExpiredToasts: () => {
    const now = Date.now();
    set({
      toasts: get().toasts.filter(
        (toast) => now - toast.created < TOAST_MAX_AGE,
      ),
    });
  },
}));
