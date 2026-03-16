import { useEffect, useState } from "react";
import { api } from "../api/client";
import { ServerCard } from "./ServerCard";
import { TrafficDistributionChart } from "./TrafficDistributionChart";
import { SpeedGauge } from "./SpeedGauge";
import { LatencyChart } from "./LatencyChart";
import { ThroughputChart } from "./ThroughputChart";
import { BackupSecurityPanel } from "./BackupSecurityPanel";
import { EventLogTable } from "./EventLogTable";
import { DemoScenariosPanel } from "./DemoScenariosPanel";
import { QuickActionsPanel } from "./QuickActionsPanel";
import type { ScenarioResult } from "./DemoScenariosPanel";
import { DataLossModal } from "../workspace/recovery/DataLossModal";

type Props = {
  activeSection?: string;
  onSectionVisible?: (id: string) => void;
};

/** Looks like a healthy system so the dashboard can be shown without a running controller. */
const FAKE_HEALTHY_STATE = {
  servers: [
    { id: "S1", status: "UP", speedMbps: 72, cpu: 34, ram: 52, latencyMs: 24, lastSeenSec: 2 },
    { id: "S2", status: "UP", speedMbps: 68, cpu: 28, ram: 48, latencyMs: 31, lastSeenSec: 1 }
  ] as any[],
  mode: "baseline",
  backup: { status: "idle" as const },
  trafficShare: [
    { serverId: "S1", pct: 54 },
    { serverId: "S2", pct: 46 }
  ] as any[],
  avgLatencyMs: 28,
  totalRps: 256,
  simulateHighLoad: false
};

const INITIAL_STATE = FAKE_HEALTHY_STATE;

function fakeLatencyPoints(): { t: string; ms: number }[] {
  const base = 24;
  return Array.from({ length: 14 }, (_, i) => ({
    t: new Date(Date.now() - (13 - i) * 5000).toISOString(),
    ms: Math.round(base + (Math.random() - 0.5) * 10)
  }));
}
function fakeThroughputPoints(): { t: string; rps: number }[] {
  const base = 220;
  return Array.from({ length: 14 }, (_, i) => ({
    t: new Date(Date.now() - (13 - i) * 5000).toISOString(),
    rps: Math.round(base + (Math.random() - 0.5) * 80)
  }));
}
const FAKE_METRICS = {
  latency: fakeLatencyPoints(),
  throughput: fakeThroughputPoints()
};
function fakeEvents(): { id: string; time: string; type: string; server?: string; details: string }[] {
  const t = new Date();
  return [
    { id: "e1", time: new Date(t.getTime() - 120000).toISOString(), type: "backup", details: "Vault snapshot completed" },
    { id: "e2", time: new Date(t.getTime() - 90000).toISOString(), type: "health", server: "S1", details: "Node healthy" },
    { id: "e3", time: new Date(t.getTime() - 60000).toISOString(), type: "health", server: "S2", details: "Node healthy" },
    { id: "e4", time: new Date(t.getTime() - 30000).toISOString(), type: "traffic", details: "Traffic within normal range" }
  ];
}

