import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "../state/toastStore";

export function ToastStack() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot);
  if (!toasts.length) return null;
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  );
}
