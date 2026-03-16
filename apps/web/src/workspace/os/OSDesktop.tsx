import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileExplorerWindow } from "../FileExplorerWindow";
import { DocumentEditorWindow } from "../DocumentEditorWindow";
import {
  DesktopIconGrid,
  TaskbarDock,
  WindowManager,
  ControllerConsole,
  ServerConsole,
  DashboardWindow,
  type WindowItem,
  type WindowId
} from "./index";
import { api } from "../../api/client";
import { addDesktopNotification } from "../../state/desktopNotificationStore";
import { getAllDrafts, type Draft } from "../recovery/useDraftStore";

const SERVER_DISMISSED_KEY = "amanq-server-down-dismissed";

function getServerDismissedKey(serverContext: string) {
  return `${SERVER_DISMISSED_KEY}-${serverContext}`;
}

type FileMeta = {
  id: string;
  name: string;
  ext: string;
};

const baseWindows: WindowItem[] = [
  {
    id: "explorer",
    title: "File Explorer",
    icon: "📁",
    content: null,
    x: 80,
    y: 140,
    w: 360,
    h: 420,
    minW: 280,
    minH: 260,
    z: 1,
    isOpen: true,
    isMinimized: false,
    isMaximized: false,
    restoreBounds: null
  },
  {
    id: "editor",
    title: "Document Editor",
    icon: "📝",
    content: null,
    x: 480,
    y: 160,
    w: 520,
    h: 420,
    minW: 360,
    minH: 300,
    z: 2,
    isOpen: true,
    isMinimized: false,
    isMaximized: false,
    restoreBounds: null
  },
  {
    id: "controller",
    title: "Controller Console",
    icon: "🧭",
    content: null,
    x: 120,
    y: 580,
    w: 360,
    h: 260,
    minW: 300,
    minH: 220,
    z: 3,
    isOpen: true,
    isMinimized: false,
    isMaximized: false,
    restoreBounds: null
  },
  {
    id: "server1",
    title: "S1 Console",
    icon: "🖥️",
    content: null,
    x: 520,
    y: 600,
    w: 280,
    h: 240,
    minW: 260,
    minH: 220,
    z: 4,
    isOpen: true,
    isMinimized: false,
    isMaximized: false,
    restoreBounds: null
  },
  {
    id: "server2",
    title: "S2 Console",
    icon: "🖥️",
    content: null,
    x: 820,
    y: 600,
    w: 280,
    h: 240,
    minW: 260,
    minH: 220,
    z: 5,
    isOpen: true,
    isMinimized: false,
    isMaximized: false,
    restoreBounds: null
  },
  {
    id: "dashboard",
    title: "Monitoring Dashboard",
    icon: "📊",
    content: null,
    x: 1080,
    y: 160,
    w: 520,
    h: 520,
    minW: 420,
    minH: 360,
    z: 6,
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    restoreBounds: null
  }
];

function buildInitialWindows(
  initialOpenIds?: WindowId[],
  initialFocusId?: WindowId
) {
  const openSet = initialOpenIds ? new Set(initialOpenIds) : null;
  const windows = baseWindows.map((win, index) => ({
    ...win,
    isOpen: openSet ? openSet.has(win.id) : win.isOpen,
    isMinimized: false,
    isMaximized: false,
    restoreBounds: null,
    z: index + 1
  }));
  if (initialFocusId) {
    const maxZ = Math.max(...windows.map((w) => w.z));
    return windows.map((w) =>
      w.id === initialFocusId ? { ...w, z: maxZ + 1, isOpen: true } : w
    );
  }
  return windows;
}

type Props = {
  initialOpenIds?: WindowId[];
  initialFocusId?: WindowId;
  visibleWindowIds?: WindowId[];
  serverContext?: "S1" | "S2";
  initialDataLost?: boolean;
};

