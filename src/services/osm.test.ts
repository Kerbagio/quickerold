import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchHospitalsFromOSM } from "@/services/osm";

describe("fetchHospitalsFromOSM", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the first working provider result when another provider fails", async () => {
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
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
