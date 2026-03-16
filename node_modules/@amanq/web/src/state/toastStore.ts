type Toast = {
  id: string;
  message: string;
};

let toasts: Toast[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function pushToast(message: string) {
  const toast: Toast = { id: `${Date.now()}-${Math.random()}`, message };
  toasts = [toast, ...toasts].slice(0, 5);
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== toast.id);
    emit();
  }, 4000);
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return toasts;
}
