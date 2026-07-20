import type { Coordinate } from "@/services/routing";

export type IsochroneSource = "road-network" | "distance-estimate";

export interface IsochroneFeature {
  minutes: number;
  coordinates: number[][][];
}

interface OrsFeatureCollection {
  features?: Array<{
    properties?: { value?: number };
    geometry?: {
      type?: string;
      coordinates?: number[][][] | number[][][][];
    };
  }>;
}

export async function fetchRoadIsochrones(
  location: Coordinate,
): Promise<IsochroneFeature[] | null> {
  try {
    const response = await fetch("/api/isochrones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location }),
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as OrsFeatureCollection;

    return (payload.features ?? []).flatMap((feature) => {
      const value = feature.properties?.value;
      const geometry = feature.geometry;
      if (!value || !geometry?.coordinates) return [];

      const polygon =
        geometry.type === "MultiPolygon"
          ? (geometry.coordinates as number[][][][])[0]
          : (geometry.coordinates as number[][][]);
      return [{ minutes: Math.round(value / 60), coordinates: polygon }];
    });
  } catch {
    return null;
  }
}
