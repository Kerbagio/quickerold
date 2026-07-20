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

interface HospitalCacheEntry {
  expiresAt: number;
  hospitals: OSMHospital[];
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8_000;
const hospitalCache = new Map<string, HospitalCacheEntry>();
const pendingRequests = new Map<string, Promise<OSMHospital[]>>();

function searchKey(lat: number, lng: number, radiusKm: number): string {
  return `${lat.toFixed(5)}:${lng.toFixed(5)}:${radiusKm.toFixed(1)}`;
}

async function fetchWithTimeout(
  endpoint: string,
  query: string,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    return await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function loadHospitalsFromProviders(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<OSMHospital[]> {
  const query = `
    [out:json][timeout:10];
    (
      nwr["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      nwr["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
    );
    out center tags 50;
  `;

  const endpoints = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetchWithTimeout(endpoint, query);
      if (!res.ok) continue;

      const data = (await res.json()) as OverpassResponse;
      const elements = data.elements ?? [];
      const hospitals: OSMHospital[] = elements.flatMap((el) => {
        const center =
          el.type === "node" ? { lat: el.lat, lon: el.lon } : el.center;
        if (!center || center.lat == null || center.lon == null) return [];
        return [
          {
            id: `${el.type}-${el.id}`,
            name: el.tags?.name || "Unnamed Hospital",
            lat: center.lat,
            lng: center.lon,
            tags: el.tags || {},
          } satisfies OSMHospital,
        ];
      });

      return [
        ...new Map(
          hospitals.map((hospital) => [hospital.id, hospital]),
        ).values(),
      ];
    } catch {
      // A provider may be congested or offline; continue to the bounded fallback.
    }
  }

  throw new Error("OpenStreetMap Overpass providers are unavailable");
}

// Fetch hospitals near a coordinate using Overpass API (free)
export async function fetchHospitalsFromOSM(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<OSMHospital[]> {
  const radiusMeters = Math.min(
    Math.max(Math.round(radiusKm * 1000), 300),
    25000,
  );
  const key = searchKey(lat, lng, radiusMeters / 1000);
  const cached = hospitalCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.hospitals;

  const pending = pendingRequests.get(key);
  if (pending) return pending;

  const request = loadHospitalsFromProviders(lat, lng, radiusMeters)
    .then((hospitals) => {
      hospitalCache.set(key, {
        hospitals,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return hospitals;
    })
    .finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, request);
  return request;
}
