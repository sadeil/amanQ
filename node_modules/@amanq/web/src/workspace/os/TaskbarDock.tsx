import { useEffect, useState } from "react";
import { WindowId, WindowItem } from "./types";

type Props = {
  windows: WindowItem[];
  onSelect: (id: WindowId) => void;
  controllerState?: any;
};

export function TaskbarDock({ windows, onSelect, controllerState }: Props) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="taskbar-dock">
      <button className="taskbar-start">
        <span className="taskbar-icon">🪟</span>
        Start
      </button>
      <div className="taskbar-windows">
        {windows.filter((win) => win.isOpen).map((win) => (
          <button
            key={win.id}
            className={`taskbar-btn ${
              win.isOpen && !win.isMinimized ? "active" : ""
            }`}
            onClick={() => onSelect(win.id)}
          >
            <span className="taskbar-icon">{win.icon}</span>
            {win.title}
          </button>
        ))}
      </div>
      <div className="taskbar-status">
        {(controllerState?.servers || []).map((server: any) => (
          <span
            key={server.id}
            className={`status-chip ${server.status === "UP" ? "ok" : "down"}`}
          >
            {server.id}: {server.status}
          </span>
        ))}
      </div>
      <div className="taskbar-clock">
        {time.toLocaleTimeString()}
      </div>
    </div>
  );
}
