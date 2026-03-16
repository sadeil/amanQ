import { getMode, getServers } from "./stateStore.js";

let roundRobinIndex = 0;

function scoreServer(cpu: number, ram: number, latencyMs: number) {
  const cpuWeight = 0.4;
  const ramWeight = 0.3;
  const latencyWeight = 0.3;
  const score =
    100 -
    (cpu * cpuWeight + ram * ramWeight + latencyMs * latencyWeight);
  return Math.max(1, score);
}

export function pickServer() {
  const servers = getServers().filter((s) => s.status === "UP");
  if (!servers.length) return null;
  const mode = getMode();
  if (mode === "optimized") {
    return pickOptimized(servers);
  }
  return pickBaseline(servers);
}

function pickBaseline(servers: ReturnType<typeof getServers>) {
  const scored = servers
    .map((s) => ({
      server: s,
      score: scoreServer(s.cpu, s.ram, s.latencyMs)
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, Math.min(2, scored.length)).map((s) => s.server);
  roundRobinIndex = (roundRobinIndex + 1) % top.length;
  return top[roundRobinIndex];
}

function pickOptimized(servers: ReturnType<typeof getServers>) {
  const a = 0.5;
  const b = 0.3;
  const c = 0.2;
  const costs = servers.map((s) => a * s.cpu + b * s.ram + c * s.latencyMs);
  const maxCost = Math.max(...costs);
  const expScores = costs.map((cst) => Math.exp((maxCost - cst) / 20));
  const sum = expScores.reduce((acc, v) => acc + v, 0);
  const pick = Math.random() * sum;
  let running = 0;
  for (let i = 0; i < servers.length; i += 1) {
    running += expScores[i];
    if (pick <= running) return servers[i];
  }
  return servers[0];
}
