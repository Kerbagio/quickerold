import { recordDecision } from "@/services/analytics";
import {
  type AvailabilityRecord,
  getAvailability,
  sortForDispatch,
} from "@/services/availability";
import {
  normalizeEmergencyType,
  type EmergencyType,
} from "@/services/emergency";
import { buildDecisionEvidence } from "@/services/decisionEvidence";
import {
  type OSMHospital,
  fetchHospitalsFromOSM,
} from "@/services/osm";
import {
  calculateHospitalEtas,
  haversineKm,
  type Coordinate,
  type EtaSource,
} from "@/services/routing";

export type SpecialtyMatch = "tagged" | "name-match" | "unknown";

export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  eta: string;
  etaMinutes: number;
  etaSource: EtaSource;
  distance: string;
  distanceKm: number;
  specialty: string;
  specialtyMatch: SpecialtyMatch;
  trafficDelayMinutes?: number;
  availability: AvailabilityRecord;
  tags: Record<string, string>;
}

export interface HospitalSearchOptions {
  radius?: number;
  emergencyType?: string;
}

export interface RoutingStatus {
  source: EtaSource | null;
  notice: string;
  generatedAt: string | null;
}

export interface HospitalSearchResult {
  origin: Coordinate;
  radiusKm: number;
  emergencyType: EmergencyType;
  hospitals: Hospital[];
  bestOption: Hospital;
  routingStatus: RoutingStatus;
  specialtyFallback: boolean;
}

export type HospitalSearchErrorCode =
  | "offline"
  | "no-hospitals"
  | "no-routes"
  | "provider-unavailable"
  | "unknown";

export class HospitalSearchError extends Error {
  code: HospitalSearchErrorCode;

  constructor(code: HospitalSearchErrorCode, message?: string) {
    super(message ?? code);
    this.name = "HospitalSearchError";
    this.code = code;
  }
}

const emergencyTerms: Record<Exclude<EmergencyType, "general">, string[]> = {
  cardiac: ["cardio", "cardiac", "heart"],
  pediatric: ["paediatric", "pediatric", "children", "child", "kids"],
  maternity: ["maternity", "obstetric", "gynaec", "gynec", "women", "birth"],
};

