import type { AvailabilityStatus } from "@/services/availability";
import type { DecisionReason } from "@/services/decisionEvidence";
import type { EtaSource } from "@/services/routing";

export interface DecisionRecord {
  timestamp: string;
  emergencyType: string;
  candidateCount: number;
  recommendedHospital: string;
  etaMinutes: number;
  etaSource: EtaSource;
  availability: AvailabilityStatus;
  nearestHospital?: string;
  nearestEtaMinutes?: number;
  nearestDistanceKm?: number;
  fastestHospital?: string;
  fastestEtaMinutes?: number;
  recommendedDistanceKm?: number;
  timeDeltaVsNearest?: number;
  selectionReason?: DecisionReason;
}

const STORAGE_KEY = "quicker.decisionHistory.v1";
const MAX_RECORDS = 50;
export const DECISION_HISTORY_UPDATED_EVENT =
  "quicker:decision-history-updated";

export function getDecisionHistory(): DecisionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as DecisionRecord[]) : [];
  } catch {
    return [];
  }
}

export function recordDecision(record: DecisionRecord): void {
  if (localStorage.getItem("analyticsOptIn") === "false") return;
  const history = [record, ...getDecisionHistory()].slice(0, MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event(DECISION_HISTORY_UPDATED_EVENT));
}
