import express from "express";
import cors from "cors";
import {
  addLatencyPoint,
  addThroughputPoint,
  getBackupState,
  getEvents,
  getLatencyAvg,
  getLatencyHistory,
  getMode,
  getServers,
  getSimulateHighLoad,
  getThroughputHistory,
  getTotalRps,
  getTrafficShare,
  initServers,
  isServerForcedDown,
  recordTraffic,
  seedInitialMetrics,
  setMode,
  setServerForcedDown,
  setSimulateHighLoad,
  triggerBackup,
  updateServerHealth,
  updateServerMetrics
} from "./stateStore.js";
import { pickServer } from "./loadBalancer.js";

const app = express();
const port = Number(process.env.PORT || 5000);

const backendControllerUrl = process.env.BACKEND_CONTROLLER_URL as string | undefined;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

async function proxyToBackendController(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (!backendControllerUrl) return next();
  const url = `${backendControllerUrl}${req.originalUrl}`;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const opts: RequestInit = {
      method: req.method,
      headers
    };
    if (req.method !== "GET" && req.body !== undefined) {
      opts.body = JSON.stringify(req.body);
    }
    const proxyRes = await fetch(url, opts);
    const text = await proxyRes.text();
    const contentType = proxyRes.headers.get("content-type") || "application/json";
    res.status(proxyRes.status).set("Content-Type", contentType).send(text || undefined);
  } catch (e) {
    res.status(502).json({ error: "Backend controller unreachable" });
  }
}

app.use("/recovery", proxyToBackendController);
app.use("/session", proxyToBackendController);
app.use("/drafts", proxyToBackendController);
app.use("/files", proxyToBackendController);

const serverUrls = process.env.SERVER_URLS
  ? process.env.SERVER_URLS.split(",").map((u) => u.trim())
  : ["http://127.0.0.1:5001", "http://127.0.0.1:5002"];
const serverIds = process.env.SERVER_IDS
  ? process.env.SERVER_IDS.split(",")
  : ["S1", "S2"];

initServers(
  serverUrls.map((url, index) => ({
    url,
    id: (serverIds[index] || `S${index + 1}`).trim().toUpperCase()
  }))
);
seedInitialMetrics();

const fileServerMap = new Map<string, string>();

async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const data = await res.json();
  return { res, data };
}

async function healthCheck() {
  const servers = getServers();
  await Promise.all(
    servers.map(async (s) => {
      if (isServerForcedDown(s.id)) return;
      try {
        const res = await fetch(`${s.url}/health`);
        updateServerHealth(s.id, res.ok);
      } catch {
        updateServerHealth(s.id, false);
      }
    })
  );
}

setInterval(() => {
  healthCheck();
}, 2000);

setInterval(() => {
  const servers = getServers();
  const highLoad = getSimulateHighLoad();
  servers.forEach((s) => {
    if (s.status === "UP") {
      updateServerMetrics(s.id, highLoad
        ? {
            cpu: Math.round(70 + Math.random() * 25),
            ram: Math.round(75 + Math.random() * 20),
            latencyMs: Math.round(150 + Math.random() * 200)
          }
        : {
            cpu: Math.round(20 + Math.random() * 60),
            ram: Math.round(30 + Math.random() * 50),
            latencyMs: Math.round(20 + Math.random() * 80)
          });
    }
  });
  const baseLatency = getLatencyAvg() || Math.round(30 + Math.random() * 80);
  addLatencyPoint(highLoad ? baseLatency + 120 + Math.random() * 180 : baseLatency);
  addThroughputPoint(getTotalRps() || Math.round((0.2 + Math.random() * (highLoad ? 2 : 0.5)) * 10) / 10);
}, 2000);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/config", (_req, res) => {
  res.json({
    appName: "AmanQ",
    version: "1.0",
    theme: "default"
  });
});

