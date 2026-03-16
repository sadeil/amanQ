const baseUrl =
  import.meta.env.VITE_CONTROLLER_URL || "http://127.0.0.1:5000";

const nodeBaseUrls = {
  S1: import.meta.env.VITE_NODE_S1_URL || "http://127.0.0.1:5001",
  S2: import.meta.env.VITE_NODE_S2_URL || "http://127.0.0.1:5002"
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

async function requestWithBase<T>(
  base: string,
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async health() {
    return request<{ ok: boolean }>("/api/health");
  },
  async getConfig() {
    return request<{ appName?: string; version?: string; theme?: string }>("/api/config");
  },
  async getState() {
    return request<any>("/api/state");
  },
  async setMode(mode: "baseline" | "optimized") {
    return request("/api/mode", {
      method: "POST",
      body: JSON.stringify({ mode })
    });
  },
  async listFolder(folderId: string) {
    return request<any>(`/api/fs/list?folderId=${folderId}`);
  },
  async createFolder(parentId: string, name: string) {
    return request<any>("/api/fs/folder", {
      method: "POST",
      body: JSON.stringify({ parentId, name })
    });
  },
  async createFile(folderId: string, name: string, ext: string) {
    return request<any>("/api/fs/file", {
      method: "POST",
      body: JSON.stringify({ folderId, name, ext })
    });
  },
  async openFile(fileId: string) {
    return request<any>(`/api/files/${fileId}`);
  },
  async openSession(userId: string, fileId: string) {
    return request<any>("/session/open", {
      method: "POST",
      body: JSON.stringify({ userId, fileId })
    });
  },
  async sendDraftEvent(
    fileId: string,
    payload: { sessionId: string; op: "set" | "append"; data: any; ts: number }
  ) {
    return request<any>(`/drafts/${fileId}/event`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async saveFinal(fileId: string, payload: { sessionId: string }) {
    return request<any>(`/files/${fileId}/save`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async recoveryList() {
    return request<any>("/recovery/list");
  },
  /** List recoverable states for a file (quantum-inspired multi-state). */
  async recoveryFileStates(fileId: string): Promise<
    { id: string; stateType: string; timestamp: number; contentLength?: number; integrityHash?: string; eventsCount?: number; score?: number; isBest?: boolean }[]
  > {
    return request<any>(`/recovery/file/${fileId}/states`);
  },
  /** Restore file content: best state if no stateId, else specific state. */
  async recoveryRestore(
    fileId: string,
    stateId?: string
  ): Promise<{ fileId: string; content: string; stateId?: string; stateType?: string }> {
    return request<any>(`/recovery/${fileId}/restore`, {
      method: "POST",
      body: JSON.stringify(stateId != null ? { stateId } : {})
    });
  },
  async saveFile(fileId: string, payload: any) {
    const res = await fetch(`${baseUrl}/api/files/${fileId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  },
  async getMetrics() {
    return request<any>("/api/metrics/history?windowSec=60");
  },
  async getEvents(since?: string) {
    return request<any>(
      `/api/events${since ? `?since=${encodeURIComponent(since)}` : ""}`
    );
  },
  /** Demo scenarios: wipe one server. Returns ok and optional error message. */
  async wipeServer(
    serverId: "S1" | "S2"
  ): Promise<{ ok: boolean; error?: string }> {
    const base = nodeBaseUrls[serverId];
    try {
      const res = await fetch(`${base}/demo/wipe`, { method: "POST" });
      if (res.ok) return { ok: true };
      const text = await res.text();
      return { ok: false, error: `${res.status} ${text || res.statusText}`.trim() };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  },

  /** Wipe one or both servers. Returns result per server. */
  async wipeServers(
    servers: ("S1" | "S2")[]
  ): Promise<{ S1?: boolean; S2?: boolean; errors: string[] }> {
    const errors: string[] = [];
    const out: { S1?: boolean; S2?: boolean } = {};
    for (const id of servers) {
      const r = await this.wipeServer(id);
      out[id] = r.ok;
      if (!r.ok) errors.push(`${id}: ${r.error || "failed"}`);
    }
    return { ...out, errors };
  },

  /** Toggle or set high-load simulation (elevated CPU/RAM/latency). */
  async simulateHighLoad(enabled?: boolean): Promise<{ ok: boolean; simulateHighLoad: boolean }> {
    return request("/api/demo/simulate-high-load", {
      method: "POST",
      body: JSON.stringify(enabled === undefined ? {} : { enabled })
    });
  },

  /** Force a server to DOWN (S2 by default). */
  async killServer(serverId: "S1" | "S2" = "S2"): Promise<{ ok: boolean; serverId: string }> {
    return request("/api/demo/kill-server", {
      method: "POST",
      body: JSON.stringify({ serverId })
    });
  },

  /** Clear forced-down state so server can go back UP on next health check. */
  async restoreServer(serverId: "S1" | "S2" = "S2"): Promise<{ ok: boolean; serverId: string }> {
    return request("/api/demo/restore-server", {
      method: "POST",
      body: JSON.stringify({ serverId })
    });
  },

  /** Manually trigger a backup. */
  async triggerBackup(): Promise<{ ok: boolean }> {
    return request("/api/demo/trigger-backup", { method: "POST", body: JSON.stringify({}) });
  },

  /**
   * Save file to a specific node (direct). Returns status + data so caller can handle 409/2xx.
   * Use this when editor has serverId so 409 conflict can be resolved instead of throwing.
   */
  async saveFileToNode(
    serverId: "S1" | "S2",
    fileId: string,
    payload: { content: string; baseServerVersion: number }
  ): Promise<{ status: number; data: Record<string, unknown> }> {
    const base = nodeBaseUrls[serverId];
    const res = await fetch(`${base}/files/${fileId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data: data as Record<string, unknown> };
  }
};

export function nodeApi(serverId: "S1" | "S2") {
  const base = nodeBaseUrls[serverId];
  return {
    async listFolder(folderId: string) {
      return requestWithBase<any>(base, `/fs/list?folderId=${folderId}`);
    },
    async createFolder(parentId: string, name: string) {
      return requestWithBase<any>(base, "/fs/folder", {
        method: "POST",
        body: JSON.stringify({ parentId, name })
      });
    },
    async createFile(folderId: string, name: string, ext: string) {
      return requestWithBase<any>(base, "/fs/file", {
        method: "POST",
        body: JSON.stringify({ folderId, name, ext })
      });
    },
    async openFile(fileId: string) {
      return requestWithBase<any>(base, `/files/${fileId}`);
    },
    async saveFile(fileId: string, payload: any) {
      return requestWithBase<any>(base, `/files/${fileId}/save`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
  };
}