function getSpecialtyMatch(
  hospital: OSMHospital,
  emergencyType: EmergencyType,
): SpecialtyMatch {
  if (emergencyType === "general") return "tagged";

  const terms = emergencyTerms[emergencyType];
  const taggedSpecialty = [
    hospital.tags?.["healthcare:speciality"],
    hospital.tags?.["healthcare:specialty"],
    hospital.tags?.["medical_system"],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (terms.some((term) => taggedSpecialty.includes(term))) return "tagged";

  const name = hospital.name.toLowerCase();
  return terms.some((term) => name.includes(term)) ? "name-match" : "unknown";
}

function specialtyLabel(
  hospital: OSMHospital,
  emergencyType: EmergencyType,
  match: SpecialtyMatch,
): string {
  const tagged =
    hospital.tags?.["healthcare:speciality"] ??
    hospital.tags?.["healthcare:specialty"];
  if (tagged) return tagged.split(";").join(", ");
  if (match !== "unknown" && emergencyType !== "general") {
    return `${emergencyType[0].toUpperCase()}${emergencyType.slice(1)} match`;
  }
  return hospital.tags?.emergency === "yes" ? "General ER" : "Hospital";
}

export function hospitalSearchErrorMessage(error: unknown): string {
  const code =
    error instanceof HospitalSearchError ? error.code : ("unknown" as const);

  if (code === "offline") return "You're offline. Reconnect and try again.";
  if (code === "no-hospitals") {
    return "No hospitals were found nearby. Expand the radius or contact local emergency services.";
  }
  if (code === "no-routes") {
    return "Hospitals were found, but no usable route could be calculated. Try again or contact local emergency services.";
  }
  if (code === "provider-unavailable") {
    return "The public hospital-data service is temporarily unavailable. Try again shortly or contact local emergency services.";
  }
  return "Hospital data could not be loaded. Please try again.";
}

export async function searchHospitals(
  lat: number,
  lng: number,
  options: HospitalSearchOptions = {},
): Promise<HospitalSearchResult> {
  const radiusKm = Math.min(Math.max(options.radius ?? 8, 2), 25);
  const emergencyType = normalizeEmergencyType(
    options.emergencyType ?? "general",
  );

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new HospitalSearchError("offline");
  }

  let osmHospitals: OSMHospital[];
  try {
    osmHospitals = await fetchHospitalsFromOSM(lat, lng, radiusKm);
  } catch {
    throw new HospitalSearchError("provider-unavailable");
  }
  if (osmHospitals.length === 0) {
    throw new HospitalSearchError("no-hospitals");
  }

  const withMatches = osmHospitals.map((hospital) => ({
    hospital,
    match: getSpecialtyMatch(hospital, emergencyType),
  }));
  const matchingHospitals =
    emergencyType === "general"
      ? withMatches
      : withMatches.filter(({ match }) => match !== "unknown");
  const specialtyFallback =
    emergencyType !== "general" && matchingHospitals.length === 0;
  const hospitalsToRoute = specialtyFallback ? withMatches : matchingHospitals;

  const origin = { lat, lng };
  const routingResult = await calculateHospitalEtas(
    origin,
    hospitalsToRoute.map(({ hospital }) => ({
      id: hospital.id,
      lat: hospital.lat,
      lng: hospital.lng,
    })),
  );
  const routeByHospitalId = new Map(
    routingResult.estimates.map((estimate) => [
      estimate.hospitalId,
      estimate,
    ]),
  );

  const enriched = hospitalsToRoute.flatMap(({ hospital, match }) => {
    const route = routeByHospitalId.get(hospital.id);
    if (!route) return [];

    const distanceKm = route.distanceKm || haversineKm(origin, hospital);
    return [
      {
        id: hospital.id,
        name: hospital.name,
        lat: hospital.lat,
        lng: hospital.lng,
        eta: `${route.durationMinutes} min`,
        etaMinutes: route.durationMinutes,
        etaSource: route.source,
        distance: `${distanceKm.toFixed(1)} km`,
        distanceKm,
        specialty: specialtyLabel(hospital, emergencyType, match),
        specialtyMatch: match,
        trafficDelayMinutes: route.trafficDelayMinutes,
        availability: getAvailability(hospital.id),
        tags: hospital.tags ?? {},
      } satisfies Hospital,
    ];
  });

  const hospitals = sortForDispatch(enriched);
  const bestOption = hospitals[0];
  if (!bestOption) throw new HospitalSearchError("no-routes");
  const evidence = buildDecisionEvidence(hospitals);

  recordDecision({
    timestamp: new Date().toISOString(),
    emergencyType,
    candidateCount: hospitals.length,
    recommendedHospital: bestOption.name,
    etaMinutes: bestOption.etaMinutes,
    etaSource: bestOption.etaSource,
    availability: bestOption.availability.status,
    nearestHospital: evidence?.nearestByDistance.name,
    nearestEtaMinutes: evidence?.nearestByDistance.etaMinutes,
    nearestDistanceKm: evidence?.nearestByDistance.distanceKm,
    fastestHospital: evidence?.fastestByEta.name,
    fastestEtaMinutes: evidence?.fastestByEta.etaMinutes,
    recommendedDistanceKm: bestOption.distanceKm,
    timeDeltaVsNearest: evidence?.timeDeltaVsNearest,
    selectionReason: evidence?.reason,
  });

  return {
    origin,
    radiusKm,
    emergencyType,
    hospitals,
    bestOption,
    routingStatus: {
      source: routingResult.source,
      notice: routingResult.notice,
      generatedAt: routingResult.generatedAt,
    },
    specialtyFallback,
  };
}
