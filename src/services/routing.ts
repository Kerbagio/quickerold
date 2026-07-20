export type EtaSource = "live-traffic" | "road-network" | "distance-estimate";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RoutingCandidate extends Coordinate {
  id: string;
}

export interface RouteEstimate {
  hospitalId: string;
  durationMinutes: number;
  distanceKm: number;
  trafficDelayMinutes?: number;
  source: EtaSource;
}

export interface RoutingResult {
  estimates: RouteEstimate[];
  source: EtaSource;
  generatedAt: string;
  notice: string;
}

interface OsrmTableResponse {
  code?: string;
  durations?: Array<Array<number | null>>;
  distances?: Array<Array<number | null>>;
}

interface TomTomMatrixCell {
  destinationIndex: number;
  routeSummary?: {
    lengthInMeters?: number;
    travelTimeInSeconds?: number;
    trafficDelayInSeconds?: number;
  };
}

interface TomTomMatrixResponse {
  data?: TomTomMatrixCell[];
}

const OSRM_TABLE_URL = "https://router.project-osrm.org/table/v1/driving";
const ROAD_CANDIDATE_LIMIT = 12;
const LIVE_TRAFFIC_CANDIDATE_LIMIT = 5;
const DISPLAY_CANDIDATE_LIMIT = 8;
const ROAD_REQUEST_TIMEOUT_MS = 7_000;
const TRAFFIC_REQUEST_TIMEOUT_MS = 5_000;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export function haversineKm(a: Coordinate, b: Coordinate): number {
  const radiusKm = 6371;
  const latitudeDelta = ((b.lat - a.lat) * Math.PI) / 180;
  const longitudeDelta = ((b.lng - a.lng) * Math.PI) / 180;
  const latitudeA = (a.lat * Math.PI) / 180;
  const latitudeB = (b.lat * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) *
      Math.cos(latitudeB) *
      Math.sin(longitudeDelta / 2) ** 2;

  return radiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function distanceFallback(
  origin: Coordinate,
  candidates: RoutingCandidate[],
): RouteEstimate[] {
  return candidates.map((candidate) => {
    const distanceKm = haversineKm(origin, candidate);
    return {
      hospitalId: candidate.id,
      distanceKm,
      durationMinutes: Math.max(3, Math.round((distanceKm / 30) * 60)),
      source: "distance-estimate" as const,
    };
  });
}

async function fetchRoadNetworkEstimates(
  origin: Coordinate,
  candidates: RoutingCandidate[],
): Promise<RouteEstimate[]> {
  const coordinates = [origin, ...candidates]
    .map((coordinate) => `${coordinate.lng},${coordinate.lat}`)
    .join(";");
  const destinationIndexes = candidates
    .map((_, index) => String(index + 1))
    .join(";");
  const url = `${OSRM_TABLE_URL}/${coordinates}?sources=0&destinations=${destinationIndexes}&annotations=duration,distance`;
  const response = await fetchWithTimeout(
    url,
    undefined,
    ROAD_REQUEST_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(`OSRM table request failed with ${response.status}`);
  }

  const payload = (await response.json()) as OsrmTableResponse;
  if (payload.code !== "Ok" || !payload.durations?.[0]) {
    throw new Error("OSRM returned no route matrix");
  }

  return candidates.map((candidate, index) => {
    const durationSeconds = payload.durations?.[0]?.[index];
    if (durationSeconds == null) {
      throw new Error("OSRM could not route one of the hospitals");
    }

    const fallbackDistance = haversineKm(origin, candidate);
    const distanceMeters = payload.distances?.[0]?.[index];
    return {
      hospitalId: candidate.id,
      durationMinutes: Math.max(1, Math.ceil(durationSeconds / 60)),
      distanceKm:
        distanceMeters == null ? fallbackDistance : distanceMeters / 1000,
      source: "road-network" as const,
    };
  });
}

async function fetchLiveTrafficEstimates(
  origin: Coordinate,
  candidates: RoutingCandidate[],
): Promise<RouteEstimate[]> {
  const response = await fetchWithTimeout(
    "/api/traffic",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, candidates }),
    },
    TRAFFIC_REQUEST_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(`TomTom traffic request failed with ${response.status}`);
  }

  const payload = (await response.json()) as TomTomMatrixResponse;
  const estimates = (payload.data ?? []).flatMap((cell) => {
    const candidate = candidates[cell.destinationIndex];
    const summary = cell.routeSummary;
    if (!candidate || summary?.travelTimeInSeconds == null) return [];

    return [
      {
        hospitalId: candidate.id,
        durationMinutes: Math.max(
          1,
          Math.ceil(summary.travelTimeInSeconds / 60),
        ),
        distanceKm:
          summary.lengthInMeters == null
            ? haversineKm(origin, candidate)
            : summary.lengthInMeters / 1000,
        trafficDelayMinutes:
          summary.trafficDelayInSeconds == null
            ? undefined
            : Math.max(0, Math.round(summary.trafficDelayInSeconds / 60)),
        source: "live-traffic" as const,
      },
    ];
  });

  if (estimates.length === 0) {
    throw new Error("TomTom returned no live routes");
  }

  return estimates;
}

