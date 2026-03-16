import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { WindowItem, WindowId } from "./types";

type Props = {
  item: WindowItem;
  onUpdate: (id: WindowId, patch: Partial<WindowItem>) => void;
  onFocus: (id: WindowId) => void;
  onMinimize: (id: WindowId) => void;
  onClose: (id: WindowId) => void;
};

type DragState = {
  type: "move" | "resize";
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  originW: number;
  originH: number;
};

export function WindowFrame({
  item,
  onUpdate,
  onFocus,
  onMinimize,
  onClose
}: Props) {
  const dragRef = useRef<DragState | null>(null);

  const endDrag = () => {
    dragRef.current = null;
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
  };

  const handleMove = (event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.type === "move") {
      const nextX = drag.originX + (event.clientX - drag.startX);
      const nextY = drag.originY + (event.clientY - drag.startY);
      const maxX = window.innerWidth - 100;
      const maxY = window.innerHeight - 80;
      onUpdate(item.id, {
        x: Math.max(0, Math.min(nextX, maxX)),
        y: Math.max(0, Math.min(nextY, maxY))
      });
    } else {
      const nextW = drag.originW + (event.clientX - drag.startX);
      const nextH = drag.originH + (event.clientY - drag.startY);
      onUpdate(item.id, {
        w: Math.max(item.minW, nextW),
        h: Math.max(item.minH, nextH)
      });
    }
  };

  const handleUp = () => {
    endDrag();
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    onFocus(item.id);
    if (item.isMaximized) return;
    dragRef.current = {
      type: "move",
      startX: event.clientX,
      startY: event.clientY,
      originX: item.x,
      originY: item.y,
      originW: item.w,
      originH: item.h
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    onFocus(item.id);
    if (item.isMaximized) return;
    dragRef.current = {
      type: "resize",
      startX: event.clientX,
      startY: event.clientY,
      originX: item.x,
      originY: item.y,
      originW: item.w,
      originH: item.h
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  if (!item.isOpen || item.isMinimized) return null;

  const handleMaximize = () => {
    if (item.isMaximized && item.restoreBounds) {
      onUpdate(item.id, { ...item.restoreBounds, isMaximized: false });
      return;
    }
    const margin = 16;
    const topOffset = 72;
    const bottomOffset = 88;
    onUpdate(item.id, {
      restoreBounds: { x: item.x, y: item.y, w: item.w, h: item.h },
      x: margin,
      y: topOffset,
      w: window.innerWidth - margin * 2,
      h: window.innerHeight - topOffset - bottomOffset,
      isMaximized: true
    });
  };

  return (
    <div
      className={`os-window ${item.isMaximized ? "maximized" : ""}`}
      style={{
        left: item.x,
        top: item.y,
        width: item.w,
        height: item.h,
        zIndex: item.z
      }}
      onPointerDown={() => onFocus(item.id)}
    >
      <div className="os-window-titlebar" onPointerDown={startDrag}>
        <div className="os-window-title">
          <span>{item.icon}</span>
          <span>{item.title}</span>
        </div>
        <div className="os-window-actions">
          <button className="win-btn min" onClick={() => onMinimize(item.id)}>
            —
          </button>
          <button className="win-btn max" onClick={handleMaximize}>
            ▢
          </button>
          <button className="win-btn close" onClick={() => onClose(item.id)}>
            ×
          </button>
        </div>
      </div>
      <div className="os-window-content">{item.content}</div>
      <div className="os-window-resize" onPointerDown={startResize} />
    </div>
  );
}
