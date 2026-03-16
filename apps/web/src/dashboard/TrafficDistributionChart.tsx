type Props = {
  data: { serverId: string; pct: number }[];
};

const SERVER_COLORS = [
  { from: "#63b3ff", to: "#7ee29e" },
  { from: "#a855f7", to: "#63b3ff" }
];

export function TrafficDistributionChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.pct, 0) || 1;
  const normalized = data.map((d) => ({ ...d, pct: (d.pct / total) * 100 }));

  return (
    <div className="dashboard-chart-panel traffic">
      <div className="dashboard-chart-header">
        <div>
          <h4>Traffic Distribution</h4>
          <span className="dashboard-chart-subtitle">Load share per node</span>
        </div>
        <span className="dashboard-chart-live">Live</span>
      </div>
      <div className="dashboard-chart-wrap traffic-bars">
        {normalized.length === 0 ? (
          <div className="dashboard-chart-empty">
            <span className="dashboard-chart-empty-icon">⇄</span>
            <p>Waiting for traffic...</p>
          </div>
        ) : (
          <div className="traffic-stack">
            <div className="traffic-stack-bar">
              {normalized.map((item, i) => (
                <div
                  key={item.serverId}
                  className="traffic-stack-segment"
                  style={{
                    width: `${item.pct}%`,
                    background: `linear-gradient(90deg, ${SERVER_COLORS[i % 2].from}, ${SERVER_COLORS[i % 2].to})`,
                    boxShadow: `0 0 20px ${SERVER_COLORS[i % 2].from}40`
                  }}
                  title={`${item.serverId}: ${item.pct.toFixed(0)}%`}
                />
              ))}
            </div>
            <div className="traffic-legend">
              {normalized.map((item, i) => (
                <div key={item.serverId} className="traffic-legend-item">
                  <span
                    className="traffic-legend-dot"
                    style={{
                      background: `linear-gradient(135deg, ${SERVER_COLORS[i % 2].from}, ${SERVER_COLORS[i % 2].to})`
                    }}
                  />
                  <span className="traffic-legend-label">{item.serverId}</span>
                  <span className="traffic-legend-pct">{item.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
