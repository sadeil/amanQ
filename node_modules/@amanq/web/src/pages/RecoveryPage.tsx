import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllDrafts, type Draft } from "../workspace/recovery/useDraftStore";

export function RecoveryPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllDrafts().then(setDrafts);
  }, []);

  const handleRestore = (draft: Draft) => {
    const path =
      draft.context === "S1"
        ? "/server1"
        : draft.context === "S2"
          ? "/server2"
          : "/workspace";
    navigate(path, {
      state: { recoverFileId: draft.fileId }
    });
  };

  return (
    <div className="recovery-page">
      <div className="recovery-header">
        <h1>Recovery</h1>
        <p className="recovery-subtitle">
          Unsaved work is stored here. Restore a draft to open it in the Workspace or Server desktop.
        </p>
      </div>
      {drafts.length === 0 ? (
        <div className="recovery-empty">
          <p>No drafts to recover.</p>
          <p className="recovery-empty-hint">
            Edits are saved locally as you type; restore after opening a file in Workspace or Server desktop.
          </p>
        </div>
      ) : (
        <ul className="recovery-list">
          {drafts.map((draft) => (
            <li key={draft.fileId} className="recovery-item">
              <div className="recovery-item-main">
                <span className="recovery-item-id">{draft.fileId}</span>
                <span className="recovery-item-time">
                  Last edit: {new Date(draft.lastEditAt).toLocaleString()}
                </span>
              </div>
              <div className="recovery-item-preview">
                {draft.content.slice(0, 120)}
                {draft.content.length > 120 ? "…" : ""}
              </div>
              <button
                type="button"
                className="recovery-item-btn primary"
                onClick={() => handleRestore(draft)}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