export async function calculateHospitalEtas(
  origin: Coordinate,
  hospitals: RoutingCandidate[],
): Promise<RoutingResult> {
  const generatedAt = new Date().toISOString();
  const nearestCandidates = [...hospitals]
    .sort(
      (first, second) =>
        haversineKm(origin, first) - haversineKm(origin, second),
    )
    .slice(0, ROAD_CANDIDATE_LIMIT);

  let roadEstimates: RouteEstimate[];
  try {
    roadEstimates = await fetchRoadNetworkEstimates(origin, nearestCandidates);
  } catch {
    const estimates = distanceFallback(origin, nearestCandidates)
      .sort((a, b) => a.durationMinutes - b.durationMinutes)
      .slice(0, DISPLAY_CANDIDATE_LIMIT);
    return {
      estimates,
      source: "distance-estimate",
      generatedAt,
      notice:
        "Routing services are unavailable. Times are clearly labelled distance estimates.",
    };
  }

  const roadRanked = [...roadEstimates].sort(
    (a, b) => a.durationMinutes - b.durationMinutes,
  );
  {
    const candidateById = new Map(
      nearestCandidates.map((candidate) => [candidate.id, candidate]),
    );
    const liveCandidates = roadRanked
      .slice(0, LIVE_TRAFFIC_CANDIDATE_LIMIT)
      .flatMap((estimate) => {
        const candidate = candidateById.get(estimate.hospitalId);
        return candidate ? [candidate] : [];
      });

    try {
      const liveEstimates = await fetchLiveTrafficEstimates(
        origin,
        liveCandidates,
      );
      const liveEstimateById = new Map(
        liveEstimates.map((estimate) => [estimate.hospitalId, estimate]),
      );
      const completeEstimates = roadRanked
        .slice(0, DISPLAY_CANDIDATE_LIMIT)
        .map(
          (roadEstimate) =>
            liveEstimateById.get(roadEstimate.hospitalId) ?? roadEstimate,
        );

      return {
        estimates: completeEstimates.sort(
          (a, b) => a.durationMinutes - b.durationMinutes,
        ),
        source: "live-traffic",
        generatedAt,
        notice:
          "Live traffic compared the five fastest road candidates; remaining candidates use road-network ETAs to protect the free quota.",
      };
    } catch {
      // Fall through to the honest no-traffic result when the free quota or provider is unavailable.
    }
  }

  return {
    estimates: roadRanked.slice(0, DISPLAY_CANDIDATE_LIMIT),
    source: "road-network",
    generatedAt,
    notice:
      "Live traffic is unavailable or not configured; showing real road-network ETAs.",
  };
}
