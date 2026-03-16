type Props = {
  data: { t: string; rps: number }[];
};

const W = 280;
const H = 120;
const PAD = { top: 8, right: 8, bottom: 24, left: 8 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function buildLinePath(values: number[]): string {
  if (!values.length) return "";
  const max = Math.max(...values, 1);
  const step = CHART_W / Math.max(values.length - 1, 1);
  return values
    .map((v, i) => {
      const x = PAD.left + i * step;
      const y = PAD.top + CHART_H - (v / max) * CHART_H;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[]): string {
  const line = buildLinePath(values);
  if (!line) return "";
  const step = CHART_W / Math.max(values.length - 1, 1);
  const lastX = PAD.left + (values.length - 1) * step;
  const baseY = PAD.top + CHART_H;
  return `${line} L${lastX},${baseY} L${PAD.left},${baseY} Z`;
}

function buildGridPath(): string {
  const lines: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const y = PAD.top + (CHART_H / 4) * i;
    lines.push(`M${PAD.left},${y} L${PAD.left + CHART_W},${y}`);
  }
  for (let i = 1; i <= 4; i++) {
    const x = PAD.left + (CHART_W / 4) * i;
    lines.push(`M${x},${PAD.top} L${x},${PAD.top + CHART_H}`);
  }
  return lines.join(" ");
}

export function ThroughputChart({ data }: Props) {
  const values = data.map((d) => d.rps);
  const linePath = buildLinePath(values);
  const areaPath = buildAreaPath(values);
  const gridPath = buildGridPath();
  const current = values.length ? values[values.length - 1] : null;
  const trend = values.length >= 2 ? values[values.length - 1] - values[values.length - 2] : 0;

  return (
    <div className="dashboard-chart-panel throughput">
      <div className="dashboard-chart-header">
        <div>
          <h4>Throughput</h4>
          <span className="dashboard-chart-subtitle">requests per second</span>
        </div>
        <div className="dashboard-chart-badges">
          {current != null && (
            <span className="dashboard-chart-value">
              {typeof current === "number" && current % 1 !== 0 ? current.toFixed(1) : current}
              <span className="dashboard-chart-unit">rps</span>
            </span>
          )}
          <span className="dashboard-chart-live">Live</span>
        </div>
      </div>
      <div className="dashboard-chart-wrap">
        {values.length === 0 ? (
          <div className="dashboard-chart-empty">
            <span className="dashboard-chart-empty-icon">📈</span>
            <p>Collecting data...</p>
          </div>
        ) : (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none meet"
            className="dashboard-chart-svg"
          >
            <defs>
              <linearGradient id="throughputLineGrad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#7ee29e" />
                <stop offset="100%" stopColor="#63b3ff" />
              </linearGradient>
              <linearGradient id="throughputAreaGrad" x1="0" x2="0" y1="1" y2="0">
                <stop offset="0%" stopColor="#7ee29e" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#63b3ff" stopOpacity="0.05" />
              </linearGradient>
              <filter id="throughputGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d={gridPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <path d={areaPath} fill="url(#throughputAreaGrad)" />
            <path
              d={linePath}
              fill="none"
              stroke="url(#throughputLineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#throughputGlow)"
              className="dashboard-chart-line"
            />
          </svg>
        )}
      </div>
      {values.length > 0 && trend !== 0 && (
        <div className="dashboard-chart-footer">
          <span className={trend > 0 ? "up" : "down"}>
            {trend > 0 ? "↑" : "↓"} {typeof trend === "number" && trend % 1 !== 0 ? Math.abs(trend).toFixed(1) : Math.abs(trend)} rps
          </span>
        </div>
      )}
    </div>
  );
}
