import express, { Request, Response } from "express";
import cors from "cors";
import {
  createFile,
  createFolder,
  getFile,
  listFolder,
  saveFile,
  wipeAllData
} from "./storage.js";

const app = express();
const portFromEnv = process.env.PORT;
const runBothPorts = process.env.RUN_BOTH_PORTS === "1" || process.argv.includes("both");
const portFromArg = (() => {
  for (let i = process.argv.length - 1; i >= 2; i--) {
    const arg = process.argv[i];
    if (arg === "both") continue;
    const n = Number(arg);
    if (!Number.isNaN(n) && n > 0 && n < 65536) return n;
  }
  return NaN;
})();
const port = Number(portFromEnv || (!Number.isNaN(portFromArg) ? portFromArg : 5001));

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/fs/list", (req: Request, res: Response) => {
  const folderId = String(req.query.folderId || "root");
  const result = listFolder(folderId);
  res.json(result);
});

app.post("/fs/folder", (req: Request, res: Response) => {
  const { parentId, name } = req.body as { parentId: string; name: string };
  if (!parentId || !name) {
    res.status(400).json({ error: "parentId and name required" });
    return;
  }
  const folder = createFolder(parentId, name);
  res.json(folder);
});

app.post("/fs/file", (req: Request, res: Response) => {
  const { folderId, name, ext } = req.body as {
    folderId: string;
    name: string;
    ext: string;
  };
  if (!folderId || !name) {
    res.status(400).json({ error: "folderId and name required" });
    return;
  }
  const file = createFile(folderId, name, ext || "txt");
  res.json(file);
});

app.get("/files/:id", (req: Request, res: Response) => {
  const fileId = String(req.params.id);
  const file = getFile(fileId);
  if (!file) {
    res.status(404).json({ error: "file not found" });
    return;
  }
  res.json({
    fileId: file.id,
    name: `${file.name}.${file.ext}`,
    content: file.content,
    serverVersion: file.serverVersion,
    updatedAt: file.updatedAt
  });
});

app.post("/files/:id/save", (req: Request, res: Response) => {
  const fileId = String(req.params.id);
  const { content, baseServerVersion } = req.body as {
    content?: string;
    baseServerVersion?: number;
  };
  if (typeof content !== "string") {
    res.status(400).json({ error: "content required" });
    return;
  }
  const version = typeof baseServerVersion === "number" ? baseServerVersion : 0;
  const result = saveFile(fileId, content, version);
  if (result.kind === "not_found") {
    res.status(404).json({ error: "file not found" });
    return;
  }
  if (result.kind === "conflict") {
    res.status(409).json({
      serverVersion: result.serverVersion,
      latestContent: result.latestContent
    });
    return;
  }
  res.json({
    serverVersion: result.file.serverVersion,
    savedOn: process.env.SERVER_ID || "S?",
    latencyMs: Math.floor(40 + Math.random() * 120)
  });
});

app.post("/demo/wipe", (_req: Request, res: Response) => {
  try {
    wipeAllData();
    res.json({ ok: true, message: "All data wiped (demo)" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

const host = "0.0.0.0";
if (runBothPorts) {
  const ports = [5001, 5002];
  ports.forEach((p) => {
    app.listen(p, host, () => {
      // eslint-disable-next-line no-console
      console.log(`Server node listening on http://127.0.0.1:${p} (S${ports.indexOf(p) + 1})`);
    });
  });
  // eslint-disable-next-line no-console
  console.log("S1 and S2 running on ports 5001 and 5002");
} else {
  app.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`Server node listening on http://127.0.0.1:${port} (port ${port})`);
  });
}
