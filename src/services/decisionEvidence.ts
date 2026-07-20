import type { AvailabilityStatus } from "@/services/availability";

export type DecisionReason =
  | "nearest-is-best"
  | "faster-than-nearest"
  | "availability-tradeoff";

export interface ComparableHospital {
  id: string;
  name: string;
  etaMinutes: number;
  distanceKm: number;
  availability: { status: AvailabilityStatus };
}

export interface DecisionEvidence<T extends ComparableHospital> {
  recommended: T;
  nearestByDistance: T;
  fastestByEta: T;
  reason: DecisionReason;
  /** Positive means the recommendation is faster than the nearest option. */
  timeDeltaVsNearest: number;
  /** Positive means suitability/availability adds time over the raw fastest ETA. */
  timeDeltaVsFastest: number;
  distanceDeltaVsNearest: number;
}

export function buildDecisionEvidence<T extends ComparableHospital>(
  rankedHospitals: T[],
): DecisionEvidence<T> | null {
  const recommended = rankedHospitals[0];
  if (!recommended) return null;

  const nearestByDistance = rankedHospitals.reduce((nearest, hospital) =>
    hospital.distanceKm < nearest.distanceKm ? hospital : nearest,
  );
  const fastestByEta = rankedHospitals.reduce((fastest, hospital) =>
    hospital.etaMinutes < fastest.etaMinutes ? hospital : fastest,
  );
  const timeDeltaVsNearest =
    nearestByDistance.etaMinutes - recommended.etaMinutes;
  const timeDeltaVsFastest =
    recommended.etaMinutes - fastestByEta.etaMinutes;

  let reason: DecisionReason = "availability-tradeoff";
  if (
    recommended.id === nearestByDistance.id &&
    recommended.id === fastestByEta.id
  ) {
    reason = "nearest-is-best";
  } else if (
    recommended.id !== fastestByEta.id &&
    timeDeltaVsFastest > 0
  ) {
    reason = "availability-tradeoff";
  } else if (timeDeltaVsNearest > 0) {
    reason = "faster-than-nearest";
  }

  return {
    recommended,
    nearestByDistance,
    fastestByEta,
    reason,
    timeDeltaVsNearest,
    timeDeltaVsFastest,
    distanceDeltaVsNearest:
      recommended.distanceKm - nearestByDistance.distanceKm,
  };
}
