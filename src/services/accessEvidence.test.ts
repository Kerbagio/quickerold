import { describe, expect, it } from "vitest";
import { summarizeAccessEvidence } from "@/services/accessEvidence";

describe("access evidence summary", () => {
  it("counts ETA bands and only explicit positive metadata", () => {
    const summary = summarizeAccessEvidence([
      {
        etaMinutes: 4,
        tags: { wheelchair: "yes", emergency: "yes", opening_hours: "24/7" },
      },
      { etaMinutes: 9, tags: { wheelchair: "no" } },
      { etaMinutes: 14, tags: {} },
    ]);

    expect(summary.withinFiveMinutes).toBe(1);
    expect(summary.withinTenMinutes).toBe(2);
    expect(summary.withinFifteenMinutes).toBe(3);
    expect(summary.wheelchairTagged).toBe(1);
    expect(summary.emergencyTagged).toBe(1);
    expect(summary.alwaysOpenTagged).toBe(1);
    expect(summary.metadataCoveragePercent).toBe(33);
  });
});
