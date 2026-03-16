import { WindowFrame } from "./WindowFrame";
import { WindowItem, WindowId } from "./types";

type Props = {
  windows: WindowItem[];
  onUpdate: (id: WindowId, patch: Partial<WindowItem>) => void;
  onFocus: (id: WindowId) => void;
  onMinimize: (id: WindowId) => void;
  onClose: (id: WindowId) => void;
};

export function WindowManager({
  windows,
  onUpdate,
  onFocus,
  onMinimize,
  onClose
}: Props) {
  return (
    <div className="desktop-canvas">
      {windows
        .sort((a, b) => a.z - b.z)
        .map((item) => (
          <WindowFrame
            key={item.id}
            item={item}
            onUpdate={onUpdate}
            onFocus={onFocus}
            onMinimize={onMinimize}
            onClose={onClose}
          />
        ))}
    </div>
  );
}
