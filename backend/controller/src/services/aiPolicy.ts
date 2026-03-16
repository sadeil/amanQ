export type NodeMetrics = {
  id: string;
  cpu: number;
  ram: number;
  latency: number;
  diskIO: number;
  draftsCount: number;
  status: "UP" | "DOWN";
};

export type SnapshotPolicy = {
  everySeconds: number;
  everyEvents: number;
};

export type EncryptionPolicy = {
  rotateEveryVersions: number;
  sensitivityLevel: "LOW" | "HIGH";
  rotateNow: boolean;
};

export function computeRisk(metrics: NodeMetrics) {
  const risk =
    0.4 * (metrics.ram / 100) +
    0.3 * (metrics.cpu / 100) +
    0.2 * (metrics.diskIO / 100) +
    0.1 * Math.min(metrics.latency / 200, 1);
  return Math.min(Math.max(risk, 0), 1);
}

export function chooseNode(nodes: NodeMetrics[]) {
  const candidates = nodes.filter((n) => n.status === "UP");
  if (!candidates.length) return nodes[0];
  const scored = candidates
    .map((node) => ({
      node,
      score:
        100 -
        (node.cpu * 0.4 + node.ram * 0.3 + node.latency * 0.2 + node.diskIO * 0.1)
    }))
    .sort((a, b) => b.score - a.score);
  return scored[0].node;
}

export function getSnapshotPolicy(risk: number, typingSpeed: number) {
  if (risk > 0.7) {
    return { everySeconds: 3, everyEvents: 6 };
  }
  if (typingSpeed > 8) {
    return { everySeconds: 5, everyEvents: 10 };
  }
  return { everySeconds: 15, everyEvents: 30 };
}

export function getEncryptionPolicy(
  sensitivityLevel: "LOW" | "HIGH",
  version: number
): EncryptionPolicy {
  const rotateEveryVersions = sensitivityLevel === "HIGH" ? 1 : 5;
  return {
    rotateEveryVersions,
    sensitivityLevel,
    rotateNow: version % rotateEveryVersions === 0
  };
}
