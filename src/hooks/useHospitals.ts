import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  type OSMHospital,
  fetchHospitalsFromOSM,
} from "@/services/osm";
import {
  type EtaSource,
  calculateHospitalEtas,
  haversineKm,
} from "@/services/routing";
import {
  type AvailabilityRecord,
  getAvailability,
  sortForDispatch,
} from "@/services/availability";
import { recordDecision } from "@/services/analytics";

export type EmergencyType = "general" | "cardiac" | "pediatric" | "maternity";
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

interface UseHospitalsOptions {
  radius?: number;
  emergencyType?: string;
}

export interface RoutingStatus {
  source: EtaSource | null;
  notice: string;
  generatedAt: string | null;
}

interface UseHospitalsReturn {
  hospitals: Hospital[];
  loading: boolean;
  error: string | null;
  fetchHospitals: (
    lat: number,
    lng: number,
    options?: UseHospitalsOptions,
  ) => Promise<void>;
  bestOption: Hospital | null;
  routingStatus: RoutingStatus;
  specialtyFallback: boolean;
}

const emergencyTerms: Record<Exclude<EmergencyType, "general">, string[]> = {
  cardiac: ["cardio", "cardiac", "heart"],
  pediatric: ["paediatric", "pediatric", "children", "child", "kids"],
  maternity: ["maternity", "obstetric", "gynaec", "gynec", "women", "birth"],
};

function normalizeEmergencyType(value: string): EmergencyType {
  return ["general", "cardiac", "pediatric", "maternity"].includes(value)
    ? (value as EmergencyType)
    : "general";
}

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

export const useHospitals = (): UseHospitalsReturn => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specialtyFallback, setSpecialtyFallback] = useState(false);
  const [routingStatus, setRoutingStatus] = useState<RoutingStatus>({
    source: null,
    notice: "",
    generatedAt: null,
  });
  const { toast } = useToast();

  const fetchHospitals = useCallback(
    async (
      lat: number,
      lng: number,
      options: UseHospitalsOptions = {},
    ) => {
      const radius = Math.min(Math.max(options.radius ?? 8, 2), 25);
      const emergencyType = normalizeEmergencyType(
        options.emergencyType ?? "general",
      );

      setLoading(true);
      setError(null);
      setSpecialtyFallback(false);

      try {
        if (!navigator.onLine) throw new Error("offline");

        const osmHospitals = await fetchHospitalsFromOSM(lat, lng, radius);
        if (osmHospitals.length === 0) {
          setHospitals([]);
          throw new Error("no-hospitals");
        }

        const withMatches = osmHospitals.map((hospital) => ({
          hospital,
          match: getSpecialtyMatch(hospital, emergencyType),
        }));
        const matchingHospitals =
          emergencyType === "general"
            ? withMatches
            : withMatches.filter(({ match }) => match !== "unknown");
        const isSpecialtyFallback =
          emergencyType !== "general" && matchingHospitals.length === 0;
        const hospitalsToRoute = isSpecialtyFallback
          ? withMatches
          : matchingHospitals;
        setSpecialtyFallback(isSpecialtyFallback);

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

          const distanceKm =
            route.distanceKm || haversineKm(origin, hospital);
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

        const ranked = sortForDispatch(enriched);
        setHospitals(ranked);
        setRoutingStatus({
          source: routingResult.source,
          notice: routingResult.notice,
          generatedAt: routingResult.generatedAt,
        });

        const recommendation = ranked[0];
        if (recommendation) {
          recordDecision({
            timestamp: new Date().toISOString(),
            emergencyType,
            candidateCount: ranked.length,
            recommendedHospital: recommendation.name,
            etaMinutes: recommendation.etaMinutes,
            etaSource: recommendation.etaSource,
            availability: recommendation.availability.status,
          });
        }

        toast({
          title: `${ranked.length} hospitals ranked`,
          description: isSpecialtyFallback
            ? `No ${emergencyType} specialty was found in OpenStreetMap tags, so general hospitals are shown for confirmation.`
            : routingResult.notice,
        });
      } catch (caughtError) {
        let message = "Hospital data could not be loaded. Please try again.";
        if (caughtError instanceof Error && caughtError.message === "offline") {
          message = "You're offline. Reconnect and try again.";
        } else if (
          caughtError instanceof Error &&
          caughtError.message === "no-hospitals"
        ) {
          message =
            "No hospitals were found nearby. Expand the radius or call local emergency services.";
        }

        setError(message);
        setHospitals([]);
        toast({
          title: "Unable to rank hospitals",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  return {
    hospitals,
    loading,
    error,
    fetchHospitals,
    bestOption: hospitals[0] ?? null,
    routingStatus,
    specialtyFallback,
  };
};