/** Simulated speed (Mbps) from latency: lower latency = higher speed, with jitter for "moving" gauge */
function speedMbpsFromLatency(latencyMs: number, status: string): number {
  if (status !== "UP") return 0;
  const ms = typeof latencyMs === "number" && Number.isFinite(latencyMs) ? latencyMs : 50;
  const base = Math.max(25, Math.min(98, 105 - ms / 3));
  const jitter = (Math.random() - 0.5) * 12;
  return Math.round(Math.max(20, Math.min(100, base + jitter)));
}

app.get("/api/state", (_req, res) => {
  const servers = getServers().map((s) => ({
    id: s.id,
    status: s.status,
    cpu: s.cpu,
    ram: s.ram,
    latencyMs: s.latencyMs,
    lastSeenSec: Math.round((Date.now() - s.lastSeen) / 1000),
    speedMbps: speedMbpsFromLatency(s.latencyMs, s.status)
  }));
  res.json({
    mode: getMode(),
    servers,
    trafficShare: getTrafficShare(),
    backup: getBackupState(),
    avgLatencyMs: getLatencyAvg(),
    totalRps: getTotalRps(),
    simulateHighLoad: getSimulateHighLoad()
  });
});

app.post("/api/mode", (req, res) => {
  const { mode } = req.body as { mode: "baseline" | "optimized" };
  if (mode !== "baseline" && mode !== "optimized") {
    res.status(400).json({ error: "invalid mode" });
    return;
  }
  setMode(mode);
  res.json({ ok: true, mode });
});

app.get("/api/metrics/history", (_req, res) => {
  res.json({
    latency: getLatencyHistory(),
    throughput: getThroughputHistory()
  });
});

app.get("/api/events", (req, res) => {
  const since = req.query.since ? String(req.query.since) : undefined;
  res.json(getEvents(since));
});

app.post("/api/demo/simulate-high-load", (req, res) => {
  const { enabled } = req.body as { enabled?: boolean };
  const next = enabled === undefined ? !getSimulateHighLoad() : !!enabled;
  setSimulateHighLoad(next);
  res.json({ ok: true, simulateHighLoad: next });
});

function normalizeServerId(serverId?: string): "S1" | "S2" {
  const u = String(serverId || "").trim().toUpperCase();
  return u === "S1" ? "S1" : "S2";
}

app.post("/api/demo/kill-server", (req, res) => {
  const { serverId } = req.body as { serverId?: string };
  const id = normalizeServerId(serverId);
  setServerForcedDown(id, true);
  res.json({ ok: true, serverId: id, status: "DOWN" });
});

app.post("/api/demo/restore-server", async (req, res) => {
  const { serverId } = req.body as { serverId?: string };
  const id = normalizeServerId(serverId);
  setServerForcedDown(id, false);
  await healthCheck();
  res.json({ ok: true, serverId: id });
});

app.post("/api/demo/trigger-backup", (_req, res) => {
  triggerBackup("manual trigger");
  res.json({ ok: true });
});

app.get("/api/fs/list", async (req, res) => {
  const folderId = String(req.query.folderId || "root");
  const servers = getServers().filter((s) => s.status === "UP");
  const results = await Promise.all(
    servers.map(async (s) => {
      try {
        const { data } = await fetchJson(`${s.url}/fs/list?folderId=${folderId}`);
        return data;
      } catch {
        return null;
      }
    })
  );
  const foldersMap = new Map<string, any>();
  const filesMap = new Map<string, any>();
  results.forEach((result) => {
    if (!result) return;
    result.folders?.forEach((f: any) => {
      foldersMap.set(f.id, f);
    });
    result.files?.forEach((f: any) => {
      filesMap.set(f.id, f);
    });
  });
  res.json({
    folders: Array.from(foldersMap.values()),
    files: Array.from(filesMap.values())
  });
});

