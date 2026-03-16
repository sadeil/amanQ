import crypto from "crypto";
import fs from "fs";
import path from "path";

const baseDir = process.env.DATA_DIR || path.resolve("backend-data");
const draftsDir = path.join(baseDir, "drafts");

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export type DraftMeta = {
  fileId: string;
  lastEditTime: number;
  eventsCount: number;
  lastSnapshotTime: number;
  lastSnapshotIndex: number;
  status: "uncommitted" | "committed";
  nodeId?: string;
};

export type DraftEvent = {
  op: "set" | "append";
  data: { content?: string; text?: string };
  ts: number;
};

export function appendEvent(fileId: string, event: DraftEvent) {
  const dir = path.join(draftsDir, fileId);
  ensureDir(dir);
  const logPath = path.join(dir, "events.log");
  fs.appendFileSync(logPath, JSON.stringify(event) + "\n", "utf-8");
}

export function loadEvents(fileId: string) {
  const logPath = path.join(draftsDir, fileId, "events.log");
  if (!fs.existsSync(logPath)) return [] as DraftEvent[];
  const lines = fs.readFileSync(logPath, "utf-8").trim().split("\n");
  return lines.filter(Boolean).map((line) => JSON.parse(line) as DraftEvent);
}

export function loadMeta(fileId: string): DraftMeta {
  const metaPath = path.join(draftsDir, fileId, "draft.meta.json");
  if (!fs.existsSync(metaPath)) {
    return {
      fileId,
      lastEditTime: 0,
      eventsCount: 0,
      lastSnapshotTime: 0,
      lastSnapshotIndex: 0,
      status: "uncommitted"
    };
  }
  return JSON.parse(fs.readFileSync(metaPath, "utf-8")) as DraftMeta;
}

export function saveMeta(meta: DraftMeta) {
  const dir = path.join(draftsDir, meta.fileId);
  ensureDir(dir);
  const metaPath = path.join(dir, "draft.meta.json");
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
}

export type SnapshotRecord = {
  content: string;
  ts: number;
  eventsCount: number;
  stateType: "auto_save" | "temporary";
  integrityHash?: string;
};

export function writeSnapshot(
  fileId: string,
  content: string,
  eventsCount: number,
  stateType: "auto_save" | "temporary" = "auto_save"
) {
  const dir = path.join(draftsDir, fileId, "snapshots");
  ensureDir(dir);
  const ts = Date.now();
  const integrityHash = crypto.createHash("sha256").update(content, "utf8").digest("hex");
  const snapPath = path.join(dir, `snap_${ts}.json`);
  const record: SnapshotRecord = {
    content,
    ts,
    eventsCount,
    stateType,
    integrityHash
  };
  fs.writeFileSync(snapPath, JSON.stringify(record, null, 2), "utf-8");
  return { ts, eventsCount, integrityHash };
}

export function loadLatestSnapshot(fileId: string): SnapshotRecord | null {
  const dir = path.join(draftsDir, fileId, "snapshots");
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith("snap_") && f.endsWith(".json"));
  if (!files.length) return null;
  const latest = files.sort().slice(-1)[0];
  return JSON.parse(fs.readFileSync(path.join(dir, latest), "utf-8")) as SnapshotRecord;
}

export function listAllSnapshots(fileId: string): SnapshotRecord[] {
  const dir = path.join(draftsDir, fileId, "snapshots");
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith("snap_") && f.endsWith(".json"));
  return files
    .sort()
    .map((f) => {
      const data = JSON.parse(
        fs.readFileSync(path.join(dir, f), "utf-8")
      ) as SnapshotRecord;
      if (!data.stateType) data.stateType = "auto_save";
      return data;
    });
}

export function loadSnapshotByTs(
  fileId: string,
  ts: number
): SnapshotRecord | null {
  const snapPath = path.join(draftsDir, fileId, "snapshots", `snap_${ts}.json`);
  if (!fs.existsSync(snapPath)) return null;
  const data = JSON.parse(fs.readFileSync(snapPath, "utf-8")) as SnapshotRecord;
  if (!data.stateType) data.stateType = "auto_save";
  return data;
}

export function applyEvents(baseContent: string, events: DraftEvent[]) {
  return events.reduce((acc, ev) => {
    if (ev.op === "set" && typeof ev.data.content === "string") {
      return ev.data.content;
    }
    if (ev.op === "append" && typeof ev.data.text === "string") {
      return acc + ev.data.text;
    }
    return acc;
  }, baseContent);
}

export function listRecoverableDrafts() {
  if (!fs.existsSync(draftsDir)) return [];
  return fs
    .readdirSync(draftsDir)
    .map((fileId) => loadMeta(fileId))
    .filter((meta) => meta.status === "uncommitted");
}

export function markCommitted(fileId: string) {
  const meta = loadMeta(fileId);
  meta.status = "committed";
  saveMeta(meta);
}

export function purgeDraft(fileId: string) {
  const dir = path.join(draftsDir, fileId);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}
