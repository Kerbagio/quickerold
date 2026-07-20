import { describe, expect, it } from "vitest";
import type { DecisionRecord } from "@/services/analytics";
import {
  deterministicExplanation,
  isSafeModelExplanation,
} from "@/services/agent";

const decision: DecisionRecord = {
  timestamp: "2026-07-20T00:00:00.000Z",
  emergencyType: "general",
  candidateCount: 6,
  recommendedHospital: "Saint George Hospital",
  etaMinutes: 8,
  etaSource: "road-network",
  availability: "accepting",
};

describe("agent explanation guardrails", () => {
  it("accepts a factual explanation containing the selected hospital and ETA", () => {
    expect(
      isSafeModelExplanation(
        "QuickER recommends Saint George Hospital after comparing six routes. Its ranked road ETA is 8 minutes; confirm current capability with the facility.",
        decision,
      ),
    ).toBe(true);
  });

  it("rejects unsupported medical claims and missing routing facts", () => {
    expect(
      isSafeModelExplanation(
        "Saint George Hospital can definitely treat this condition in 8 minutes.",
        decision,
      ),
    ).toBe(false);
    expect(
      isSafeModelExplanation("This option looks suitable.", decision),
    ).toBe(false);
  });

  it("always provides a deterministic fallback", () => {
    const explanation = deterministicExplanation(decision);

    expect(explanation.mode).toBe("deterministic");
    expect(explanation.text).toContain("Saint George Hospital");
    expect(explanation.text).toContain("8 minutes");
  });
});
