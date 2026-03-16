import { useLocation, useNavigate } from "react-router-dom";

export function Taskbar() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="taskbar">
      <button
        className={location.pathname === "/workspace" ? "primary" : ""}
        onClick={() => navigate("/workspace")}
      >
        Workspace
      </button>
      <button
        className={location.pathname === "/dashboard" ? "primary" : ""}
        onClick={() => navigate("/dashboard")}
      >
        Dashboard
      </button>
    </div>
  );
}
