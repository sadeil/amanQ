/**
 * Quantum-inspired decision engine: scores file states and selects the most
 * reliable version for recovery.
 * Score = 0.4 × Recency + 0.3 × Integrity + 0.3 × Completeness
 */

export type FileStateMeta = {
  id: string;
  stateType: "saved" | "auto_save" | "temporary" | "backup";
  timestamp: number;
  contentLength: number;
  integrityHash?: string;
  eventsCount?: number;
};

const RECENCY_WEIGHT = 0.4;
const INTEGRITY_WEIGHT = 0.3;
const COMPLETENESS_WEIGHT = 0.3;

/**
 * Normalize recency: newer = higher score (0–1).
 * Uses exponential decay so very old states get near 0.
 */
function recencyScore(timestamp: number, now: number): number {
  const ageMs = now - timestamp;
  const halfLifeMs = 60 * 60 * 1000; // 1 hour
  return Math.exp(-ageMs / halfLifeMs);
}

/**
 * Integrity: 1 if hash present and non-empty, else 0.5 (unknown).
 */
function integrityScore(integrityHash?: string): number {
  return integrityHash && integrityHash.length > 0 ? 1 : 0.5;
}

/**
 * Completeness: full content = 1; partial or event-based = 0.7–0.9 by length.
 */
function completenessScore(state: FileStateMeta): number {
  if (state.stateType === "saved" || state.stateType === "backup") return 1;
  if (state.contentLength > 10000) return 1;
  if (state.contentLength > 1000) return 0.9;
  if (state.contentLength > 0) return 0.8;
  return 0.5;
}

export function scoreState(state: FileStateMeta, now: number = Date.now()): number {
  const recency = recencyScore(state.timestamp, now);
  const integrity = integrityScore(state.integrityHash);
  const completeness = completenessScore(state);
  return (
    RECENCY_WEIGHT * recency +
    INTEGRITY_WEIGHT * integrity +
    COMPLETENESS_WEIGHT * completeness
  );
}

export function selectBestState(
  states: FileStateMeta[],
  now: number = Date.now()
): FileStateMeta | null {
  if (states.length === 0) return null;
  const withScores = states.map((s) => ({
    state: s,
    score: scoreState(s, now)
  }));
  withScores.sort((a, b) => b.score - a.score);
  return withScores[0].state;
}
