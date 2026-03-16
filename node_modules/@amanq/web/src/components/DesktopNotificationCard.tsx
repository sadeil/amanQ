import { useEffect, useState } from "react";
import {
  getDesktopNotificationsSnapshot,
  removeDesktopNotification,
  subscribeDesktopNotifications,
  type DesktopNotification
} from "../state/desktopNotificationStore";

function SingleCard({
  notification,
  onDismiss
}: {
  notification: DesktopNotification;
  onDismiss: () => void;
}) {
  return (
    <div className="desktop-notification-card">
      <div className="desktop-notification-card-header">
        <span className="desktop-notification-card-icon">🔔</span>
        <span className="desktop-notification-card-title">{notification.title}</span>
        <button
          type="button"
          className="desktop-notification-card-close"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <div className="desktop-notification-card-message">{notification.message}</div>
      {notification.actions && notification.actions.length > 0 && (
        <div className="desktop-notification-card-actions">
          {notification.actions.map((action, i) => (
            <button
              key={i}
              type="button"
              className={
                i === 0
                  ? "desktop-notification-card-btn primary"
                  : "desktop-notification-card-btn"
              }
              onClick={() => {
                action.onClick();
                onDismiss();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DesktopNotificationStack() {
  const [items, setItems] = useState<DesktopNotification[]>(() =>
    getDesktopNotificationsSnapshot()
  );

  useEffect(() => {
    const unsub = subscribeDesktopNotifications(() => {
      setItems(getDesktopNotificationsSnapshot());
    });
    return () => {
      unsub();
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="desktop-notification-stack">
      {items.map((notification) => (
        <SingleCard
          key={notification.id}
          notification={notification}
          onDismiss={() => removeDesktopNotification(notification.id)}
        />
      ))}
    </div>
  );
}
