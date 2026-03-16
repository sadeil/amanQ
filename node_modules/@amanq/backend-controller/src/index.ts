import crypto from "crypto";
import express, { Request, Response } from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import {
  chooseNode,
  computeRisk,
  getEncryptionPolicy,
  getSnapshotPolicy
} from "./services/aiPolicy.js";
import { backupFile } from "./services/backup.js";
import {
  appendEvent,
  applyEvents,
  loadEvents,
  loadLatestSnapshot,
  listRecoverableDrafts,
  loadMeta,
  markCommitted,
  purgeDraft,
  saveMeta,
  writeSnapshot
} from "./services/drafts.js";
import { scoreState } from "./services/decisionEngine.js";
import {
  getBestRecoverableContent,
  getStateContent,
  listFileStates
} from "./services/recoveryStates.js";
import { initNodes, getNodes, touchNode } from "./services/nodes.js";
import { createSessionKeys, wrapFileKey, unwrapFileKey } from "./services/pqc.js";
import {
  decryptContent,
  encryptContent,
  loadFileMeta,
  readEncryptedFile,
  saveEncryptedFile,
  saveFileMeta
} from "./services/storage.js";

const app = express();
const port = Number(process.env.PORT || 6000);
const appControllerUrl = process.env.APP_CONTROLLER_URL as string | undefined;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api", async (req: Request, res: Response, next: express.NextFunction) => {
  if (!appControllerUrl) return next();
  const url = `${appControllerUrl}${req.originalUrl}`;
  try {
    const opts: RequestInit = {
      method: req.method,
      headers: { "Content-Type": "application/json" }
    };
    if (req.method !== "GET" && req.body !== undefined) {
      opts.body = JSON.stringify(req.body);
    }
    const proxyRes = await fetch(url, opts);
    const text = await proxyRes.text();
    const contentType = proxyRes.headers.get("content-type") || "application/json";
    res.status(proxyRes.status).set("Content-Type", contentType).send(text || undefined);
  } catch (e) {
    res.status(502).json({ error: "App controller unreachable. Set APP_CONTROLLER_URL to http://localhost:5000 and run apps/controller." });
  }
});

initNodes();

type SessionInfo = {
  sessionId: string;
  userId: string;
  fileId: string;
  targetNode: string;
  snapshotPolicy: { everySeconds: number; everyEvents: number };
  encryptionPolicy: { rotateEveryVersions: number; sensitivityLevel: "LOW" | "HIGH" };
  sessionKeyId: string;
  sessionKey: Buffer;
  createdAt: number;
};

const sessions = new Map<string, SessionInfo>();

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/session/open", (req: Request, res: Response) => {
  const { userId, fileId } = req.body as { userId: string; fileId: string };
  if (!userId || !fileId) {
    res.status(400).json({ error: "userId and fileId required" });
    return;
  }

  const nodes = getNodes();
  nodes.forEach((node) => touchNode(node.id));
  const target = chooseNode(nodes);
  const risk = computeRisk(target);
  const snapshotPolicy = getSnapshotPolicy(risk, 6);
  const fileMeta = loadFileMeta(fileId);
  const encryptionPolicy = getEncryptionPolicy("LOW", fileMeta.latestVersion + 1);
  const { sessionKeyId, sessionKey } = createSessionKeys();

  const sessionId = `sess_${nanoid(10)}`;
  const session: SessionInfo = {
    sessionId,
    userId,
    fileId,
    targetNode: target.id,
    snapshotPolicy,
    encryptionPolicy,
    sessionKeyId,
    sessionKey,
    createdAt: Date.now()
  };
  sessions.set(sessionId, session);

  let content = "";
  let serverVersion = fileMeta.latestVersion;
  if (fileMeta.latestVersion > 0) {
    const payload = readEncryptedFile(fileId, fileMeta.latestVersion);
    const latestMeta = fileMeta.versions[fileMeta.versions.length - 1];
    if (payload && latestMeta) {
      const fileKey = unwrapFileKey(latestMeta.wrappedFileKey, sessionKey);
      content = decryptContent(payload, fileKey);
    }
  }

  res.json({
    sessionId,
    fileId,
    content,
    serverVersion,
    targetNode: target.id,
    snapshotPolicy,
    encryptionPolicy: {
      rotateEveryVersions: encryptionPolicy.rotateEveryVersions,
      sensitivityLevel: encryptionPolicy.sensitivityLevel
    },
    sessionKeyId
  });
});

