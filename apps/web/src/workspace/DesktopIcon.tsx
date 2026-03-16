type Props = {
  label: string;
  onClick?: () => void;
};

export function DesktopIcon({ label, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="desktop-icon"
    >
      <div style={{ fontSize: 24 }}>🗂️</div>
      <div style={{ fontSize: 12 }}>{label}</div>
    </div>
  );
}
