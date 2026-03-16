import crypto from "crypto";

/**
 * Post-quantum cryptography (PQC) readiness layer.
 * Session keys are used to wrap file encryption keys; this module is structured
 * so the key agreement can be swapped to a PQC KEM (e.g. Kyber/ML-KEM) for
 * post-quantum-safe key encapsulation. Symmetric encryption uses AES-256-GCM.
 */

export type SessionKeys = {
  sessionKeyId: string;
  sessionKey: Buffer;
};

export function createSessionKeys(): SessionKeys {
  const sessionKeyId = `sess_${crypto.randomBytes(6).toString("hex")}`;
  const sessionKey = crypto.randomBytes(32);
  return { sessionKeyId, sessionKey };
}

export function wrapFileKey(fileKey: Buffer, sessionKey: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", sessionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(fileKey), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    wrapped: ciphertext.toString("base64")
  };
}

export function unwrapFileKey(
  wrapped: { iv: string; tag: string; wrapped: string },
  sessionKey: Buffer
) {
  const iv = Buffer.from(wrapped.iv, "base64");
  const tag = Buffer.from(wrapped.tag, "base64");
  const data = Buffer.from(wrapped.wrapped, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", sessionKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}
