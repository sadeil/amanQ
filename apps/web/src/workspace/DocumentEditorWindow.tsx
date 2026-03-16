import { useCallback, useEffect, useRef, useState } from "react";
import { api, nodeApi } from "../api/client";
import { addDesktopNotification } from "../state/desktopNotificationStore";
import { pushToast } from "../state/toastStore";
import {
  clearQueueForFile,
  deleteDraft,
  Draft,
  enqueueSave,
  getDraft,
  getQueueItems,
  saveDraft
} from "./recovery/useDraftStore";

type Props = {
  fileId?: string;
  fileName?: string;
  embedded?: boolean;
  serverId?: "S1" | "S2";
};

type Status = "Idle" | "Saved" | "Unsaved" | "Queued";

export function DocumentEditorWindow({
  fileId,
  fileName,
  embedded,
  serverId
}: Props) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>("Idle");
  const [baseServerVersion, setBaseServerVersion] = useState(0);
  const [localVersion, setLocalVersion] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionNode, setSessionNode] = useState<string | null>(null);
  const [snapshotPolicy, setSnapshotPolicy] = useState<string | null>(null);
  const lastEditRef = useRef(0);
  const draftTimerRef = useRef<number | null>(null);
  const eventTimerRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const recoverRef = useRef<(content?: string) => void>(() => {});
  const discardRef = useRef<() => void>(() => {});
  const draftRef = useRef<Draft | null>(null);
  const recoveryNotifKeyRef = useRef<string | null>(null);
  draftRef.current = draft;

  const loadFile = useCallback(async () => {
    if (!fileId) return;
    try {
      let loadedContent = "";
      let workspaceSessionVersion = 0;
      if (serverId) {
        const nodeClient = nodeApi(serverId);
        const serverFile = await nodeClient.openFile(fileId);
        loadedContent = serverFile.content || "";
        setSessionId(null);
        setSessionNode(serverId);
        setSnapshotPolicy(null);
        setContent(loadedContent);
        setBaseServerVersion(serverFile.serverVersion || 0);
        setLocalVersion(0);
        setStatus("Saved");
        setLastSavedAt(Date.now());
      } else {
        const session = await api.openSession("demo", fileId);
        loadedContent = session.content || "";
        workspaceSessionVersion = session.serverVersion || 0;
        setSessionId(session.sessionId);
        setSessionNode(session.targetNode);
        setSnapshotPolicy(
          `${session.snapshotPolicy?.everySeconds || 0}s / ${
            session.snapshotPolicy?.everyEvents || 0
          } events`
        );
        setContent(loadedContent);
        setBaseServerVersion(session.serverVersion || 0);
        setLocalVersion(0);
        setStatus("Saved");
        setLastSavedAt(Date.now());
      }

      const localDraft = await getDraft(fileId);
      if (localDraft && localDraft.content !== loadedContent) {
        setDraft(localDraft);
      } else if (!serverId) {
        setDraft(null);
        try {
          const states = await api.recoveryFileStates(fileId);
          if (Array.isArray(states) && states.length > 0) {
            setDraft({
              fileId,
              content: "",
              baseServerVersion: workspaceSessionVersion,
              localVersion: 0,
              lastEditAt: 0,
              context: "workspace"
            });
          }
        } catch {
          // Backend recovery not available or no states
        }
      } else {
        setDraft(null);
      }
    } catch {
      setSessionId(null);
      setSessionNode(null);
      setSnapshotPolicy(null);
      if (serverId) {
        setStatus("Queued");
        pushToast("Failed to open file from this server. Using local draft if available.");
        const localDraft = await getDraft(fileId);
        if (localDraft) {
          setContent(localDraft.content);
          setBaseServerVersion(localDraft.baseServerVersion);
          setLocalVersion(localDraft.localVersion);
        }
      } else {
        try {
          const serverFile = await api.openFile(fileId);
          setContent(serverFile.content || "");
          setBaseServerVersion(serverFile.serverVersion || 0);
          setLocalVersion(0);
          setStatus("Saved");
          setLastSavedAt(Date.now());
        } catch {
          setStatus("Queued");
          pushToast("Failed to open file, using local draft if available");
          const localDraft = await getDraft(fileId);
          if (localDraft) {
            setContent(localDraft.content);
            setBaseServerVersion(localDraft.baseServerVersion);
            setLocalVersion(localDraft.localVersion);
          }
        }
      }
    }
  }, [fileId, serverId]);

  useEffect(() => {
    loadFile();
  }, [loadFile]);

  const handleChange = (value: string) => {
    if (!fileId) return;
    setContent(value);
    const nextLocalVersion = localVersion + 1;
    setLocalVersion(nextLocalVersion);
    setStatus("Unsaved");
    lastEditRef.current = Date.now();
    if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = window.setTimeout(() => {
      const newDraft: Draft = {
        fileId,
        content: value,
        lastEditAt: lastEditRef.current,
        localVersion: nextLocalVersion,
        baseServerVersion,
        context: serverId ?? "workspace"
      };
      saveDraft(newDraft).catch(() => null);
    }, 300);

    if (eventTimerRef.current) window.clearTimeout(eventTimerRef.current);
    eventTimerRef.current = window.setTimeout(() => {
      if (sessionId && !serverId) {
        api
          .sendDraftEvent(fileId, {
            sessionId,
            op: "set",
            data: { content: value },
            ts: Date.now()
          })
          .catch(() => null);
      }
    }, 400);
  };

  const attemptSave = useCallback(async (showToast = false) => {
    if (!fileId || savingRef.current || status === "Saved") return;
    savingRef.current = true;
    try {
      if (serverId) {
        const result = await api.saveFileToNode(serverId, fileId, {
          content,
          baseServerVersion
        });
        const nextVersion =
          typeof result.data?.serverVersion === "number"
            ? result.data.serverVersion
            : baseServerVersion;
        if (result.status === 409) {
          setContent(
            typeof result.data?.latestContent === "string"
              ? result.data.latestContent
              : content
          );
          setBaseServerVersion(nextVersion);
          setLocalVersion(0);
          setStatus("Saved");
          setLastSavedAt(Date.now());
          await deleteDraft(fileId);
          await clearQueueForFile(fileId);
          if (showToast) pushToast("Conflict resolved with server version");
        } else if (result.status >= 200 && result.status < 300) {
          setBaseServerVersion(nextVersion);
          setStatus("Saved");
          setLastSavedAt(Date.now());
          await deleteDraft(fileId);
          await clearQueueForFile(fileId);
          if (showToast) pushToast(`Saved on ${serverId}`);
        } else {
          await enqueueSave({
            fileId,
            content,
            baseServerVersion,
            clientLocalVersion: localVersion,
            createdAt: Date.now()
          });
          setStatus("Queued");
        }
      } else if (sessionId) {
        const result = await api.saveFinal(fileId, { sessionId });
        setBaseServerVersion(result.serverVersion);
        setStatus("Saved");
        setLastSavedAt(Date.now());
        await deleteDraft(fileId);
        await clearQueueForFile(fileId);
        if (showToast) pushToast(`Saved on ${result.savedOn || sessionNode || "node"}`);
      } else {
        const result = await api.saveFile(fileId, {
          content,
          baseServerVersion,
          clientLocalVersion: localVersion
        });
        const nextVersion =
          typeof result.data?.serverVersion === "number"
            ? result.data.serverVersion
            : baseServerVersion;
        if (result.status === 409) {
          setContent(
            typeof result.data?.latestContent === "string"
              ? result.data.latestContent
              : content
          );
          setBaseServerVersion(nextVersion);
          setLocalVersion(0);
          setStatus("Saved");
          setLastSavedAt(Date.now());
          await deleteDraft(fileId);
          await clearQueueForFile(fileId);
          if (showToast) pushToast("Conflict resolved with server version");
        } else if (result.status >= 200 && result.status < 300) {
          setBaseServerVersion(nextVersion);
          setStatus("Saved");
          setLastSavedAt(Date.now());
          await deleteDraft(fileId);
          await clearQueueForFile(fileId);
        } else {
          await enqueueSave({
            fileId,
            content,
            baseServerVersion,
            clientLocalVersion: localVersion,
            createdAt: Date.now()
          });
          setStatus("Queued");
        }
      }
    } catch {
      await enqueueSave({
        fileId,
        content,
        baseServerVersion,
        clientLocalVersion: localVersion,
        createdAt: Date.now()
      });
      setStatus("Queued");
    } finally {
      savingRef.current = false;
    }
  }, [
    baseServerVersion,
    content,
    fileId,
    localVersion,
    status,
    sessionId,
    sessionNode,
    serverId
  ]);

  const recoverDraft = useCallback(async (restoredContent?: string) => {
    const d = draftRef.current;
    if (!d) return;
    const contentToUse = restoredContent != null ? restoredContent : d.content;
    setContent(contentToUse);
    setBaseServerVersion(d.baseServerVersion);
    setLocalVersion(d.localVersion);
    setStatus("Unsaved");
    setDraft(null);
  }, []);

  const discardDraft = useCallback(async () => {
    if (fileId) await deleteDraft(fileId);
    setDraft(null);
  }, [fileId]);

  recoverRef.current = recoverDraft;
  discardRef.current = discardDraft;

  useEffect(() => {
    if (!draft || !fileId) return;
    const key = `${fileId}-${draft.lastEditAt}`;
    if (recoveryNotifKeyRef.current === key) return;
    recoveryNotifKeyRef.current = key;

    const message =
      draft.content.length > 0
        ? draft.content.slice(0, 200) + (draft.content.length > 200 ? "…" : "")
        : "The server has unsaved data for this file. Restore a version?";

    const showNotification = () => {
      addDesktopNotification({
        title: "Unsaved session detected. Restore?",
        message,
        actions: [
          {
            label: "Recover",
            onClick: () => {
              recoveryNotifKeyRef.current = null;
              (async () => {
                if (fileId) {
                  try {
                    const r = await api.recoveryRestore(fileId);
                    if (r?.content != null) recoverRef.current(r.content);
                    else recoverRef.current();
                  } catch {
                    recoverRef.current();
                  }
                } else recoverRef.current();
              })();
            }
          },
          {
            label: "Discard",
            onClick: () => {
              recoveryNotifKeyRef.current = null;
              discardRef.current();
            }
          }
        ]
      });
    };

    const t = window.setTimeout(showNotification, 250);
    return () => window.clearTimeout(t);
  }, [draft, fileId]);

  const inner = (
    <div className={embedded ? "os-window-inner" : "window"}>
      <div className="window-header">
        <div className="window-title">
          <span>📝</span>
          <span>{fileName || "No file selected"}</span>
        </div>
        <div className="toolbar">
          <span
            className={`status-pill ${
              status === "Saved"
                ? "saved"
                : status === "Queued"
                ? "queued"
                : status === "Unsaved"
                ? "unsaved"
                : ""
            }`}
          >
            {status}
          </span>
          <button
            className="primary"
            onClick={() => attemptSave(true)}
            disabled={!fileId || status === "Saved"}
          >
            Save now
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 8, opacity: 0.7 }}>
        <span>Server v{baseServerVersion}</span>
        <span>Local v{localVersion}</span>
        {sessionNode && <span>Node {sessionNode}</span>}
        {snapshotPolicy && <span>Snapshot {snapshotPolicy}</span>}
        <span>
          {lastSavedAt
            ? `Last saved ${new Date(lastSavedAt).toLocaleTimeString()}`
            : "Not saved yet"}
        </span>
      </div>
      <textarea
        className="editor"
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={fileId ? "Start typing..." : "Select a file to begin editing."}
        readOnly={!fileId}
      />
    </div>
  );

  return inner;
}
