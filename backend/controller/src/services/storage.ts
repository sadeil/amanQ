import crypto from "crypto";
import fs from "fs";
import path from "path";

const baseDir = process.env.DATA_DIR || path.resolve("backend-data");
const primaryDir = path.join(baseDir, "primary");
const filesDir = path.join(primaryDir, "files");
const metaDir = path.join(primaryDir, "meta");

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export type FileMeta = {
  fileId: string;
  latestVersion: number;
  versions: Array<{
    version: number;
    keyId: string;
    wrappedFileKey: { iv: string; tag: string; wrapped: string };
    iv: string;
    tag: string;
    sha256: string;
  }>;
};

export function loadFileMeta(fileId: string): FileMeta {
  ensureDir(metaDir);
  const metaPath = path.join(metaDir, `${fileId}.json`);
  if (!fs.existsSync(metaPath)) {
    return { fileId, latestVersion: 0, versions: [] };
  }
  return JSON.parse(fs.readFileSync(metaPath, "utf-8")) as FileMeta;
}

export function saveFileMeta(meta: FileMeta) {
  ensureDir(metaDir);
  const metaPath = path.join(metaDir, `${meta.fileId}.json`);
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
}

export function encryptContent(content: string, fileKey: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", fileKey, iv);
  const ciphertext = Buffer.concat([cipher.update(content, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const sha256 = crypto.createHash("sha256").update(ciphertext).digest("hex");
  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    sha256
  };
}

export function decryptContent(
  payload: { iv: string; tag: string; ciphertext: string },
  fileKey: Buffer
) {
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", fileKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf-8"
  );
}

export function saveEncryptedFile(
  fileId: string,
  version: number,
  payload: { iv: string; tag: string; ciphertext: string }
) {
  ensureDir(filesDir);
  const filePath = path.join(filesDir, `${fileId}_v${version}.enc.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
  return filePath;
}

export function readEncryptedFile(fileId: string, version: number) {
  const filePath = path.join(filesDir, `${fileId}_v${version}.enc.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
    iv: string;
    tag: string;
    ciphertext: string;
  };
}
