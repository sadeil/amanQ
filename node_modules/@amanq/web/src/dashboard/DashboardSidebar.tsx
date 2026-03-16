import { useNavigate } from "react-router-dom";
import { AmanQDrawnText } from "../components/AmanQDrawnText";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  sectionId?: string;
};

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: "▦", sectionId: "overview" },
  { id: "servers", label: "Servers", icon: "🖥", sectionId: "servers" },
  { id: "traffic", label: "Traffic & Backup", icon: "📊", sectionId: "traffic" },
  { id: "events", label: "Events", icon: "📋", sectionId: "events" },
  { id: "scenarios", label: "Scenarios", icon: "⚠", sectionId: "scenarios" },
  { id: "settings", label: "Settings", icon: "⚙", sectionId: "settings" }
];

type Props = {
  activeId: string;
  onSelect: (id: string, sectionId?: string) => void;
};

export function DashboardSidebar({ activeId, onSelect }: Props) {
  const navigate = useNavigate();

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-logo">
        <span className="dashboard-sidebar-logo-icon">◇</span>
        <span className="dashboard-sidebar-logo-text">
          <AmanQDrawnText />
        </span>
      </div>
      <nav className="dashboard-sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`dashboard-sidebar-item ${activeId === item.id ? "active" : ""}`}
            onClick={() => onSelect(item.id, item.sectionId)}
          >
            <span className="dashboard-sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="dashboard-sidebar-footer">
        <button
          type="button"
          className="dashboard-sidebar-item"
          onClick={() => navigate("/recovery")}
        >
          <span className="dashboard-sidebar-icon">↩</span>
          <span>Recovery</span>
        </button>
        <button
          type="button"
          className="dashboard-sidebar-item"
          onClick={() => navigate("/workspace")}
        >
          <span className="dashboard-sidebar-icon">←</span>
          <span>Back to Workspace</span>
        </button>
      </div>
    </aside>
  );
}
