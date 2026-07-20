// OpenStreetMap Overpass API service for fetching real hospital data
// No API key required

export interface OSMHospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tags?: Record<string, string>;
}

interface OverpassElement {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

// Fetch hospitals near a coordinate using Overpass API (free)
export async function fetchHospitalsFromOSM(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<OSMHospital[]> {
  const radiusMeters = Math.min(Math.max(Math.round(radiusKm * 1000), 300), 25000); // clamp 0.3km - 25km

  const query = `
    [out:json][timeout:25];
    (
      nwr["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      nwr["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
    );
    out center tags 50;
  `;

  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!res.ok) {
        // Try next endpoint
        continue;
      }

      const data = (await res.json()) as OverpassResponse;
      const elements = data.elements ?? [];

      const hospitals: OSMHospital[] = elements
        .map((el) => {
          const center = el.type === "node" ? { lat: el.lat, lon: el.lon } : el.center;
          if (!center) return null;
          const name: string = el.tags?.name || "Unnamed Hospital";
          return {
            id: `${el.type}-${el.id}`,
            name,
            lat: center.lat,
            lng: center.lon,
            tags: el.tags || {},
          } as OSMHospital;
        })
        .filter((hospital): hospital is OSMHospital => hospital !== null);

      return [...new Map(hospitals.map((hospital) => [hospital.id, hospital])).values()];
    } catch (e) {
      // Try next endpoint on any error
      continue;
    }
  }

  throw new Error("OpenStreetMap Overpass providers are unavailable");
}