export function OSDesktop({
  initialOpenIds,
  initialFocusId,
  visibleWindowIds,
  serverContext,
  initialDataLost
}: Props) {
  const [selectedFile, setSelectedFile] = useState<FileMeta | null>(null);
  const [windows, setWindows] = useState<WindowItem[]>(
    buildInitialWindows(initialOpenIds, initialFocusId)
  );
  const [controllerState, setControllerState] = useState<any>(null);
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [reopenLoading, setReopenLoading] = useState(false);

  const servers = controllerState?.servers || [];
  const hasControllerData = controllerState != null && Array.isArray(servers) && servers.length > 0;
  const norm = (id: string) => String(id || "").trim().toUpperCase();
  const isServerDown =
    serverContext &&
    hasControllerData &&
    servers.some(
      (s: { id: string; status: string }) =>
        norm(s.id) === norm(serverContext) && String(s.status || "").toUpperCase() === "DOWN"
    );
  const isServerUp =
    serverContext &&
    hasControllerData &&
    servers.some(
      (s: { id: string; status: string }) =>
        norm(s.id) === norm(serverContext) && String(s.status || "").toUpperCase() === "UP"
    );

  const dismissedFromStorage =
    serverContext &&
    isServerDown &&
    (() => {
      try {
        return sessionStorage.getItem(getServerDismissedKey(serverContext)) === "1";
      } catch {
        return false;
      }
    })();

  useEffect(() => {
    if (!serverContext || !isServerDown) return;
    if (dismissedFromStorage) setOverlayDismissed(true);
  }, [serverContext, isServerDown, dismissedFromStorage]);

  const showServerDownOverlay =
    Boolean(serverContext) && isServerDown && !overlayDismissed && !dismissedFromStorage;

  useEffect(() => {
    if (!serverContext || !hasControllerData) return;
    if (!isServerUp) return;
    try {
      sessionStorage.removeItem(getServerDismissedKey(serverContext));
    } catch {
      // ignore
    }
    setOverlayDismissed(false);
  }, [serverContext, hasControllerData, isServerUp]);

  const doRecoverFromDraft = useCallback(() => {
    getAllDrafts().then((drafts) => {
      const forThisServer = drafts.filter(
        (d: Draft) => d.context === serverContext || (d.context == null && serverContext)
      );
      const draft = forThisServer.sort((a: Draft, b: Draft) => b.lastEditAt - a.lastEditAt)[0];
      if (draft) {
        setSelectedFile({ id: draft.fileId, name: draft.fileId, ext: "txt" });
        setWindows((prev) => {
          const maxZ = Math.max(...prev.map((w) => w.z));
          return prev.map((w) =>
            w.id === "editor"
              ? { ...w, z: maxZ + 1, isMinimized: false, isOpen: true }
              : w
          );
        });
      }
    });
  }, [serverContext]);

  const handleReopenDevice = useCallback(async () => {
    if (!serverContext || reopenLoading) return;
    setReopenLoading(true);
    let stateAfter: any = null;
    try {
      await api.restoreServer(serverContext);
      stateAfter = await api.getState();
      setControllerState(stateAfter);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const short = msg.length > 60 ? `${msg.slice(0, 60)}…` : msg;
      addDesktopNotification({
        title: "Re-open failed",
        message: `Could not reach controller. Is it running? (${short})`,
        actions: [{ label: "OK", onClick: () => {} }]
      });
      setReopenLoading(false);
      return;
    } finally {
      setReopenLoading(false);
    }
    const serverUp =
      stateAfter?.servers?.some(
        (s: { id: string; status: string }) =>
          String(s.id).toUpperCase() === String(serverContext).toUpperCase() &&
          String(s.status || "").toUpperCase() === "UP"
      ) === true;
    if (serverUp) {
      try {
        sessionStorage.removeItem(getServerDismissedKey(serverContext));
      } catch {
        // ignore
      }
      setOverlayDismissed(true);
    } else {
      setOverlayDismissed(true);
      addDesktopNotification({
        title: "Server starting",
        message: `Start the server process (npm run dev:server) so ${serverContext} can come back online.`,
        actions: [{ label: "OK", onClick: () => {} }]
      });
    }
    const drafts = await getAllDrafts();
    const forThisServer = drafts.filter(
      (d: Draft) => d.context === serverContext || (d.context == null && serverContext)
    );
    const showNotification = () => {
      if (forThisServer.length > 0) {
        addDesktopNotification({
          title: "Recovery",
          message: "You have unsaved work. Recover your data?",
          actions: [
            { label: "Recover", onClick: doRecoverFromDraft },
            { label: "Dismiss", onClick: () => {} }
          ]
        });
      } else if (serverUp) {
        addDesktopNotification({
          title: "Server restarted",
          message: `${serverContext} is back online.`,
          actions: [{ label: "OK", onClick: () => {} }]
        });
      }
    };
    window.setTimeout(showNotification, 400);
  }, [serverContext, doRecoverFromDraft, reopenLoading]);

  const dataLostNotifShown = useRef(false);
  useEffect(() => {
    if (!initialDataLost || !serverContext || dataLostNotifShown.current) return;
    dataLostNotifShown.current = true;
    const label = serverContext === "S1" ? "S1" : "S2";
    const showNotification = () => {
      addDesktopNotification({
        title: "Notification",
        message: `Your data on server ${label} has been wiped. Recover your work from drafts?`,
        actions: [
          { label: "Recover", onClick: doRecoverFromDraft },
          { label: "Dismiss", onClick: () => {} }
        ]
      });
    };
    const t = window.setTimeout(showNotification, 300);
    return () => window.clearTimeout(t);
  }, [initialDataLost, serverContext, doRecoverFromDraft]);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const state = await api.getState();
        if (mounted) setControllerState(state);
      } catch {
        // ignore
      }
    };
    poll();
    const intervalMs = serverContext ? 1500 : 3000;
    const id = window.setInterval(poll, intervalMs);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [serverContext]);

  const contentMap = useMemo(() => {
    return {
      explorer: (
        <FileExplorerWindow
          onOpenFile={setSelectedFile}
          embedded
          serverId={serverContext}
        />
      ),
      editor: (
        <DocumentEditorWindow
          fileId={selectedFile?.id}
          fileName={
            selectedFile ? `${selectedFile.name}.${selectedFile.ext}` : undefined
          }
          embedded
          serverId={serverContext}
        />
      ),
      controller: <ControllerConsole state={controllerState} />,
      server1: <ServerConsole serverId="S1" state={controllerState} />,
      server2: <ServerConsole serverId="S2" state={controllerState} />,
      dashboard: <DashboardWindow />
    } as const;
  }, [selectedFile, controllerState, serverContext]);

  const attachContent = (items: WindowItem[]) =>
    items.map((win) => ({
      ...win,
      content: contentMap[win.id]
    }));

  const visibleSet = useMemo(
    () => (visibleWindowIds ? new Set(visibleWindowIds) : null),
    [visibleWindowIds]
  );

  const focusWindow = (id: WindowId) => {
    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.z));
      return prev.map((w) =>
        w.id === id ? { ...w, z: maxZ + 1, isMinimized: false, isOpen: true } : w
      );
    });
  };

  const updateWindow = (id: WindowId, patch: Partial<WindowItem>) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w))
    );
  };

  const toggleMinimize = (id: WindowId) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
      )
    );
  };

  const closeWindow = (id: WindowId) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isOpen: false } : w))
    );
  };

  const openWindow = (id: WindowId) => {
    focusWindow(id);
  };

  useEffect(() => {
    if (!visibleSet) return;
    setWindows((prev) =>
      prev.map((w) =>
        visibleSet.has(w.id)
          ? w
          : { ...w, isOpen: false, isMinimized: true }
      )
    );
  }, [visibleSet]);

  const filteredWindows = visibleSet
    ? windows.filter((w) => visibleSet.has(w.id))
    : windows;

  const serverLabel = serverContext === "S1" ? "S1" : "S2";

  return (
    <div className="desktop-shell">
      <DesktopIconGrid onOpen={openWindow} visibleIds={visibleWindowIds} />
      <WindowManager
        windows={attachContent(filteredWindows)}
        onFocus={focusWindow}
        onUpdate={updateWindow}
        onMinimize={toggleMinimize}
        onClose={closeWindow}
      />
      <TaskbarDock
        windows={filteredWindows}
        onSelect={openWindow}
        controllerState={controllerState}
      />

      {showServerDownOverlay && (
        <div className="server-down-overlay">
          <div className="server-down-overlay-inner">
            <p className="server-down-title">Server {serverLabel} is shut down</p>
            <p className="server-down-sub">The device is off. Re-open to continue.</p>
            <button
              type="button"
              className="server-down-btn primary"
              onClick={handleReopenDevice}
              disabled={reopenLoading}
            >
              {reopenLoading ? "Re-opening…" : "Re-open device"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
