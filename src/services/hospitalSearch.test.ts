import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchHospitalsFromOSM: vi.fn(),
  calculateHospitalEtas: vi.fn(),
  recordDecision: vi.fn(),
}));

vi.mock("@/services/osm", () => ({
  fetchHospitalsFromOSM: mocks.fetchHospitalsFromOSM,
}));

vi.mock("@/services/routing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/routing")>();
  return {
    ...actual,
    calculateHospitalEtas: mocks.calculateHospitalEtas,
  };
});

vi.mock("@/services/analytics", () => ({
  recordDecision: mocks.recordDecision,
}));

import {
  HospitalSearchError,
  searchHospitals,
} from "@/services/hospitalSearch";

describe("searchHospitals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("navigator", { onLine: true });
  });

  afterAll(() => vi.unstubAllGlobals());

  it("runs discovery and routing, then returns and records the fastest option", async () => {
    mocks.fetchHospitalsFromOSM.mockResolvedValue([
      {
        id: "hospital-a",
        name: "Hospital A",
        lat: 33.9,
        lng: 35.5,
        tags: { emergency: "yes" },
      },
      {
        id: "hospital-b",
        name: "Hospital B",
        lat: 33.91,
        lng: 35.51,
        tags: { emergency: "yes" },
      },
    ]);
    mocks.calculateHospitalEtas.mockResolvedValue({
      estimates: [
        {
          hospitalId: "hospital-a",
          durationMinutes: 12,
          distanceKm: 4.2,
          source: "road-network",
        },
        {
          hospitalId: "hospital-b",
          durationMinutes: 7,
          distanceKm: 3.4,
          source: "road-network",
        },
      ],
      source: "road-network",
      notice: "Road ETAs",
      generatedAt: "2026-07-20T00:00:00.000Z",
    });

    const result = await searchHospitals(33.89, 35.5, {
      radius: 8,
      emergencyType: "general",
    });

    expect(result.bestOption.name).toBe("Hospital B");
    expect(result.bestOption.etaMinutes).toBe(7);
    expect(result.hospitals).toHaveLength(2);
    expect(mocks.recordDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        recommendedHospital: "Hospital B",
        etaMinutes: 7,
        candidateCount: 2,
      }),
    );
  });

  it("labels the result when specialty metadata is unavailable", async () => {
    mocks.fetchHospitalsFromOSM.mockResolvedValue([
      {
        id: "general-hospital",
        name: "General Hospital",
        lat: 33.9,
        lng: 35.5,
        tags: { emergency: "yes" },
      },
    ]);
    mocks.calculateHospitalEtas.mockResolvedValue({
      estimates: [
        {
          hospitalId: "general-hospital",
          durationMinutes: 9,
          distanceKm: 2.5,
          source: "road-network",
        },
      ],
      source: "road-network",
      notice: "Road ETAs",
      generatedAt: "2026-07-20T00:00:00.000Z",
    });

    const result = await searchHospitals(33.89, 35.5, {
      emergencyType: "pediatric",
    });

    expect(result.specialtyFallback).toBe(true);
    expect(result.bestOption.specialtyMatch).toBe("unknown");
  });

  it("can build a dashboard or scenario snapshot without inflating decision history", async () => {
    mocks.fetchHospitalsFromOSM.mockResolvedValue([
      {
        id: "hospital-a",
        name: "Hospital A",
        lat: 33.9,
        lng: 35.5,
        tags: { emergency: "yes" },
      },
    ]);
    mocks.calculateHospitalEtas.mockResolvedValue({
      estimates: [
        {
          hospitalId: "hospital-a",
          durationMinutes: 6,
          distanceKm: 2,
          source: "road-network",
        },
      ],
      source: "road-network",
      notice: "Road ETAs",
      generatedAt: "2026-07-20T00:00:00.000Z",
    });

    await searchHospitals(33.89, 35.5, {
      emergencyType: "general",
      recordDecision: false,
    });

    expect(mocks.recordDecision).not.toHaveBeenCalled();
  });

  it("returns a typed error when discovery finds no hospitals", async () => {
    mocks.fetchHospitalsFromOSM.mockResolvedValue([]);

    await expect(searchHospitals(33.89, 35.5)).rejects.toMatchObject({
      name: "HospitalSearchError",
      code: "no-hospitals",
    } satisfies Partial<HospitalSearchError>);
  });

  it("distinguishes a public provider outage from an empty local result", async () => {
    mocks.fetchHospitalsFromOSM.mockRejectedValue(new Error("provider down"));

    await expect(searchHospitals(33.89, 35.5)).rejects.toMatchObject({
      name: "HospitalSearchError",
      code: "provider-unavailable",
    } satisfies Partial<HospitalSearchError>);
  });
});
