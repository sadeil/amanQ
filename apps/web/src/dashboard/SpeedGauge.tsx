import { useEffect, useMemo, useState } from "react";

type Props = {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  deviceId: string;
  /** Add fake movement (periodic drift) so the gauge feels live. Default true. */
  fakeMovement?: boolean;
};

const RADIUS = 80;
const STROKE = 12;
const VIEW_SIZE = 200;
const HALF_CIRCLE_LENGTH = Math.PI * RADIUS;
const DRIFT_INTERVAL_MS = 1800;
const DRIFT_AMOUNT = 6;

export function SpeedGauge({
  value,
  max = 100,
  label,
  unit = "Mbps",
  deviceId,
  fakeMovement = true
}: Props) {
  const safeMax = Math.max(1, Number(max) || 100);
  const baseValue = Number.isFinite(Number(value)) ? Number(value) : 0;

  const [displayValue, setDisplayValue] = useState(baseValue);

  useEffect(() => {
    setDisplayValue(baseValue);
  }, [baseValue]);

  useEffect(() => {
    if (!fakeMovement) return;
    const id = setInterval(() => {
      const drift = (Math.random() - 0.5) * 2 * DRIFT_AMOUNT;
      setDisplayValue((prev) => {
        const next = baseValue + drift;
        const clamped = Math.max(0, Math.min(safeMax, next));
        return Math.round(clamped * 10) / 10;
      });
    }, DRIFT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fakeMovement, baseValue, safeMax]);

  const safeValue = displayValue;
  const normalized = useMemo(
    () => Math.max(0, Math.min(1, safeValue / safeMax)),
    [safeValue, safeMax]
  );

  // Arc: 0% = left (180°), 100% = right (0°). Path drawn left → right for correct fill.
  const describeArc = (startAngle: number, endAngle: number) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;
    const cx = VIEW_SIZE / 2;
    const cy = VIEW_SIZE / 2;
    const x1 = cx + RADIUS * Math.cos(start);
    const y1 = cy + RADIUS * Math.sin(start);
    const x2 = cx + RADIUS * Math.cos(end);
    const y2 = cy + RADIUS * Math.sin(end);
    const large = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${x2} ${y2}`;
  };

  const trackPath = describeArc(180, 0);
  const fillDashOffset = HALF_CIRCLE_LENGTH * (1 - normalized);

  const handleAngleDeg = 180 - normalized * 180;
  const handleAngleRad = (handleAngleDeg * Math.PI) / 180;
  const handleX = VIEW_SIZE / 2 + RADIUS * Math.cos(handleAngleRad);
  const handleY = VIEW_SIZE / 2 + RADIUS * Math.sin(handleAngleRad);

  return (
    <div className="speed-gauge-card" data-device={deviceId}>
      <div className="speed-gauge-header">
        <span className="speed-gauge-device">Device {deviceId}</span>
        <span className="speed-gauge-date">
          {new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          })}{" "}
          {new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </span>
      </div>
      <div className="speed-gauge-wrap">
        <svg
          className="speed-gauge-svg"
          viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
          aria-hidden
        >
          <path
            className="speed-gauge-track"
            d={trackPath}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          <path
            className="speed-gauge-fill"
            d={trackPath}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={String(HALF_CIRCLE_LENGTH)}
            strokeDashoffset={String(fillDashOffset)}
            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
          <circle
            className="speed-gauge-handle"
            cx={handleX}
            cy={handleY}
            r={10}
            style={{
              transition: "cx 0.6s cubic-bezier(0.22, 1, 0.36, 1), cy 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
            }}
          />
          <circle
            className="speed-gauge-handle-inner"
            cx={handleX}
            cy={handleY}
            r={6}
            style={{
              transition: "cx 0.6s cubic-bezier(0.22, 1, 0.36, 1), cy 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
            }}
          />
        </svg>
        <div className="speed-gauge-label">{label}</div>
        <div className="speed-gauge-value">
          {Math.round(Number.isFinite(safeValue) ? safeValue : 0)} <span className="speed-gauge-unit">{unit}</span>
        </div>
      </div>
    </div>
  );
}
