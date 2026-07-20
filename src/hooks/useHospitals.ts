import { useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePageMemory } from "@/hooks/usePageMemory";
import { normalizeEmergencyType } from "@/services/emergency";
import {
  hospitalSearchErrorMessage,
  searchHospitals,
  type Hospital,
  type HospitalSearchResult,
  type HospitalSearchOptions,
  type RoutingStatus,
} from "@/services/hospitalSearch";

export type {
  Hospital,
  RoutingStatus,
  SpecialtyMatch,
} from "@/services/hospitalSearch";

interface UseHospitalsReturn {
  hospitals: Hospital[];
  loading: boolean;
  error: string | null;
  fetchHospitals: (
    lat: number,
    lng: number,
    options?: HospitalSearchOptions,
  ) => Promise<void>;
  bestOption: Hospital | null;
  routingStatus: RoutingStatus;
  specialtyFallback: boolean;
  searchCriteria: Pick<
    HospitalSearchResult,
    "origin" | "radiusKm" | "emergencyType"
  > | null;
}

export const useHospitals = (memoryKey = "shared"): UseHospitalsReturn => {
  const requestSequence = useRef(0);
  const [hospitals, setHospitals] = usePageMemory<Hospital[]>(
    `${memoryKey}.hospitals`,
    [],
  );
  const [loading, setLoading] = usePageMemory(`${memoryKey}.loading`, false);
  const [error, setError] = usePageMemory<string | null>(
    `${memoryKey}.error`,
    null,
  );
  const [specialtyFallback, setSpecialtyFallback] = usePageMemory(
    `${memoryKey}.specialtyFallback`,
    false,
  );
  const [routingStatus, setRoutingStatus] = usePageMemory<RoutingStatus>(
    `${memoryKey}.routingStatus`,
    {
      source: null,
      notice: "",
      generatedAt: null,
    },
  );
  const [searchCriteria, setSearchCriteria] = usePageMemory<
    Pick<HospitalSearchResult, "origin" | "radiusKm" | "emergencyType"> | null
  >(`${memoryKey}.searchCriteria`, null);
  const { toast } = useToast();

  const fetchHospitals = useCallback(
    async (
      lat: number,
      lng: number,
      options: HospitalSearchOptions = {},
    ) => {
      const requestId = ++requestSequence.current;
      setLoading(true);
      setError(null);
      setSpecialtyFallback(false);
      setSearchCriteria({
        origin: { lat, lng },
        radiusKm: Math.min(Math.max(options.radius ?? 8, 2), 25),
        emergencyType: normalizeEmergencyType(
          options.emergencyType ?? "general",
        ),
      });

      try {
        const result = await searchHospitals(lat, lng, options);
        if (requestId !== requestSequence.current) return;
        setHospitals(result.hospitals);
        setSpecialtyFallback(result.specialtyFallback);
        setRoutingStatus(result.routingStatus);
        setSearchCriteria({
          origin: result.origin,
          radiusKm: result.radiusKm,
          emergencyType: result.emergencyType,
        });

        toast({
          title: `${result.hospitals.length} hospitals ranked`,
          description: result.specialtyFallback
            ? `No ${result.emergencyType} specialty was found in OpenStreetMap tags, so general hospitals are shown for confirmation.`
            : result.routingStatus.notice,
        });
      } catch (caughtError) {
        if (requestId !== requestSequence.current) return;
        const message = hospitalSearchErrorMessage(caughtError);
        setError(message);
        setHospitals([]);
        toast({
          title: "Unable to rank hospitals",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (requestId === requestSequence.current) setLoading(false);
      }
    },
    [
      setError,
      setHospitals,
      setLoading,
      setRoutingStatus,
      setSearchCriteria,
      setSpecialtyFallback,
      toast,
    ],
  );

  return {
    hospitals,
    loading,
    error,
    fetchHospitals,
    bestOption: hospitals[0] ?? null,
    routingStatus,
    specialtyFallback,
    searchCriteria,
  };
};
