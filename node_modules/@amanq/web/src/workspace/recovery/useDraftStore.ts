import { openDB } from "idb";

export type DraftContext = "S1" | "S2" | "workspace";

export type Draft = {
  fileId: string;
  content: string;
  lastEditAt: number;
  localVersion: number;
  baseServerVersion: number;
  /** Where the file was edited (for Recovery / server-down restore). */
  context?: DraftContext;
};

export type QueueItem = {
  fileId: string;
  content: string;
  baseServerVersion: number;
  clientLocalVersion: number;
  createdAt: number;
};

const dbPromise = openDB("amanq-drafts", 1, {
  upgrade(db) {
    db.createObjectStore("drafts", { keyPath: "fileId" });
    db.createObjectStore("queue", { keyPath: "createdAt" });
  }
});

export async function getDraft(fileId: string) {
  const db = await dbPromise;
  return (await db.get("drafts", fileId)) as Draft | undefined;
}

export async function getAllDrafts(): Promise<Draft[]> {
  const db = await dbPromise;
  return (await db.getAll("drafts")) as Draft[];
}

export async function saveDraft(draft: Draft) {
  const db = await dbPromise;
  await db.put("drafts", draft);
}

export async function deleteDraft(fileId: string) {
  const db = await dbPromise;
  await db.delete("drafts", fileId);
}

export async function enqueueSave(item: QueueItem) {
  const db = await dbPromise;
  await db.put("queue", item);
}

export async function getQueueItems() {
  const db = await dbPromise;
  return (await db.getAll("queue")) as QueueItem[];
}

export async function clearQueueForFile(fileId: string) {
  const db = await dbPromise;
  const all = (await db.getAll("queue")) as QueueItem[];
  const tx = db.transaction("queue", "readwrite");
  all
    .filter((item) => item.fileId === fileId)
    .forEach((item) => {
      tx.store.delete(item.createdAt);
    });
  await tx.done;
}

export async function clearQueue() {
  const db = await dbPromise;
  await db.clear("queue");
}

export async function clearAllDrafts() {
  const db = await dbPromise;
  await db.clear("drafts");
}
