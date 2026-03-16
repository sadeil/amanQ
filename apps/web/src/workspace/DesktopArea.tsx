import { useNavigate } from "react-router-dom";
import { DesktopIcon } from "./DesktopIcon";

export function DesktopArea() {
  const navigate = useNavigate();
  return (
    <div className="panel desktop-area">
      <DesktopIcon label="File Explorer" />
      <DesktopIcon label="Editor" />
      <DesktopIcon label="Dashboard" onClick={() => navigate("/dashboard")} />
    </div>
  );
}
