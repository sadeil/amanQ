type Props = {
  state: any;
};

export function ControllerConsole({ state }: Props) {
  const traffic = state?.trafficShare || [];
  return (
    <div className="panel os-console">
      <h4>Controller Status</h4>
      <p>Mode: {state?.mode || "baseline"}</p>
      <p>Avg Latency: {state?.avgLatencyMs ?? 0} ms</p>
      <p>Total RPS: {state?.totalRps ?? 0}</p>
      <p>Backup: {state?.backup?.status || "idle"}</p>
      <div style={{ marginTop: 10 }}>
        <strong>Traffic Share</strong>
        {traffic.map((item: any) => (
          <div key={item.serverId} style={{ marginTop: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{item.serverId}</span>
              <span>{item.pct}%</span>
            </div>
            <div className="chart-bar">
              <span style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