app.post("/api/fs/folder", async (req, res) => {
  const { parentId, name } = req.body as { parentId: string; name: string };
  if (!parentId || !name) {
    res.status(400).json({ error: "parentId and name required" });
    return;
  }
  const servers = getServers().filter((s) => s.status === "UP");
  const results = await Promise.all(
    servers.map(async (s) => {
      try {
        const { data } = await fetchJson(`${s.url}/fs/folder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId, name })
        });
        return data;
      } catch {
        return null;
      }
    })
  );
  res.json(results.find(Boolean) || { id: "unknown", name, parentId });
});

app.post("/api/fs/file", async (req, res) => {
  const { folderId, name, ext } = req.body as {
    folderId: string;
    name: string;
    ext: string;
  };
  if (!folderId || !name) {
    res.status(400).json({ error: "folderId and name required" });
    return;
  }
  const server = pickServer();
  if (!server) {
    res.status(503).json({ error: "no servers available" });
    return;
  }
  const start = Date.now();
  try {
    const { res: srvRes, data } = await fetchJson(`${server.url}/fs/file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId, name, ext })
    });
    if (!srvRes.ok) {
      res.status(500).json({ error: "server error" });
      return;
    }
    fileServerMap.set(data.id, server.id);
    recordTraffic(server.id, Date.now() - start);
    res.json(data);
  } catch {
    res.status(503).json({ error: "server unreachable" });
  }
});

app.get("/api/files/:id", async (req, res) => {
  const fileId = req.params.id;
  const mappedServerId = fileServerMap.get(fileId);
  const servers = getServers().filter((s) => s.status === "UP");
  const candidates = mappedServerId
    ? [servers.find((s) => s.id === mappedServerId)].filter(Boolean)
    : servers;
  let lastError = "server unreachable";
  for (const server of candidates) {
    try {
      const start = Date.now();
      const { res: srvRes, data } = await fetchJson(
        `${server!.url}/files/${fileId}`
      );
      if (!srvRes.ok) {
        if (srvRes.status === 404) fileServerMap.delete(fileId);
        lastError = "file not found";
        continue;
      }
      fileServerMap.set(fileId, server!.id);
      recordTraffic(server!.id, Date.now() - start);
      res.json(data);
      return;
    } catch {
      lastError = "server unreachable";
    }
  }
  res.status(404).json({ error: lastError });
});

app.post("/api/files/:id/save", async (req, res) => {
  const fileId = req.params.id;
  const serverId = fileServerMap.get(fileId);
  const servers = getServers().filter((s) => s.status === "UP");
  const server = serverId
    ? servers.find((s) => s.id === serverId)
    : pickServer();
  if (!server) {
    res.status(503).json({ error: "no servers available" });
    return;
  }
  const start = Date.now();
  try {
    const { res: srvRes, data } = await fetchJson(
      `${server.url}/files/${fileId}/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      }
    );
    recordTraffic(server.id, Date.now() - start);
    if (srvRes.status === 409) {
      res.status(409).json(data);
      return;
    }
    if (srvRes.status === 404) {
      fileServerMap.delete(fileId);
      res.status(404).json({ error: "file not found" });
      return;
    }
    if (!srvRes.ok) {
      res.status(500).json({ error: "save failed" });
      return;
    }
    res.json({ ...data, savedOn: server.id });
  } catch {
    res.status(503).json({ error: "server unreachable" });
  }
});

function tryListen(p: number, maxTries: number): void {
  if (maxTries <= 0) {
    // eslint-disable-next-line no-console
    console.error(`Could not bind to any port. Free port ${port} or set PORT=5001`);
    process.exit(1);
  }
  const server = app.listen(p, () => {
    // eslint-disable-next-line no-console
    console.log(`Controller listening on http://localhost:${p}`);
    if (p !== port) {
      // eslint-disable-next-line no-console
      console.log(`Tip: If the web app can't connect, set VITE_CONTROLLER_URL=http://localhost:${p} and restart the web app.`);
    }
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      // eslint-disable-next-line no-console
      console.warn(`Port ${p} in use, trying ${p + 1}...`);
      server.close();
      tryListen(p + 1, maxTries - 1);
    } else {
      throw err;
    }
  });
}
tryListen(port, 5);
