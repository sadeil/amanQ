type ServerStatus = "UP" | "DOWN";

export type ServerInfo = {
  id: string;
  url: string;
  status: ServerStatus;
  cpu: number;
  ram: number;
  latencyMs: number;
  lastSeen: number;
};

type TrafficSample = {
  serverId: string;
  latencyMs: number;
  ts: number;
};

type MetricPoint = { t: string; ms: number } | { t: string; rps: number };

type EventItem = {
  id: string;
  time: string;
  type: string;
  server?: string;
  details: string;
};

type BackupState = {
  status: "idle" | "running" | "done";
  encryptionOk: boolean;
  signatureOk: boolean;
  pqReady: boolean;
};

const modeState = { mode: "baseline" as "baseline" | "optimized" };
const servers: ServerInfo[] = [];
const trafficWindow: TrafficSample[] = [];
const latencyHistory: { t: string; ms: number }[] = [];
const throughputHistory: { t: string; rps: number }[] = [];
const events: EventItem[] = [];
const forcedDownIds = new Set<string>();
let simulateHighLoad = false;
let backupState: BackupState = {
  status: "idle",
  encryptionOk: true,
  signatureOk: true,
  pqReady: true
};

export function initServers(config: { id: string; url: string }[]) {
  servers.splice(0, servers.length);
  config.forEach((item) => {
    servers.push({
      id: item.id,
      url: item.url,
      status: "DOWN",
      cpu: 0,
      ram: 0,
      latencyMs: 999,
      lastSeen: 0
    });
  });
}

export function getMode() {
  return modeState.mode;
}

export function setMode(mode: "baseline" | "optimized") {
  modeState.mode = mode;
}

export function getServers() {
  return servers;
}

export function isServerForcedDown(id: string) {
  return forcedDownIds.has(id);
}

export function setServerForcedDown(id: string, down: boolean) {
  if (down) {
    forcedDownIds.add(id);
    updateServerHealth(id, false);
  } else {
    forcedDownIds.delete(id);
  }
}

export function updateServerHealth(id: string, ok: boolean) {
  const server = servers.find((s) => s.id === id);
  if (!server) return;
  const now = Date.now();
  const wasDown = server.status === "DOWN";
  server.status = ok ? "UP" : "DOWN";
  server.lastSeen = now;
  if (ok) {
    server.latencyMs = Math.max(10, Math.round(server.latencyMs * 0.7));
    server.cpu = Math.min(90, Math.max(5, server.cpu));
    server.ram = Math.min(90, Math.max(10, server.ram));
    if (wasDown) {
      addEvent({
        type: "RECOVERED",
        server: id,
        details: `${id} recovered`
      });
    }
  } else if (!wasDown) {
    server.cpu = 0;
    server.ram = 0;
    server.latencyMs = 999;
    addEvent({
      type: "FAILOVER",
      server: id,
      details: `${id} down`
    });
    triggerBackup(`server ${id} down`);
  }
}

export function updateServerMetrics(id: string, metrics: Partial<ServerInfo>) {
  const server = servers.find((s) => s.id === id);
  if (!server) return;
  if (typeof metrics.cpu === "number") server.cpu = metrics.cpu;
  if (typeof metrics.ram === "number") server.ram = metrics.ram;
  if (typeof metrics.latencyMs === "number")
    server.latencyMs = metrics.latencyMs;
}

export function recordTraffic(serverId: string, latencyMs: number) {
  const now = Date.now();
  trafficWindow.push({ serverId, latencyMs, ts: now });
  const cutoff = now - 60_000;
  while (trafficWindow.length && trafficWindow[0].ts < cutoff) {
    trafficWindow.shift();
  }
}

export function getTrafficShare() {
  const counts: Record<string, number> = {};
  servers.forEach((s) => (counts[s.id] = 0));
  trafficWindow.forEach((t) => {
    counts[t.serverId] = (counts[t.serverId] || 0) + 1;
  });
  const total = trafficWindow.length || 1;
  return servers.map((s) => ({
    serverId: s.id,
    pct: Math.round((counts[s.id] / total) * 100)
  }));
}

export function getLatencyAvg() {
  if (!trafficWindow.length) return 0;
  const sum = trafficWindow.reduce((acc, t) => acc + t.latencyMs, 0);
  return Math.round(sum / trafficWindow.length);
}

export function getTotalRps() {
  return Math.round((trafficWindow.length / 60) * 10) / 10;
}

export function addLatencyPoint(ms: number) {
  const point = { t: new Date().toLocaleTimeString(), ms };
  latencyHistory.push(point);
  trimHistory(latencyHistory);
}

export function addThroughputPoint(rps: number) {
  const point = { t: new Date().toLocaleTimeString(), rps };
  throughputHistory.push(point);
  trimHistory(throughputHistory);
}

function trimHistory(list: MetricPoint[]) {
  while (list.length > 120) list.shift();
}

export function getLatencyHistory() {
  return latencyHistory;
}

export function getThroughputHistory() {
  return throughputHistory;
}

/** Seed initial points so dashboard charts show data immediately. */
export function seedInitialMetrics() {
  const now = Date.now();
  for (let i = 0; i < 30; i++) {
    const t = new Date(now - (30 - i) * 2000).toLocaleTimeString();
    latencyHistory.push({
      t,
      ms: Math.round(40 + Math.random() * 70)
    });
    throughputHistory.push({
      t,
      rps: Math.round((0.2 + Math.random() * 1.5) * 10) / 10
    });
  }
  trimHistory(latencyHistory);
  trimHistory(throughputHistory);
}

export function addEvent(event: Omit<EventItem, "id" | "time">) {
  events.unshift({
    id: `e${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    time: new Date().toISOString(),
    ...event
  });
  if (events.length > 200) events.pop();
}

export function getEvents(since?: string) {
  if (!since) return events;
  return events.filter((e) => e.time > since);
}

export function getBackupState() {
  return backupState;
}

export function getSimulateHighLoad() {
  return simulateHighLoad;
}

export function setSimulateHighLoad(enabled: boolean) {
  simulateHighLoad = enabled;
}

export function triggerBackup(reason: string) {
  if (backupState.status === "running") return;
  backupState = {
    status: "running",
    encryptionOk: true,
    signatureOk: true,
    pqReady: true
  };
  addEvent({
    type: "BACKUP_STARTED",
    details: `Backup started: ${reason}`
  });
  setTimeout(() => {
    addEvent({ type: "ENCRYPTED", details: "Snapshot encrypted" });
  }, 400);
  setTimeout(() => {
    addEvent({ type: "SIGNED", details: "Snapshot signed" });
  }, 800);
  setTimeout(() => {
    addEvent({ type: "UPLOADED", details: "Snapshot uploaded" });
    backupState = {
      status: "done",
      encryptionOk: true,
      signatureOk: true,
      pqReady: true
    };
    addEvent({ type: "VERIFIED", details: "Backup verified" });
  }, 1200);
}
