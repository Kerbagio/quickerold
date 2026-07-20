// OpenStreetMap Overpass API service for fetching real hospital data
// No API key required

export interface OSMHospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tags?: Record<string, string>;
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const REQUEST_TIMEOUT_MS = 6500;
const MAX_ATTEMPTS = 2;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchFromEndpoint = async (
  endpoint: string,
  query: string,
): Promise<OSMHospital[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass request failed with ${response.status}`);
    }

    const data = await response.json();
    const elements: any[] = data?.elements || [];

    return elements
      .map((element) => {
        const center = element.type === "node"
          ? { lat: element.lat, lon: element.lon }
          : element.center;

        if (!center) return null;

        return {
          id: String(element.id),
          name: element.tags?.name || "Unnamed Hospital",
          lat: center.lat,
          lng: center.lon,
          tags: element.tags || {},
        } as OSMHospital;
      })
      .filter((hospital): hospital is OSMHospital => Boolean(hospital));
  } finally {
    clearTimeout(timeoutId);
  }
};

const deduplicateHospitals = (hospitals: OSMHospital[]) => {
  const seen = new Set<string>();

  return hospitals.filter((hospital) => {
    const key = `${hospital.id}:${hospital.lat.toFixed(5)}:${hospital.lng.toFixed(5)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Fetch hospitals near a coordinate using both free Overpass providers.
// Providers are queried in parallel and the whole operation retries only once.
export async function fetchHospitalsFromOSM(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<OSMHospital[]> {
  const radiusMeters = Math.min(Math.max(Math.round(radiusKm * 1000), 300), 25000);

  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      relation["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
    );
    out center tags 50;
  `;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const results = await Promise.allSettled(
      OVERPASS_ENDPOINTS.map((endpoint) => fetchFromEndpoint(endpoint, query)),
    );

    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<OSMHospital[]> => result.status === "fulfilled")
      .flatMap((result) => result.value);

    if (successfulResults.length > 0) {
      return deduplicateHospitals(successfulResults);
    }

    const everyProviderResponded = results.every((result) => result.status === "fulfilled");
    if (everyProviderResponded) {
      return [];
    }

    if (attempt < MAX_ATTEMPTS - 1) {
      await wait(350);
    }
  }

  return [];
}
