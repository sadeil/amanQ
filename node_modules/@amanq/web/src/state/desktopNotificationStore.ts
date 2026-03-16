export type DesktopNotificationAction = {
  label: string;
  onClick: () => void;
};

export type DesktopNotification = {
  id: string;
  title: string;
  message: string;
  actions?: DesktopNotificationAction[];
};

let notifications: DesktopNotification[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function addDesktopNotification(notification: Omit<DesktopNotification, "id">) {
  const id = `dn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  notifications = [{ ...notification, id }, ...notifications].slice(0, 10);
  emit();
  return id;
}

export function removeDesktopNotification(id: string) {
  notifications = notifications.filter((n) => n.id !== id);
  emit();
}

export function subscribeDesktopNotifications(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDesktopNotificationsSnapshot() {
  return notifications;
}
