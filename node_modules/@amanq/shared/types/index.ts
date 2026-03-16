export type ServerStatus = "UP" | "DOWN";

export type ServerState = {
  id: string;
  status: ServerStatus;
  cpu: number;
  ram: number;
  latencyMs: number;
  lastSeenSec: number;
};

export type TrafficShare = {
  serverId: string;
  pct: number;
};

export type BackupState = {
  status: "idle" | "running" | "done";
  encryptionOk: boolean;
  signatureOk: boolean;
  pqReady: boolean;
};

export type ControllerState = {
  mode: "baseline" | "optimized";
  servers: ServerState[];
  trafficShare: TrafficShare[];
  backup: BackupState;
  avgLatencyMs: number;
  totalRps: number;
};

export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
};

export type FileMeta = {
  id: string;
  name: string;
  ext: string;
  folderId: string;
  serverVersion: number;
  updatedAt: string;
};

export type FolderListResponse = {
  folders: Folder[];
  files: FileMeta[];
};

export type FileOpenResponse = {
  fileId: string;
  name: string;
  content: string;
  serverVersion: number;
  updatedAt: string;
};

export type FileSaveRequest = {
  content: string;
  baseServerVersion: number;
  clientLocalVersion: number;
};

export type FileSaveResponse = {
  serverVersion: number;
  savedOn: string;
  latencyMs: number;
};

export type ConflictResponse = {
  serverVersion: number;
  latestContent: string;
};

export type MetricsHistory = {
  latency: { t: string; ms: number }[];
  throughput: { t: string; rps: number }[];
};

export type EventItem = {
  id: string;
  time: string;
  type: string;
  server?: string;
  details: string;
};
