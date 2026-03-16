import { useState } from "react";
import { api } from "../api/client";
import { pushToast } from "../state/toastStore";

type Props = {
  simulateHighLoad?: boolean;
  onAction?: () => void;
};

export function QuickActionsPanel({ simulateHighLoad = false, onAction }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setLoading(key);
    try {
      await fn();
      onAction?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pushToast(`Action failed: ${msg}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="dashboard-chart-panel quick-actions">
      <div className="dashboard-chart-header">
        <div>
          <h4>Quick actions</h4>
          <span className="dashboard-chart-subtitle">
            Simulate load, kill/restore server, trigger backup
          </span>
        </div>
      </div>
      <div className="quick-actions-grid">
        <button
          type="button"
          className={`scenario-btn scenario-btn-toggle ${simulateHighLoad ? "active" : ""}`}
          disabled={loading !== null}
          onClick={() => run("highload", () => api.simulateHighLoad())}
          title={simulateHighLoad ? "Turn off high load" : "Simulate high CPU/RAM load"}
        >
          <span className="btn-icon" aria-hidden>🔥</span>
          <span className="btn-label">
            {loading === "highload" ? "…" : "Simulate High Load"}
            {simulateHighLoad && " (On)"}
          </span>
        </button>
        <button
          type="button"
          className="scenario-btn scenario-btn-danger"
          disabled={loading !== null}
          onClick={() => run("killS1", () => api.killServer("S1"))}
          title="Mark server S1 as DOWN"
        >
          <span className="btn-icon" aria-hidden>⚡</span>
          <span className="btn-label">{loading === "killS1" ? "…" : "Kill Server S1"}</span>
        </button>
        <button
          type="button"
          className="scenario-btn scenario-btn-danger"
          disabled={loading !== null}
          onClick={() => run("killS2", () => api.killServer("S2"))}
          title="Mark server S2 as DOWN"
        >
          <span className="btn-icon" aria-hidden>⚡</span>
          <span className="btn-label">{loading === "killS2" ? "…" : "Kill Server S2"}</span>
        </button>
        <button
          type="button"
          className="scenario-btn scenario-btn-restore"
          disabled={loading !== null}
          onClick={() => run("restoreS1", () => api.restoreServer("S1"))}
          title="Clear forced-down state for S1"
        >
          <span className="btn-icon" aria-hidden>🔄</span>
          <span className="btn-label">{loading === "restoreS1" ? "…" : "Restore S1"}</span>
        </button>
        <button
          type="button"
          className="scenario-btn scenario-btn-restore"
          disabled={loading !== null}
          onClick={() => run("restoreS2", () => api.restoreServer("S2"))}
          title="Clear forced-down state for S2"
        >
          <span className="btn-icon" aria-hidden>🔄</span>
          <span className="btn-label">{loading === "restoreS2" ? "…" : "Restore S2"}</span>
        </button>
        <button
          type="button"
          className="scenario-btn scenario-btn-success"
          disabled={loading !== null}
          onClick={() => run("backup", () => api.triggerBackup())}
          title="Trigger a backup run"
        >
          <span className="btn-icon" aria-hidden>✓</span>
          <span className="btn-label">{loading === "backup" ? "…" : "Trigger Backup"}</span>
        </button>
      </div>
    </div>
  );
}
