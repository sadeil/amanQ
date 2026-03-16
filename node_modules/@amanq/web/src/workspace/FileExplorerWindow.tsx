import { useEffect, useMemo, useState } from "react";
import { api, nodeApi } from "../api/client";
import { pushToast } from "../state/toastStore";

type FileMeta = {
  id: string;
  name: string;
  ext: string;
  folderId: string;
  serverVersion: number;
  updatedAt: string;
};

type Props = {
  onOpenFile: (file: FileMeta) => void;
  embedded?: boolean;
  serverId?: "S1" | "S2";
};

export function FileExplorerWindow({ onOpenFile, embedded, serverId }: Props) {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [folders, setFolders] = useState<{ id: string; name: string; parentId?: string }[]>([]);
  const [folderId, setFolderId] = useState("root");
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>(
    [{ id: "root", name: "Home" }]
  );
  const [modalType, setModalType] = useState<"folder" | "file" | null>(null);
  const [nameInput, setNameInput] = useState("");

  const client = serverId ? nodeApi(serverId) : api;

  const load = async (nextFolderId = folderId) => {
    try {
      const result = await client.listFolder(nextFolderId);
      setFiles(result.files || []);
      setFolders(result.folders || []);
    } catch {
      pushToast("Unable to load file list");
    }
  };

  useEffect(() => {
    load();
  }, [folderId, serverId]);

  const breadcrumb = useMemo(() => folderStack.map((f) => f.name).join(" / "), [
    folderStack
  ]);

  const createFolder = async () => {
    const name = nameInput.trim();
    if (!name) return;
    try {
      await client.createFolder(folderId, name);
      pushToast(`Folder created: ${name}`);
      load(folderId);
      setModalType(null);
      setNameInput("");
    } catch {
      pushToast("Folder create failed");
    }
  };

  const createFile = async () => {
    const name = nameInput.trim();
    if (!name) return;
    try {
      await client.createFile(folderId, name, "txt");
      pushToast(`File created: ${name}.txt`);
      load(folderId);
      setModalType(null);
      setNameInput("");
    } catch {
      pushToast("File create failed");
    }
  };

  const openFolder = (folder: { id: string; name: string }) => {
    setFolderId(folder.id);
    setFolderStack((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const goUp = () => {
    if (folderStack.length <= 1) return;
    const nextStack = folderStack.slice(0, -1);
    const nextFolder = nextStack[nextStack.length - 1];
    setFolderStack(nextStack);
    setFolderId(nextFolder.id);
  };

  const inner = (
    <div className={embedded ? "os-window-inner file-list" : "window file-list"}>
      <div className="window-header">
        <div className="window-title">
          <span>📁</span>
          <span>File Explorer</span>
        </div>
        <div className="toolbar">
          <button onClick={goUp} disabled={folderStack.length <= 1}>
            Up
          </button>
          <button onClick={() => setModalType("folder")}>New folder</button>
          <button className="primary" onClick={() => setModalType("file")}>
            New file
          </button>
          <button onClick={() => load(folderId)}>Refresh</button>
        </div>
      </div>
      <div className="path-bar">Path: {breadcrumb}</div>
      <div style={{ opacity: 0.7, marginBottom: 8, fontSize: 12 }}>
        {folders.length} folders · {files.length} files
      </div>
      <div>
        <strong>Folders</strong>
        {folders.length === 0 && (
          <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>
            No folders yet.
          </div>
        )}
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="file-row"
            onClick={() => openFolder(folder)}
          >
            📁 {folder.name}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <strong>Files</strong>
        {files.length === 0 && (
          <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>
            No files yet.
          </div>
        )}
        {files.map((file) => (
          <div
            key={file.id}
            className="file-row"
            onClick={() => onOpenFile(file)}
          >
            <span className="file-name">
              <span className="file-icon">📄</span>
              {file.name}.{file.ext}
            </span>
            <span style={{ opacity: 0.6, fontSize: 12 }}>
              v{file.serverVersion}
            </span>
          </div>
        ))}
      </div>
      {modalType && (
        <div className="modal">
          <div className="modal-card">
            <h3>{modalType === "folder" ? "Create folder" : "Create file"}</h3>
            <p style={{ opacity: 0.7 }}>
              {modalType === "folder"
                ? "Choose a name for your new folder."
                : "Choose a file name (extension will be .txt)."}
            </p>
            <input
              className="input"
              autoFocus
              placeholder={modalType === "folder" ? "Folder name" : "File name"}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (modalType === "folder") createFolder();
                  else createFile();
                }
                if (e.key === "Escape") {
                  setModalType(null);
                  setNameInput("");
                }
              }}
            />
            <div className="modal-actions">
              <button
                className="primary"
                onClick={modalType === "folder" ? createFolder : createFile}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setModalType(null);
                  setNameInput("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return inner;
}
