type Props = {
  server: {
    id: string;
    status: string;
    cpu: number;
    ram: number;
    latencyMs: number;
    lastSeenSec: number;
  };
};

export function ServerCard({ server }: Props) {
  const statusClass =
    server.status === "UP" ? "saved" : server.status === "DOWN" ? "queued" : "";
  const latencyTone =
    server.latencyMs < 80 ? "good" : server.latencyMs < 140 ? "warn" : "bad";
  return (
    <div className="panel server-card">
      <div className="server-card-header">
        <div className="window-title">
          <span>🖥️</span>
          <span>{server.id}</span>
        </div>
        <div className="server-status">
          <span className={`status-pill ${statusClass}`}>{server.status}</span>
          <span className={`latency-chip ${latencyTone}`}>
            {server.latencyMs} ms
          </span>
        </div>
      </div>
      <div className="metric-row">
        <span>CPU</span>
        <span>{server.cpu}%</span>
      </div>
      <div className="metric-bar">
        <span style={{ width: `${server.cpu}%` }} />
      </div>
      <div className="metric-row">
        <span>RAM</span>
        <span>{server.ram}%</span>
      </div>
      <div className="metric-bar">
        <span style={{ width: `${server.ram}%` }} />
      </div>
      <div className="metric-row">
        <span>Last Seen</span>
        <span>{server.lastSeenSec}s</span>
      </div>
    </div>
  );
}
