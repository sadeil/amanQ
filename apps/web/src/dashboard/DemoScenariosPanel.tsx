import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { pushToast } from "../state/toastStore";
import { clearAllDrafts, clearQueue } from "../workspace/recovery/useDraftStore";

export type ScenarioType = "shutdown" | "lose-data";
export type ServerId = "S1" | "S2";

export type ScenarioResult = {
  type: ScenarioType;
  servers: ServerId[];
  backend?: { S1?: boolean; S2?: boolean; errors: string[] };
};

type Props = {
  onScenarioDone: (result: ScenarioResult) => void;
};

export function DemoScenariosPanel({ onScenarioDone }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"shutdown" | "lose-data" | null>(null);
  const [loadingTarget, setLoadingTarget] = useState<ServerId[] | null>(null);

  const runShutdown = async (servers: ServerId[]) => {
    setLoading("shutdown");
    setLoadingTarget(servers);
    try {
      const backend = await api.wipeServers(servers);
      await clearAllDrafts();
      await clearQueue();
      onScenarioDone({ type: "shutdown", servers, backend });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pushToast(`Shutdown failed: ${msg}`);
    } finally {
      setLoading(null);
      setLoadingTarget(null);
    }
  };

  const runLoseData = async (servers: ServerId[]) => {
    setLoading("lose-data");
    setLoadingTarget(servers);
    try {
      const backend = await api.wipeServers(servers);
      onScenarioDone({ type: "lose-data", servers, backend });
      const first = servers[0];
      const path = first === "S1" ? "/server1" : "/server2";
      navigate(path, { state: { dataLost: true } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pushToast(`Wipe failed: ${msg}`);
    } finally {
      setLoading(null);
      setLoadingTarget(null);
    }
  };

  const busy = loading !== null;
  const label = (servers: ServerId[], action: "shutdown" | "lose-data") => {
    if (loading !== action || !loadingTarget) return null;
    const same = servers.length === loadingTarget.length && servers.every((s) => loadingTarget.includes(s));
    return same ? "…" : null;
  };

  return (
    <div className="dashboard-chart-panel scenarios">
      <div className="dashboard-chart-header">
        <div>
          <h4>Demo scenarios</h4>
          <span className="dashboard-chart-subtitle">
            Shutdown: wipes server and clears drafts. Lose data: wipes server only; drafts kept for recovery.
          </span>
        </div>
      </div>
      <div className="scenarios-actions">
        <div className="scenario-block">
          <h5 className="scenario-block-title">Shutdown server & delete all data</h5>
          <p className="scenario-hint">
            Wipes chosen server(s) and clears local drafts. Unsaved work is lost unless you had already re-opened and recovered.
          </p>
          <div className="scenario-buttons">
            <button
              type="button"
              className="scenario-btn scenario-btn-danger"
              disabled={busy}
              onClick={() => runShutdown(["S1"])}
            >
              {label(["S1"], "shutdown") ?? "On S1 only"}
            </button>
            <button
              type="button"
              className="scenario-btn scenario-btn-danger"
              disabled={busy}
              onClick={() => runShutdown(["S2"])}
            >
              {label(["S2"], "shutdown") ?? "On S2 only"}
            </button>
            <button
              type="button"
              className="scenario-btn scenario-btn-danger"
              disabled={busy}
              onClick={() => runShutdown(["S1", "S2"])}
            >
              {label(["S1", "S2"], "shutdown") ?? "On both"}
            </button>
          </div>
        </div>
        <div className="scenario-block">
          <h5 className="scenario-block-title">Lose server data</h5>
          <p className="scenario-hint">
            Wipes server storage. Local drafts are kept — open the desktop to see a recovery notification and recover your work.
          </p>
          <div className="scenario-buttons">
            <button
              type="button"
              className="scenario-btn scenario-btn-warn"
              disabled={busy}
              onClick={() => runLoseData(["S1"])}
            >
              {label(["S1"], "lose-data") ?? "On S1 only"}
            </button>
            <button
              type="button"
              className="scenario-btn scenario-btn-warn"
              disabled={busy}
              onClick={() => runLoseData(["S2"])}
            >
              {label(["S2"], "lose-data") ?? "On S2 only"}
            </button>
            <button
              type="button"
              className="scenario-btn scenario-btn-warn"
              disabled={busy}
              onClick={() => runLoseData(["S1", "S2"])}
            >
              {label(["S1", "S2"], "lose-data") ?? "On both"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
