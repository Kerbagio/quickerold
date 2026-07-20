import { describe, expect, it } from "vitest";
import { buildDecisionEvidence } from "@/services/decisionEvidence";
import type { AvailabilityStatus } from "@/services/availability";

function hospital(
  id: string,
  etaMinutes: number,
  distanceKm: number,
  status: AvailabilityStatus = "unknown",
) {
  return {
    id,
    name: id,
    etaMinutes,
    distanceKm,
    availability: { status },
  };
}

describe("decision evidence", () => {
  it("shows when the recommendation beats the nearest hospital by ETA", () => {
    const evidence = buildDecisionEvidence([
      hospital("faster", 7, 4.2),
      hospital("nearest", 12, 2.1),
    ]);

    expect(evidence?.reason).toBe("faster-than-nearest");
    expect(evidence?.nearestByDistance.id).toBe("nearest");
    expect(evidence?.timeDeltaVsNearest).toBe(5);
  });

  it("shows the time tradeoff when availability changes the choice", () => {
    const evidence = buildDecisionEvidence([
      hospital("accepting", 11, 4, "accepting"),
      hospital("diverting", 6, 2, "diverting"),
    ]);

    expect(evidence?.reason).toBe("availability-tradeoff");
    expect(evidence?.fastestByEta.id).toBe("diverting");
    expect(evidence?.timeDeltaVsFastest).toBe(5);
  });

  it("prioritizes the availability tradeoff when the choice also beats the nearest route", () => {
    const evidence = buildDecisionEvidence([
      hospital("accepting", 7, 3.5, "accepting"),
      hospital("diverting", 6, 4.8, "diverting"),
      hospital("nearest", 8, 2.2, "unknown"),
    ]);

    expect(evidence?.reason).toBe("availability-tradeoff");
    expect(evidence?.timeDeltaVsFastest).toBe(1);
    expect(evidence?.timeDeltaVsNearest).toBe(1);
  });

  it("recognizes when one hospital is nearest, fastest, and recommended", () => {
    const evidence = buildDecisionEvidence([
      hospital("same", 6, 2),
      hospital("alternative", 9, 4),
    ]);

    expect(evidence?.reason).toBe("nearest-is-best");
    expect(evidence?.timeDeltaVsNearest).toBe(0);
  });
});
