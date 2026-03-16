import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
};

export type FileRecord = {
  id: string;
  name: string;
  ext: string;
  folderId: string;
  content: string;
  serverVersion: number;
  updatedAt: string;
};

type Store = {
  folders: Record<string, Folder>;
  files: Record<string, FileRecord>;
};

const defaultStore: Store = {
  folders: {
    root: { id: "root", name: "root", parentId: null }
  },
  files: {}
};

const port = Number(process.env.PORT || 5001);
const defaultDataPath =
  process.env.DATA_PATH ||
  (port === 5002 ? "./data/s2.json" : "./data/s1.json");
const dataPath = defaultDataPath;

function ensureDirExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadStore(): Store {
  try {
    const raw = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(raw) as Store;
  } catch {
    return structuredClone(defaultStore);
  }
}

function saveStore(store: Store) {
  ensureDirExists(dataPath);
  fs.writeFileSync(dataPath, JSON.stringify(store, null, 2), "utf-8");
}

export function listFolder(folderId: string) {
  const store = loadStore();
  const folders = Object.values(store.folders).filter(
    (f) => f.parentId === folderId
  );
  const files = Object.values(store.files).filter(
    (f) => f.folderId === folderId
  );
  return { folders, files };
}

export function createFolder(parentId: string, name: string) {
  const store = loadStore();
  const id = nanoid(8);
  const folder: Folder = { id, name, parentId };
  store.folders[id] = folder;
  saveStore(store);
  return folder;
}

export function createFile(folderId: string, name: string, ext: string) {
  const store = loadStore();
  const id = nanoid(8);
  const now = new Date().toISOString();
  const file: FileRecord = {
    id,
    name,
    ext,
    folderId,
    content: "",
    serverVersion: 1,
    updatedAt: now
  };
  store.files[id] = file;
  saveStore(store);
  return file;
}

export function getFile(fileId: string) {
  const store = loadStore();
  const file = store.files[fileId];
  if (!file) {
    return null;
  }
  return file;
}

export function saveFile(
  fileId: string,
  content: string,
  baseServerVersion: number
) {
  const store = loadStore();
  const file = store.files[fileId];
  if (!file) {
    return { kind: "not_found" as const };
  }
  if (file.serverVersion !== baseServerVersion) {
    return {
      kind: "conflict" as const,
      serverVersion: file.serverVersion,
      latestContent: file.content
    };
  }
  const now = new Date().toISOString();
  file.content = content;
  file.serverVersion += 1;
  file.updatedAt = now;
  store.files[fileId] = file;
  saveStore(store);
  return { kind: "ok" as const, file };
}

/** Demo scenario: wipe all files and folders (except root). Resets store to default. */
export function wipeAllData(): void {
  const store = structuredClone(defaultStore);
  saveStore(store);
}
