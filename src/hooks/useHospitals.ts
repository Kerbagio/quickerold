import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { fetchHospitalsFromOSM } from "@/services/osm";

export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  eta?: string;
  distance?: string;
  specialty?: string;
  traffic?: 'low' | 'medium' | 'high';
  waitTime?: string;
  capacity?: 'low' | 'medium' | 'high';
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

export const useHospitals = (): UseHospitalsReturn => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();


  const fetchHospitals = useCallback(async (
    lat: number, 
    lng: number, 
    options: UseHospitalsOptions = {}
  ) => {
    const { radius = 8, emergencyType = 'general' } = options;
    
    console.log('useHospitals: fetchHospitals called with:', { lat, lng, radius, emergencyType });
    
    setLoading(true);
    setError(null);

    try {
      // Check if offline
      if (!navigator.onLine) {
        throw new Error('offline');
      }

      console.log('useHospitals: Fetching real hospitals from OSM...');
      const osmHospitals = await fetchHospitalsFromOSM(lat, lng, radius);
      console.log('useHospitals: OSM results:', osmHospitals);

      // Distance helper (Haversine)
      const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      // Use only real hospitals from OSM
      if (!osmHospitals || osmHospitals.length === 0) {
        toast({
          title: "No hospitals found",
          description: "No emergency facilities found nearby. Try expanding your search radius.",
          variant: "destructive"
        });
        setHospitals([]);
        return;
      }

      // Filter hospitals by emergency type first
      const filterByEmergencyType = (hospitals: any[], type: string) => {
        if (type === 'general') return hospitals; // Show all for general
        
        return hospitals.filter((hospital: any) => {
          const name = (hospital.name || hospital?.tags?.name || '').toLowerCase();
          const specialty = (hospital?.tags?.['healthcare:speciality'] || '').toLowerCase();
          const emergency = hospital?.tags?.emergency;
          
          switch (type) {
            case 'cardiac':
              return specialty.includes('cardio') || 
                     specialty.includes('heart') ||
                     name.includes('heart') ||
                     name.includes('cardiac') ||
                     name.includes('cardio');
                     
            case 'pediatric':
              return specialty.includes('pediatric') ||
                     specialty.includes('children') ||
                     name.includes('children') ||
                     name.includes('pediatric') ||
                     name.includes('kids');
                     
            case 'maternity':
              return specialty.includes('maternity') ||
                     specialty.includes('obstetric') ||
                     specialty.includes('gynecology') ||
                     name.includes('maternity') ||
                     name.includes('women') ||
                     name.includes('birth');
                     
            default:
              return true;
          }
        });
      };

      const filteredByType = filterByEmergencyType(osmHospitals, emergencyType);
      
      // If no specialty matches found, show all hospitals with a note
      const hospitalsToUse = filteredByType.length > 0 ? filteredByType : osmHospitals;
      const showingAllNote = filteredByType.length === 0 && emergencyType !== 'general';

      // Enrich data with distance and ETA and map to our Hospital type
      const enriched = hospitalsToUse.map((item: any) => {
        const hospitalLat = item.lat;
        const hospitalLng = item.lng;
        const d = haversineKm(lat, lng, hospitalLat, hospitalLng);
        const etaMin = Math.max(3, Math.round(d * 2)); // ~30km/h average
        const name = item.name || item?.tags?.name || 'Hospital';

        const mapped: Hospital = {
          id: String(item.id ?? `${hospitalLat.toFixed(4)},${hospitalLng.toFixed(4)}`),
          name,
          lat: hospitalLat,
          lng: hospitalLng,
          distance: `${d.toFixed(1)} km`,
          eta: `${etaMin} min`,
          specialty: item?.tags?.['healthcare:speciality'] || item?.specialty || 'ER',
          traffic: item?.traffic,
          waitTime: item?.waitTime,
          capacity: item?.capacity
        };
        return mapped;
      });

      // Filter by radius (km)
      const filteredHospitals = enriched.filter(hospital => {
        const distance = parseFloat(hospital.distance?.replace(' km', '') || '0');
        return distance <= radius;
      });
      console.log('useHospitals: Filtered hospitals:', filteredHospitals);

      // Sort by ETA (best first)
      const sortedHospitals = filteredHospitals.sort((a, b) => {
        const etaA = parseInt(a.eta?.replace(' min', '') || '999', 10);
        const etaB = parseInt(b.eta?.replace(' min', '') || '999', 10);
        return etaA - etaB;
      });

      console.log('useHospitals: Final sorted hospitals:', sortedHospitals);
      setHospitals(sortedHospitals);

      if (sortedHospitals.length === 0) {
        toast({
          title: "No hospitals found",
          description: "No emergency facilities found nearby. Expand your search radius in Options.",
          variant: "destructive"
        });
      } else {
        const message = showingAllNote 
          ? `Found ${sortedHospitals.length} nearby hospitals (showing all - no ${emergencyType} specialists found)`
          : `Found ${sortedHospitals.length} nearby ${emergencyType} facilities`;
        
        toast({
          title: "Hospitals found",
          description: message,
          variant: showingAllNote ? "default" : "default"
        });
      }

    } catch (err: any) {
      let errorMessage = "Failed to fetch hospital data";
      
      if (err.message === 'offline') {
        errorMessage = "You're offline. We'll retry automatically when you're back online.";
      } else if (err.name === 'NetworkError') {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      setError(errorMessage);
      toast({
        title: "Error fetching hospitals",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const bestOption = hospitals.length > 0 ? hospitals[0] : null;

  return {
    hospitals,
    loading,
    error,
    fetchHospitals,
    bestOption
  };
};