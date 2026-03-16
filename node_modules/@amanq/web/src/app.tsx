import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { DesktopNotificationStack } from "./components/DesktopNotificationCard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TopBar } from "./components/TopBar";
import { ToastStack } from "./components/ToastStack";
import { IntroPage } from "./pages/IntroPage";

const WorkspacePage = lazy(() => import("./workspace/WorkspacePage").then((m) => ({ default: m.WorkspacePage })));
const ServerDesktopPage = lazy(() => import("./workspace/ServerDesktopPage").then((m) => ({ default: m.ServerDesktopPage })));
const DashboardPage = lazy(() => import("./dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const RecoveryPage = lazy(() => import("./pages/RecoveryPage").then((m) => ({ default: m.RecoveryPage })));

function PageFallback() {
  return (
    <div className="page-loading">
      <div className="page-loading-spinner" aria-hidden />
      <p className="page-loading-text">Loading…</p>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isIntro = location.pathname === "/";

  return (
    <ErrorBoundary>
      <div className="app-shell">
        {!isIntro && <TopBar />}
        <ToastStack />
        {!isIntro && <DesktopNotificationStack />}
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<IntroPage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="/server1" element={<ServerDesktopPage serverId="server1" />} />
            <Route path="/server2" element={<ServerDesktopPage serverId="server2" />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/recovery" element={<RecoveryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
