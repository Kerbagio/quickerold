import { describe, expect, it } from "vitest";
import {
  sortForDispatch,
  type AvailabilityRecord,
  type AvailabilityStatus,
} from "@/services/availability";

const record = (status: AvailabilityStatus): AvailabilityRecord => ({
  status,
  source: status === "unknown" ? "unknown" : "demo",
  updatedAt: status === "unknown" ? null : "2026-07-20T00:00:00.000Z",
});

describe("sortForDispatch", () => {
  it("prioritizes eligibility tiers before ETA", () => {
    const result = sortForDispatch([
      { name: "Diverting", etaMinutes: 2, availability: record("diverting") },
      { name: "Unknown", etaMinutes: 3, availability: record("unknown") },
      { name: "Limited", etaMinutes: 7, availability: record("limited") },
      { name: "Accepting slow", etaMinutes: 12, availability: record("accepting") },
      { name: "Accepting fast", etaMinutes: 8, availability: record("accepting") },
    ]);

    expect(result.map((hospital) => hospital.name)).toEqual([
      "Accepting fast",
      "Accepting slow",
      "Limited",
      "Unknown",
      "Diverting",
    ]);
  });

  it("does not mutate the input array", () => {
    const input = [
      { name: "Second", etaMinutes: 10, availability: record("unknown") },
      { name: "First", etaMinutes: 5, availability: record("unknown") },
    ];

    sortForDispatch(input);
    expect(input.map((hospital) => hospital.name)).toEqual(["Second", "First"]);
  });
});
