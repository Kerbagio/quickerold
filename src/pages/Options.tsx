import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Filter, RefreshCw } from "lucide-react";
import Layout from "@/components/Layout";
import Map from "@/components/Map";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHospitals } from "@/hooks/useHospitals";

const Options = () => {
  const [selectedType, setSelectedType] = useState<string>("general");
  const [radius, setRadius] = useState([8]);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const { t, language } = useLanguage();
  
  const { hospitals, loading, fetchHospitals } = useHospitals();
  
  const emergencyTypes = [
    { id: "general", label: t('emergency.general'), active: true },
    { id: "maternity", label: t('emergency.maternity'), active: false },
    { id: "pediatric", label: t('emergency.pediatric'), active: false },
    { id: "cardiac", label: t('emergency.cardiac'), active: false },
  ];

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Fetch hospitals when location, radius, or emergency type changes
  useEffect(() => {
    if (userLocation) {
      fetchHospitals(userLocation.lat, userLocation.lng, {
        radius: radius[0],
        emergencyType: selectedType
      });
    }
  }, [userLocation, radius, selectedType, fetchHospitals]);

  const handleTypeToggle = (typeId: string) => {
    setSelectedType(typeId);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setUserLocation({ lat, lng });
  };

  return (
    <Layout>
      <div className={`container mx-auto px-6 py-8 space-y-8 ${language === 'ar' ? 'rtl' : ''}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {t('options.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('options.subtitle')}
          </p>
        </div>

        {/* Emergency Type Selection */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            {t('options.emergencyType')}
          </h2>
          <div className="flex flex-wrap gap-3">
            {emergencyTypes.map((type) => (
              <Badge
                key={type.id}
                variant={selectedType === type.id ? "default" : "outline"}
                className="px-4 py-2 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => handleTypeToggle(type.id)}
              >
                {type.label}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Search Radius */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">
            {t('options.searchRadius')}: {radius[0]} km
          </h2>
          <div className="space-y-4">
            <Slider
              value={radius}
              onValueChange={setRadius}
              max={12}
              min={2}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>2 km</span>
              <span>12 km</span>
            </div>
          </div>
        </Card>

        {/* Isochrone Map */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">
            {t('options.reachableAreas')}
          </h2>
          <div className="mb-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-success rounded opacity-60"></div>
                <span>{t('options.legend.5min')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-warning rounded opacity-60"></div>
                <span>{t('options.legend.10min')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-destructive rounded opacity-60"></div>
                <span>{t('options.legend.15min')}</span>
              </div>
            </div>
          </div>
          <Map 
            className="h-80" 
            hospitals={hospitals}
            onLocationSelect={handleLocationSelect}
            showIsochrones={true}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default Options;