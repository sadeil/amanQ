import fs from "fs";
import path from "path";

const baseDir = process.env.DATA_DIR || path.resolve("backend-data");
const vaultDir = path.join(baseDir, "backupvault");

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export function backupFile(filePath: string, metaPath: string) {
  ensureDir(vaultDir);
  const stamp = Date.now();
  const targetDir = path.join(vaultDir, `backup_${stamp}`);
  ensureDir(targetDir);
  const fileTarget = path.join(targetDir, path.basename(filePath));
  const metaTarget = path.join(targetDir, path.basename(metaPath));
  fs.copyFileSync(filePath, fileTarget);
  fs.copyFileSync(metaPath, metaTarget);
  return { fileTarget, metaTarget };
}
