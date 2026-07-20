import { describe, expect, it } from "vitest";
import type { DecisionRecord } from "@/services/analytics";
import {
  deterministicDecisionBrief,
  isSafeModelDecisionBrief,
} from "@/services/decisionAI";

const decision: DecisionRecord = {
  timestamp: "2026-07-20T00:00:00.000Z",
  emergencyType: "general",
  candidateCount: 6,
  recommendedHospital: "Saint George Hospital",
  etaMinutes: 8,
  etaSource: "road-network",
  availability: "accepting",
  nearestHospital: "Coastal Medical Center",
  nearestEtaMinutes: 12,
  timeDeltaVsNearest: 4,
  selectionReason: "faster-than-nearest",
};

describe("AI decision brief guardrails", () => {
  it("accepts a factual brief containing the recommendation and ETA", () => {
    expect(
      isSafeModelDecisionBrief(
        "QuickER recommends Saint George Hospital after comparing current routes. Its ranked road ETA is 8 minutes, while facility capability still needs confirmation.",
        decision,
      ),
    ).toBe(true);
  });

  it("rejects unsupported clinical claims and missing routing facts", () => {
    expect(
      isSafeModelDecisionBrief(
        "Saint George Hospital can definitely treat this condition in 8 minutes.",
        decision,
      ),
    ).toBe(false);
    expect(isSafeModelDecisionBrief("This option looks suitable.", decision)).toBe(
      false,
    );
  });

  it("always provides a factual deterministic fallback", () => {
    const brief = deterministicDecisionBrief(decision);

    expect(brief.mode).toBe("deterministic");
    expect(brief.text).toContain("Saint George Hospital");
    expect(brief.text).toContain("8 minutes");
    expect(brief.text).toContain("4 minutes faster");
  });

  it("explains availability before the closest-route comparison", () => {
    const brief = deterministicDecisionBrief({
      ...decision,
      recommendedHospital: "Makassed General Hospital",
      etaMinutes: 7,
      availability: "accepting",
      nearestHospital: "Hotel-Dieu de France",
      nearestEtaMinutes: 8,
      timeDeltaVsNearest: 1,
      fastestHospital: "Saint George Hospital",
      fastestEtaMinutes: 6,
      selectionReason: "availability-tradeoff",
    });

    expect(brief.text).toContain("raw fastest ETA belongs to Saint George Hospital");
    expect(brief.text).toContain("adds 1 minute");
  });
});
