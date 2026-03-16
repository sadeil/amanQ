import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { pushToast } from "../state/toastStore";
import { AmanQDrawnText } from "./AmanQDrawnText";

export function TopBar() {
  const [mode, setMode] = useState<"baseline" | "optimized">("baseline");
  const [connected, setConnected] = useState(false);
  const [appName, setAppName] = useState<string>("AmanQ");
  const navigate = useNavigate();

  useEffect(() => {
    api.getConfig().then((c) => c.appName && setAppName(c.appName)).catch(() => null);
  }, []);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        await api.health();
        if (mounted) setConnected(true);
      } catch {
        if (mounted) setConnected(false);
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    api
      .getState()
      .then((state) => setMode(state.mode))
      .catch(() => null);
  }, []);

  const toggleMode = async () => {
    const next = mode === "baseline" ? "optimized" : "baseline";
    try {
      await api.setMode(next);
      setMode(next);
      pushToast(`Mode switched to ${next}`);
    } catch {
      pushToast("Unable to switch mode");
    }
  };

  return (
    <div className="top-bar">
      <div className="top-bar-brand">
        <span className="top-bar-logo-icon" aria-hidden>◇</span>
        <span className="top-bar-logo-text">
          <AmanQDrawnText />
        </span>
        {appName && appName !== "AmanQ" && (
          <span className="top-bar-app-name">{appName}</span>
        )}
        <span className="top-bar-subtitle">AmanQ Demo OS</span>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div className="toolbar">
          <button onClick={() => navigate("/workspace")}>Workspace</button>
          <button onClick={() => navigate("/server1")}>S1 Desktop</button>
          <button onClick={() => navigate("/server2")}>S2 Desktop</button>
          <button onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button onClick={() => navigate("/recovery")}>Recovery</button>
        </div>
        <button className="badge" onClick={toggleMode}>
          Mode: {mode}
        </button>
        <span className="badge">
          <span
            className={`status-dot ${connected ? "online" : "offline"}`}
          />
          {connected ? "Controller Online" : "Controller Offline"}
        </span>
      </div>
    </div>
  );
}