app.post("/drafts/:fileId/event", (req: Request, res: Response) => {
  const { sessionId, op, data, ts } = req.body as {
    sessionId: string;
    op: "set" | "append";
    data: { content?: string; text?: string };
    ts: number;
  };
  const fileId = String(req.params.fileId);
  const session = sessions.get(sessionId);
  if (!session || session.fileId !== fileId) {
    res.status(403).json({ error: "invalid session" });
    return;
  }

  appendEvent(fileId, { op, data, ts: ts || Date.now() });
  const meta = loadMeta(fileId);
  const nextCount = meta.eventsCount + 1;
  const now = Date.now();
  const shouldSnapshot =
    now - meta.lastSnapshotTime > session.snapshotPolicy.everySeconds * 1000 ||
    nextCount - meta.lastSnapshotIndex >= session.snapshotPolicy.everyEvents;

  meta.lastEditTime = now;
  meta.eventsCount = nextCount;
  meta.status = "uncommitted";
  meta.nodeId = session.targetNode;

  if (shouldSnapshot) {
    const latestSnapshot = loadLatestSnapshot(fileId);
    const events = loadEvents(fileId);
    const base = latestSnapshot ? latestSnapshot.content : "";
    const updated = applyEvents(base, events);
    const snap = writeSnapshot(fileId, updated, nextCount);
    meta.lastSnapshotTime = snap.ts;
    meta.lastSnapshotIndex = snap.eventsCount;
  }

  saveMeta(meta);
  res.json({ ok: true });
});

app.post("/files/:fileId/save", (req: Request, res: Response) => {
  const { sessionId } = req.body as { sessionId: string };
  const fileId = String(req.params.fileId);
  const session = sessions.get(sessionId);
  if (!session || session.fileId !== fileId) {
    res.status(403).json({ error: "invalid session" });
    return;
  }

  const meta = loadMeta(fileId);
  const snapshot = loadLatestSnapshot(fileId);
  const events = loadEvents(fileId);
  const base = snapshot ? snapshot.content : "";
  const finalContent = applyEvents(base, events);

  const fileMeta = loadFileMeta(fileId);
  const nextVersion = fileMeta.latestVersion + 1;
  const encryptionPolicy = getEncryptionPolicy("LOW", nextVersion);
  const fileKey = crypto.randomBytes(32);
  const wrappedFileKey = wrapFileKey(fileKey, session.sessionKey);
  const encrypted = encryptContent(finalContent, fileKey);
  const filePath = saveEncryptedFile(fileId, nextVersion, encrypted);

  fileMeta.latestVersion = nextVersion;
  fileMeta.versions.push({
    version: nextVersion,
    keyId: session.sessionKeyId,
    wrappedFileKey,
    iv: encrypted.iv,
    tag: encrypted.tag,
    sha256: encrypted.sha256
  });
  saveFileMeta(fileMeta);

  const metaPath = `${process.env.DATA_DIR || "backend-data"}/primary/meta/${fileId}.json`;
  if (encryptionPolicy.sensitivityLevel === "HIGH" || encryptionPolicy.rotateNow) {
    backupFile(filePath, metaPath);
  }

  markCommitted(fileId);
  purgeDraft(fileId);

  res.json({
    serverVersion: nextVersion,
    savedOn: session.targetNode,
    encryptionPolicy,
    fileKeyId: session.sessionKeyId
  });
});

app.get("/recovery/list", (_req, res) => {
  const drafts = listRecoverable();
  res.json(drafts);
});

app.get("/recovery/file/:fileId/states", (req: Request, res: Response) => {
  const fileId = String(req.params.fileId);
  const states = listFileStates(fileId);
  const metaOnly = states.map((s) => ({
    id: s.id,
    stateType: s.stateType,
    timestamp: s.timestamp,
    contentLength: s.contentLength,
    integrityHash: s.integrityHash,
    eventsCount: s.eventsCount
  }));
  const withScores = metaOnly.map((m) => ({
    ...m,
    score: scoreState(m)
  }));
  const bestId = withScores.length
    ? withScores.reduce((a, b) => (a.score >= b.score ? a : b)).id
    : null;
  res.json(
    withScores.map((s) => ({
      ...s,
      isBest: s.id === bestId
    }))
  );
});

app.post("/recovery/:fileId/restore", (req: Request, res: Response) => {
  const fileId = String(req.params.fileId);
  const body = (req.body || {}) as { stateId?: string };

  if (body.stateId) {
    const out = getStateContent(fileId, body.stateId);
    if (!out) {
      res.status(404).json({ error: "state not found" });
      return;
    }
    res.json({
      fileId,
      content: out.content,
      stateId: body.stateId,
      stateType: out.stateType
    });
    return;
  }

  const best = getBestRecoverableContent(fileId);
  if (!best) {
    const snapshot = loadLatestSnapshot(fileId);
    const events = loadEvents(fileId);
    const base = snapshot ? snapshot.content : "";
    const content = applyEvents(base, events);
    res.json({
      fileId,
      content,
      lastSnapshotTime: snapshot?.ts || 0,
      lastEventTime: events.length ? events[events.length - 1].ts : 0
    });
    return;
  }
  res.json({
    fileId,
    content: best.content,
    stateId: best.stateId,
    stateType: best.stateType
  });
});

function listRecoverable() {
  return listRecoverableDrafts().map((draft) => ({
    fileId: draft.fileId,
    lastSnapshotTime: draft.lastSnapshotTime,
    lastEventTime: draft.lastEditTime,
    nodeUsed: draft.nodeId || "unknown",
    riskScore: 0.5
  }));
}

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend Controller listening on ${port}`);
});
