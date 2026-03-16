type Props = {
  backup?: {
    status: string;
    encryptionOk: boolean;
    signatureOk: boolean;
    pqReady: boolean;
  };
};

const statusConfig = [
  { key: "status", label: "Status", icon: "●", value: (b: Props["backup"]) => b?.status || "idle" },
  { key: "encryption", label: "Encryption", icon: "🔐", value: (b: Props["backup"]) => (b?.encryptionOk ? "OK" : "NO") },
  { key: "signature", label: "Signature", icon: "✱", value: (b: Props["backup"]) => (b?.signatureOk ? "OK" : "NO") },
  { key: "pqReady", label: "PQ Ready", icon: "◇", value: (b: Props["backup"]) => (b?.pqReady ? "YES" : "NO") }
];

function isOk(backup: Props["backup"], key: string): boolean {
  if (!backup) return false;
  if (key === "status") return backup.status === "done" || backup.status === "idle";
  if (key === "encryption") return backup.encryptionOk;
  if (key === "signature") return backup.signatureOk;
  if (key === "pqReady") return backup.pqReady;
  return false;
}

export function BackupSecurityPanel({ backup }: Props) {
  return (
    <div className="dashboard-chart-panel backup">
      <div className="dashboard-chart-header">
        <div>
          <h4>Backup & Security</h4>
          <span className="dashboard-chart-subtitle">Snapshot pipeline</span>
        </div>
        <span className="dashboard-chart-badge-shield">Protected</span>
      </div>
      <div className="backup-status-grid">
        {statusConfig.map(({ key, label, icon, value }) => (
          <div key={key} className={`backup-status-item ${isOk(backup, key) ? "ok" : "warn"}`}>
            <span className="backup-status-icon">{icon}</span>
            <div className="backup-status-content">
              <span className="backup-status-label">{label}</span>
              <span className="backup-status-value">{value(backup)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
