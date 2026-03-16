import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { Draft } from "./useDraftStore";

export type RecoveryState = {
  id: string;
  stateType: string;
  timestamp: number;
  contentLength?: number;
  integrityHash?: string;
  eventsCount?: number;
  score?: number;
  isBest?: boolean;
};

type Props = {
  draft: Draft;
  fileId?: string;
  onRecover: (content?: string) => void;
  onDiscard: () => void;
};

export function RecoveryModal({ draft, fileId, onRecover, onDiscard }: Props) {
  const lastEdit = new Date(draft.lastEditAt).toLocaleString();
  const [backendStates, setBackendStates] = useState<RecoveryState[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    api
      .recoveryFileStates(fileId)
      .then((list) => {
        if (!cancelled && Array.isArray(list) && list.length > 0) {
          setBackendStates(list);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const handleRecoverLocal = () => {
    onRecover(); // no content = use draft.content in parent
  };

  const handleRecoverBest = async () => {
    if (!fileId) {
      onRecover();
      return;
    }
    setLoading(true);
    try {
      const result = await api.recoveryRestore(fileId);
      if (result?.content != null) {
        onRecover(result.content);
      } else {
        onRecover();
      }
    } catch {
      onRecover();
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverVersion = async (stateId: string) => {
    if (!fileId) return;
    setRestoringId(stateId);
    try {
      const result = await api.recoveryRestore(fileId, stateId);
      if (result?.content != null) {
        onRecover(result.content);
      }
    } finally {
      setRestoringId(null);
    }
  };

  const hasBackendVersions = backendStates.length > 0;
  const hasLocalDraft = draft.content.length > 0;
  const canRestore = hasBackendVersions || hasLocalDraft;

  return (
    <div className="modal">
      <div className="modal-card recovery-modal-card">
        <h3>Unsaved session detected. Restore?</h3>
        <p>
          {hasLocalDraft
            ? `A newer local draft exists for this file. Last edit: ${lastEdit}`
            : "The server has unsaved data for this file. Restore a version?"}
        </p>
        {hasLocalDraft && (
          <div className="draft-preview">{draft.content.slice(0, 400)}</div>
        )}
        <div className="modal-actions">
          {canRestore ? (
            <button
              className="primary"
              onClick={hasBackendVersions ? handleRecoverBest : handleRecoverLocal}
              disabled={loading}
            >
              {loading ? "Restoring…" : hasBackendVersions ? "Restore (best version)" : "Recover draft"}
            </button>
          ) : (
            <span className="recovery-no-versions">No recoverable versions.</span>
          )}
          <button onClick={onDiscard}>Discard</button>
        </div>
        {hasBackendVersions && (
          <div className="recovery-versions">
            <button
              type="button"
              className="link-button"
              onClick={() => setShowVersions((v) => !v)}
            >
              {showVersions ? "Hide" : "View"} previous versions
            </button>
            {showVersions && (
              <ul className="recovery-versions-list">
                {backendStates.map((s) => (
                  <li key={s.id} className="recovery-version-item">
                    <span className="recovery-version-meta">
                      {s.isBest && <span className="recovery-version-best">Recommended · </span>}
                      {s.stateType} · {new Date(s.timestamp).toLocaleString()}
                      {s.contentLength != null && ` · ${s.contentLength} chars`}
                    </span>
                    <button
                      type="button"
                      className="small"
                      onClick={() => handleRecoverVersion(s.id)}
                      disabled={restoringId !== null}
                    >
                      {restoringId === s.id ? "Restoring…" : "Restore this"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
