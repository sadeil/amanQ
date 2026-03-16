import { useRef, useState, useCallback } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardContent } from "./DashboardContent";

export function DashboardLayout() {
  const [activeNavId, setActiveNavId] = useState("overview");
  const mainRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((sectionId: string | undefined) => {
    if (!sectionId || !mainRef.current) return;
    const el = mainRef.current.querySelector(`[data-section="${sectionId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleNavSelect = useCallback(
    (id: string, sectionId?: string) => {
      setActiveNavId(id);
      scrollToSection(sectionId);
    },
    [scrollToSection]
  );

  return (
    <div className="dashboard-split">
      <DashboardSidebar activeId={activeNavId} onSelect={handleNavSelect} />
      <div className="dashboard-main" ref={mainRef}>
        <DashboardContent
          activeSection={activeNavId}
          onSectionVisible={setActiveNavId}
        />
      </div>
    </div>
  );
}
