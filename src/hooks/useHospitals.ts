import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchHospitalsFromOSM, OSMHospital } from "@/services/osm";

export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  eta?: string;
  distance?: string;
  specialty?: string;
  traffic?: "low" | "medium" | "high";
  waitTime?: string;
  capacity?: "low" | "medium" | "high";
}

interface UseHospitalsOptions {
  radius?: number;
  emergencyType?: string;
}

interface UseHospitalsReturn {
  hospitals: Hospital[];
  loading: boolean;
  error: string | null;
  fetchHospitals: (lat: number, lng: number, options?: UseHospitalsOptions) => Promise<void>;
  bestOption: Hospital | null;
}

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((lat2 - lat1) * Math.PI) / 180;
  const longitudeDelta = ((lon2 - lon1) * Math.PI) / 180;
  const startLatitude = (lat1 * Math.PI) / 180;
  const endLatitude = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const filterByEmergencyType = (hospitals: OSMHospital[], type: string) => {
  if (type === "general") return hospitals;

  return hospitals.filter((hospital) => {
    const name = (hospital.name || "").toLowerCase();
    const specialty = (hospital.tags?.["healthcare:speciality"] || "").toLowerCase();

    switch (type) {
      case "cardiac":
        return ["cardio", "heart", "cardiac"].some(
          (keyword) => specialty.includes(keyword) || name.includes(keyword),
        );
      case "pediatric":
        return ["pediatric", "children", "kids"].some(
          (keyword) => specialty.includes(keyword) || name.includes(keyword),
        );
      case "maternity":
        return ["maternity", "obstetric", "gynecology", "women", "birth"].some(
          (keyword) => specialty.includes(keyword) || name.includes(keyword),
        );
      default:
        return hospitals;
    }
  });
};

export const useHospitals = (): UseHospitalsReturn => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchHospitals = useCallback(
    async (lat: number, lng: number, options: UseHospitalsOptions = {}) => {
      const { radius = 8, emergencyType = "general" } = options;

      setLoading(true);
      setError(null);

      try {
        if (!navigator.onLine) {
          throw new Error("offline");
        }

        const osmHospitals = await fetchHospitalsFromOSM(lat, lng, radius);

        if (osmHospitals.length === 0) {
          const message = "No emergency facilities were returned nearby. Try refreshing or expanding the radius.";
          setHospitals([]);
          setError(message);
          toast({
            title: "No hospitals found",
            description: message,
            variant: "destructive",
          });
          return;
        }

        const specialtyMatches = filterByEmergencyType(osmHospitals, emergencyType);
        const showingAllHospitals = specialtyMatches.length === 0 && emergencyType !== "general";
        const hospitalsToUse = showingAllHospitals ? osmHospitals : specialtyMatches;

        const sortedHospitals = hospitalsToUse
          .map((item): Hospital => {
            const distanceKm = haversineKm(lat, lng, item.lat, item.lng);
            const etaMinutes = Math.max(3, Math.round(distanceKm * 2));

            return {
              id: String(item.id ?? `${item.lat.toFixed(4)},${item.lng.toFixed(4)}`),
              name: item.name || "Hospital",
              lat: item.lat,
              lng: item.lng,
              distance: `${distanceKm.toFixed(1)} km`,
              eta: `${etaMinutes} min`,
              specialty: item.tags?.["healthcare:speciality"] || "ER",
            };
          })
          .filter((hospital) => {
            const distanceKm = Number.parseFloat(hospital.distance?.replace(" km", "") || "0");
            return distanceKm <= radius;
          })
          .sort((first, second) => {
            const firstEta = Number.parseInt(first.eta?.replace(" min", "") || "999", 10);
            const secondEta = Number.parseInt(second.eta?.replace(" min", "") || "999", 10);
            return firstEta - secondEta;
          });

        if (sortedHospitals.length === 0) {
          const message = "No emergency facilities are inside the selected radius. Expand it in Options and retry.";
          setHospitals([]);
          setError(message);
          toast({
            title: "No hospitals in range",
            description: message,
            variant: "destructive",
          });
          return;
        }

        setHospitals(sortedHospitals);
        setError(null);

        toast({
          title: "Hospitals found",
          description: showingAllHospitals
            ? `Found ${sortedHospitals.length} nearby hospitals. No verified ${emergencyType} specialty tag was available, so all hospitals are shown.`
            : `Found ${sortedHospitals.length} nearby ${emergencyType} facilities.`,
        });
      } catch (caughtError) {
        const requestError = caughtError as Error;
        let message = "Hospital data could not be loaded. Please retry.";

        if (requestError.message === "offline") {
          message = "You are offline. Reconnect, then retry the hospital search.";
        } else if (requestError.name === "AbortError") {
          message = "The hospital provider took too long to respond. Please retry.";
        }

        setError(message);
        toast({
          title: "Hospital search unavailable",
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
  };
};
