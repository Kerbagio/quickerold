// OpenStreetMap hospital discovery (free providers, no API key)

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

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    osm_key?: string;
    osm_value?: string;
    healthcare?: string;
    amenity?: string;
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20_000;
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const hospitalCache = new Map<string, HospitalCacheEntry>();
const pendingRequests = new Map<string, Promise<OSMHospital[]>>();

function searchKey(lat: number, lng: number, radiusKm: number): string {
  return `${lat.toFixed(5)}:${lng.toFixed(5)}:${radiusKm.toFixed(1)}`;
}

function wait(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function dedupeHospitals(hospitals: OSMHospital[]): OSMHospital[] {
  return [
    ...new Map(hospitals.map((hospital) => [hospital.id, hospital])).values(),
  ];
}

function parseOverpassHospitals(data: OverpassResponse): OSMHospital[] {
  const hospitals = (data.elements ?? []).flatMap((el) => {
    const center = el.type === "node" ? { lat: el.lat, lon: el.lon } : el.center;
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
  return dedupeHospitals(hospitals);
}

async function fetchFromOverpass(
  endpoint: string,
  query: string,
): Promise<OSMHospital[]> {
  const res = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    throw new Error(`Overpass ${endpoint} returned ${res.status}`);
  }

  const data = (await res.json()) as OverpassResponse;
  return parseOverpassHospitals(data);
}

async function loadFromOverpass(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<OSMHospital[]> {
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      relation["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
      way["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
    );
    out center tags 50;
  `;

  let lastError: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const hospitals = await fetchFromOverpass(endpoint, query);
      // A successful empty answer is still valid for this provider.
      return hospitals;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Overpass providers failed");
}

function photonOsmId(feature: PhotonFeature): string {
  const osmType =
    feature.properties?.osm_type === "W"
      ? "way"
      : feature.properties?.osm_type === "R"
        ? "relation"
        : "node";
  const osmId = feature.properties?.osm_id ?? 0;
  return `${osmType}-${osmId}`;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function loadFromPhoton(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<OSMHospital[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", "hospital");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("limit", "40");
  url.searchParams.set("osm_tag", "amenity:hospital");

  const res = await fetchWithTimeout(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Photon returned ${res.status}`);

  const data = (await res.json()) as PhotonResponse;
  const hospitals = (data.features ?? []).flatMap((feature) => {
    const coordinates = feature.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) return [];
    const [featureLng, featureLat] = coordinates;
    if (
      !Number.isFinite(featureLat) ||
      !Number.isFinite(featureLng) ||
      haversineKm(lat, lng, featureLat, featureLng) > radiusKm
    ) {
      return [];
    }

    const tags: Record<string, string> = {
      amenity: feature.properties?.amenity || "hospital",
    };
    if (feature.properties?.healthcare) {
      tags.healthcare = feature.properties.healthcare;
    }

    return [
      {
        id: photonOsmId(feature),
        name: feature.properties?.name || "Unnamed Hospital",
        lat: featureLat,
        lng: featureLng,
        tags,
      } satisfies OSMHospital,
    ];
  });

  return dedupeHospitals(hospitals);
}

async function loadHospitalsFromProviders(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<OSMHospital[]> {
  const radiusKm = radiusMeters / 1000;

  try {
    const overpassHospitals = await loadFromOverpass(lat, lng, radiusMeters);
    if (overpassHospitals.length > 0) return overpassHospitals;
  } catch {
    // Fall through to Photon — Overpass is frequently rate-limited or slow.
  }

  // Brief pause before the backup provider to avoid stampedes on retries.
  await wait(200);

  try {
    const photonHospitals = await loadFromPhoton(lat, lng, radiusKm);
    if (photonHospitals.length > 0) return photonHospitals;
  } catch {
    // Continue to final failure below.
  }

  // One more Overpass pass after Photon failed — providers recover quickly.
  try {
    const retryHospitals = await loadFromOverpass(lat, lng, radiusMeters);
    return retryHospitals;
  } catch {
    throw new Error("OpenStreetMap hospital providers are unavailable");
  }
}

// Fetch hospitals near a coordinate using free OSM-backed providers.
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
