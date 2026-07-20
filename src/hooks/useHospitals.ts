import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  hospitalSearchErrorMessage,
  searchHospitals,
  type Hospital,
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
      options: HospitalSearchOptions = {},
    ) => {
      setLoading(true);
      setError(null);
      setSpecialtyFallback(false);

      try {
        const result = await searchHospitals(lat, lng, options);
        setHospitals(result.hospitals);
        setSpecialtyFallback(result.specialtyFallback);
        setRoutingStatus(result.routingStatus);

        toast({
          title: `${result.hospitals.length} hospitals ranked`,
          description: result.specialtyFallback
            ? `No ${result.emergencyType} specialty was found in OpenStreetMap tags, so general hospitals are shown for confirmation.`
            : result.routingStatus.notice,
        });
      } catch (caughtError) {
        const message = hospitalSearchErrorMessage(caughtError);
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