export function DashboardContent({ onSectionVisible }: Props) {
  const [state, setState] = useState<any>(INITIAL_STATE);
  const [metrics, setMetrics] = useState<any>(null);
  const [events, setEvents] = useState<any[]>(() => fakeEvents());
  const [dataLossModal, setDataLossModal] = useState<ScenarioResult | null>(null);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const s = await api.getState();
        if (!mounted) return;
        setState(s);
      } catch {
        if (!mounted) return;
        setState((prev: any) => prev ?? INITIAL_STATE);
      }
      try {
        const [m, e] = await Promise.all([api.getMetrics(), api.getEvents()]);
        if (!mounted) return;
        setMetrics(m);
        setEvents(e);
      } catch {
        // keep previous metrics/events
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const handleSync = () => {
    api.getState().then(setState).catch(() => {});
    api.getMetrics().then(setMetrics).catch(() => {});
    api.getEvents().then(setEvents).catch(() => {});
  };

  const upCount = (state?.servers || []).filter((s: any) => s.status === "UP").length;
  const nodeCount = (state?.servers || []).length;

  return (
    <>
      <header className="dashboard-header">
        <div className="dashboard-header-status">
          <span className="dashboard-header-status-item" title={nodeCount === 0 ? "Run: npm run dev:controller" : ""}>
            <span className={`status-dot ${nodeCount > 0 ? "online" : "offline"}`} />
            {nodeCount > 0 ? "System Online" : "Controller offline"}
          </span>
          <span className="dashboard-header-status-item">
            <span className="dashboard-header-icon">◇</span>
            {nodeCount} nodes · {state?.mode || "baseline"}
          </span>
        </div>
        <div className="dashboard-header-actions">
          <button type="button" className="dashboard-header-btn" onClick={handleSync}>
            <span>↻</span> Sync Now
          </button>
          <button type="button" className="dashboard-header-avatar" aria-label="User">
            <span>AQ</span>
          </button>
        </div>
      </header>

      {nodeCount === 0 && (
        <div className="dashboard-offline-hint">
          Start the controller in another terminal: <code>npm run dev:controller</code>
          <br />
          <span style={{ opacity: 0.9, fontSize: 12 }}>
            If the controller started on a different port (e.g. 5001), set{" "}
            <code>VITE_CONTROLLER_URL=http://localhost:PORT</code> and restart the web app.
          </span>
        </div>
      )}

      <div className="dashboard-main-inner">
        <section data-section="overview" className="dashboard-hero-section">
          <div className="dashboard-hero">
            <div>
              <h1 className="dashboard-hero-title">Smart System Dashboard</h1>
              <p className="dashboard-hero-subtitle">
                Welcome back! Here’s your system overview for today.
              </p>
            </div>
            <div className="dashboard-hero-pill">
              <strong>{state?.mode || "baseline"}</strong> mode
            </div>
          </div>

          <div className="dashboard-banner">
            <span className="dashboard-banner-badge">◇ AmanQ</span>
            <p className="dashboard-banner-text">
              Live telemetry, traffic routing, and backup state — all in one place.
            </p>
            <a href="/workspace" className="dashboard-banner-cta">
              Open Workspace →
            </a>
          </div>

          <div className="dashboard-overview-cards">
            <div className="dashboard-overview-card">
              <div className="dashboard-overview-card-icon latency">
                <span>⚡</span>
              </div>
              <h4>Avg Latency</h4>
              <p className="dashboard-overview-value">{state?.avgLatencyMs ?? 0} ms</p>
              <span className="dashboard-overview-change up">Target &lt; 120ms</span>
              <span className="dashboard-overview-dot" />
            </div>
            <div className="dashboard-overview-card alert">
              <div className="dashboard-overview-card-icon rps">
                <span>📈</span>
              </div>
              <h4>Total RPS</h4>
              <p className="dashboard-overview-value">{state?.totalRps ?? 0}</p>
              <span className="dashboard-overview-change">Rolling 60s</span>
              <span className="dashboard-overview-dot active" />
            </div>
            <div className="dashboard-overview-card">
              <div className="dashboard-overview-card-icon backup">
                <span>🛡</span>
              </div>
              <h4>Backup</h4>
              <p className="dashboard-overview-value">{state?.backup?.status || "idle"}</p>
              <span className="dashboard-overview-change">Vault OK</span>
            </div>
            <div className="dashboard-overview-card">
              <div className="dashboard-overview-card-icon nodes">
                <span>🖥</span>
              </div>
              <h4>Nodes</h4>
              <p className="dashboard-overview-value">{upCount}/{nodeCount}</p>
              <span className="dashboard-overview-change">Online</span>
              <span className="dashboard-overview-dot online" />
            </div>
          </div>

          <div className="dashboard-section-head" style={{ marginTop: 8 }}>
            <h2>Connection speed</h2>
            <span className="dashboard-section-sub">Internet speed per device</span>
          </div>
          <div className="speed-gauges-row">
            {(state?.servers?.length ? state.servers : [{ id: "S1", status: "DOWN", speedMbps: 0 }, { id: "S2", status: "DOWN", speedMbps: 0 }]).map(
              (server: { id: string; status?: string; speedMbps?: number }) => (
                <SpeedGauge
                  key={server.id}
                  deviceId={String(server.id)}
                  value={Number(server.speedMbps) || 0}
                  max={100}
                  label="Download speed"
                  unit="Mbps"
                />
              )
            )}
          </div>
        </section>

        <section data-section="servers" className="dashboard-section-block">
          <div className="dashboard-section-head">
            <h2>Node Map</h2>
            <span className="dashboard-section-sub">Health and routing</span>
          </div>
          <div className="dashboard-node-map">
            {(state?.servers || []).map((server: any) => (
              <div
                key={server.id}
                className={`dashboard-node-map-item ${server.status === "UP" ? "up" : "down"}`}
              >
                <span className="dashboard-node-map-icon">🖥</span>
                <span className="dashboard-node-map-label">{server.id}</span>
                <span className="dashboard-node-map-pct">
                  {server.status === "UP" ? `${server.cpu ?? 0}%` : "—"}
                </span>
              </div>
            ))}
          </div>

          <div className="dashboard-section-head">
            <h2>Servers</h2>
            <span className="dashboard-section-sub">CPU, RAM, latency</span>
          </div>
          <div className="server-grid">
            {(state?.servers || []).map((server: any) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        </section>

        <section data-section="traffic" className="dashboard-section-block">
          <div className="dashboard-section-head">
            <h2>Traffic &amp; Backup</h2>
            <span className="dashboard-section-sub">Live charts and security</span>
          </div>
          <div className="dashboard-chart-hero">
            <LatencyChart data={metrics?.latency ?? FAKE_METRICS.latency} />
            <ThroughputChart data={metrics?.throughput ?? FAKE_METRICS.throughput} />
          </div>
          <div className="dashboard-grid">
            <TrafficDistributionChart data={state?.trafficShare || []} />
            <BackupSecurityPanel backup={state?.backup} />
          </div>
        </section>

        <section data-section="events" className="dashboard-section-block">
          <div className="dashboard-section-head">
            <h2>Events</h2>
            <span className="dashboard-section-sub">Failovers and backups</span>
          </div>
          <div className="panel dashboard-log">
            <EventLogTable events={events} />
          </div>
        </section>

        <section data-section="scenarios" className="dashboard-section-block">
          <div className="dashboard-section-head">
            <h2>Quick actions</h2>
            <span className="dashboard-section-sub">Simulate load, failover, backup</span>
          </div>
          <QuickActionsPanel
            simulateHighLoad={state?.simulateHighLoad}
            onAction={handleSync}
          />
          <div className="dashboard-section-head" style={{ marginTop: 24 }}>
            <h2>Demo scenarios</h2>
            <span className="dashboard-section-sub">Simulate shutdown & data loss</span>
          </div>
          <DemoScenariosPanel onScenarioDone={setDataLossModal} />
        </section>

        <section data-section="settings" className="dashboard-section-block">
          <div className="dashboard-section-head">
            <h2>Settings</h2>
            <span className="dashboard-section-sub">Controller and nodes</span>
          </div>
          <div className="panel">
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
              Configure controller URL and node endpoints in your environment or app settings.
            </p>
          </div>
        </section>
      </div>

      {dataLossModal && (
        <DataLossModal
          type={dataLossModal.type}
          servers={dataLossModal.servers}
          backend={dataLossModal.backend}
          onClose={() => setDataLossModal(null)}
        />
      )}
    </>
  );
}
