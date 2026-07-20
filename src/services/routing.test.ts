import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculateHospitalEtas,
  haversineKm,
} from "@/services/routing";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("routing", () => {
  it("calculates realistic great-circle distance", () => {
    const distance = haversineKm(
      { lat: 33.8938, lng: 35.5018 },
      { lat: 33.8886, lng: 35.4955 },
    );
    expect(distance).toBeGreaterThan(0.7);
    expect(distance).toBeLessThan(1.0);
  });

  it("uses road ETAs when live traffic is unavailable", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: "Ok",
            durations: [[300, 600]],
            distances: [[2000, 5000]],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response("unconfigured", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await calculateHospitalEtas(
      { lat: 33.8938, lng: 35.5018 },
      [
        { id: "hospital-a", lat: 33.9, lng: 35.52 },
        { id: "hospital-b", lat: 33.89, lng: 35.51 },
      ],
    );

    expect(result.source).toBe("road-network");
    expect(result.estimates.map((estimate) => estimate.hospitalId)).toEqual([
      "hospital-b",
      "hospital-a",
    ]);
    expect(result.estimates[0]).toMatchObject({
      durationMinutes: 5,
      distanceKm: 2,
      source: "road-network",
    });
  });

  it("labels the last-resort distance fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })),
    );

    const result = await calculateHospitalEtas(
      { lat: 33.8938, lng: 35.5018 },
      [{ id: "hospital-a", lat: 33.9, lng: 35.52 }],
    );

    expect(result.source).toBe("distance-estimate");
    expect(result.estimates[0].source).toBe("distance-estimate");
    expect(result.notice).toContain("distance estimates");
  });
});
