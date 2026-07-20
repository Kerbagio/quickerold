import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchHospitalsFromOSM } from "@/services/osm";

describe("fetchHospitalsFromOSM", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the first working Overpass provider result when another fails", async () => {
    const successfulResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        elements: [
          {
            id: 42,
            type: "node",
            lat: 33.9,
            lon: 35.5,
            tags: { amenity: "hospital", name: "Test Hospital" },
          },
        ],
      }),
    } as unknown as Response;

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("provider unavailable"))
      .mockResolvedValueOnce(successfulResponse);

    const hospitals = await fetchHospitalsFromOSM(33.90001, 35.50001, 8);

    expect(hospitals).toEqual([
      expect.objectContaining({
        id: "node-42",
        name: "Test Hospital",
      }),
    ]);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("falls back to Photon when Overpass providers fail", async () => {
    const photonResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        features: [
          {
            geometry: { coordinates: [35.5018, 33.8938] },
            properties: {
              osm_id: 99,
              osm_type: "N",
              name: "Photon Hospital",
              amenity: "hospital",
            },
          },
        ],
      }),
    } as unknown as Response;

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("photon.komoot.io")) {
        return Promise.resolve(photonResponse);
      }
      return Promise.reject(new TypeError("overpass down"));
    });

    const hospitals = await fetchHospitalsFromOSM(33.8938, 35.5018, 8);

    expect(hospitals).toEqual([
      expect.objectContaining({
        id: "node-99",
        name: "Photon Hospital",
      }),
    ]);
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).includes("photon.komoot.io"),
      ),
    ).toBe(true);
  });
});
