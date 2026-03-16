/**
 * Collects all recoverable states for a file (temporary, auto_save, saved metadata)
 * and provides content for a given state or the best state (decision engine).
 */

import type { FileStateMeta } from "./decisionEngine.js";
import { selectBestState } from "./decisionEngine.js";
import {
  applyEvents,
  loadEvents,
  loadLatestSnapshot,
  loadSnapshotByTs,
  listAllSnapshots
} from "./drafts.js";

export type RecoverableState = FileStateMeta & {
  content?: string;
};

export function listFileStates(fileId: string): RecoverableState[] {
  const states: RecoverableState[] = [];

  // Draft snapshots (auto_save) and temporary (snapshot + events)
  const snapshots = listAllSnapshots(fileId);
  snapshots.forEach((snap) => {
    states.push({
      id: `snap_${snap.ts}`,
      stateType: snap.stateType,
      timestamp: snap.ts,
      contentLength: snap.content.length,
      integrityHash: snap.integrityHash,
      eventsCount: snap.eventsCount
    });
  });

  // Temporary (live): latest snapshot + all events
  const latestSnapshot = loadLatestSnapshot(fileId);
  const events = loadEvents(fileId);
  if (latestSnapshot || events.length > 0) {
    const base = latestSnapshot ? latestSnapshot.content : "";
    const temporaryContent = applyEvents(base, events);
    const lastEventTs = events.length > 0 ? events[events.length - 1].ts : Date.now();
    states.push({
      id: "temporary",
      stateType: "temporary",
      timestamp: lastEventTs,
      contentLength: temporaryContent.length,
      eventsCount: events.length,
      content: temporaryContent
    });
  }

  return states;
}

export function getStateContent(
  fileId: string,
  stateId: string
): { content: string; stateType: string } | null {
  if (stateId === "temporary") {
    const latestSnapshot = loadLatestSnapshot(fileId);
    const events = loadEvents(fileId);
    const base = latestSnapshot ? latestSnapshot.content : "";
    const content = applyEvents(base, events);
    return { content, stateType: "temporary" };
  }
  if (stateId.startsWith("snap_")) {
    const ts = Number(stateId.replace("snap_", ""));
    if (Number.isNaN(ts)) return null;
    const snap = loadSnapshotByTs(fileId, ts);
    if (!snap) return null;
    return { content: snap.content, stateType: snap.stateType };
  }
  return null;
}

export function getBestRecoverableContent(fileId: string): {
  content: string;
  stateId: string;
  stateType: string;
} | null {
  const states = listFileStates(fileId);
  const metaOnly = states.filter(
    (s): s is FileStateMeta =>
      s.id === "temporary" || s.id.startsWith("snap_")
  );
  if (metaOnly.length === 0) return null;
  const best = selectBestState(metaOnly);
  if (!best) return null;
  const out = getStateContent(fileId, best.id);
  if (!out) return null;
  return { content: out.content, stateId: best.id, stateType: out.stateType };
}
