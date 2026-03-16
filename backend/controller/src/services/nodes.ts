export type NodeInfo = {
  id: string;
  url: string;
  cpu: number;
  ram: number;
  latency: number;
  diskIO: number;
  draftsCount: number;
  status: "UP" | "DOWN";
};

const nodes: NodeInfo[] = [];

export function initNodes() {
  const raw = process.env.NODES || "S1:http://localhost:5001,S2:http://localhost:5002";
  nodes.splice(0, nodes.length);
  const entries = raw.split(",").map((e) => e.trim()).filter(Boolean);
  const toProcess = entries.length > 0 ? entries : ["S1:http://localhost:5001", "S2:http://localhost:5002"];
  toProcess.forEach((entry, index) => {
    const firstColon = entry.indexOf(":");
    const id = firstColon >= 0 ? entry.slice(0, firstColon).trim() : entry;
    const urlRaw = firstColon >= 0 ? entry.slice(firstColon + 1).trim() : "";
    const url =
      urlRaw && /^https?:\/\//i.test(urlRaw)
        ? urlRaw
        : urlRaw
          ? `http://${urlRaw}`
          : index === 0
            ? "http://localhost:5001"
            : "http://localhost:5002";
    nodes.push({
      id: id || `S${index + 1}`,
      url,
      cpu: Math.round(20 + Math.random() * 60),
      ram: Math.round(25 + Math.random() * 60),
      latency: Math.round(20 + Math.random() * 90),
      diskIO: Math.round(10 + Math.random() * 70),
      draftsCount: Math.round(Math.random() * 6),
      status: "UP"
    });
  });
}

export function getNodes() {
  return nodes;
}

export function touchNode(id: string) {
  const node = nodes.find((n) => n.id === id);
  if (!node) return;
  node.cpu = Math.round(20 + Math.random() * 60);
  node.ram = Math.round(25 + Math.random() * 60);
  node.latency = Math.round(20 + Math.random() * 90);
  node.diskIO = Math.round(10 + Math.random() * 70);
  node.draftsCount = Math.round(Math.random() * 6);
}
