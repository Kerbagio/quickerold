import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Filter, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import Layout from "@/components/Layout";
import Map from "@/components/Map";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHospitals } from "@/hooks/useHospitals";
import { usePageMemory } from "@/hooks/usePageMemory";
import type { IsochroneSource } from "@/services/isochrones";
import {
  isEmergencyType,
  normalizeEmergencyType,
  type EmergencyType,
} from "@/services/emergency";

const Options = () => {
  const [searchParams] = useSearchParams();
  const requestedType = searchParams.get("emergencyType");
  const requestedEmergencyType = isEmergencyType(requestedType)
    ? requestedType
    : null;
  const [selectedType, setSelectedType] = usePageMemory<EmergencyType>(
    "options.selectedType",
    () => normalizeEmergencyType(requestedType),
  );
  const [radius, setRadius] = usePageMemory("options.radius", [8]);
  const [userLocation, setUserLocation] = usePageMemory<{
    lat: number;
    lng: number;
  } | null>("options.location", null);
  const [isochroneSource, setIsochroneSource] =
    usePageMemory<IsochroneSource>(
      "options.isochroneSource",
      "distance-estimate",
    );
  const { t, language } = useLanguage();
  const {
    hospitals,
    loading,
    fetchHospitals,
    routingStatus,
    searchCriteria,
    specialtyFallback,
  } = useHospitals("options");

  const emergencyTypes: Array<{ id: EmergencyType; label: string }> = [
    { id: "general", label: t("emergency.general") },
    { id: "maternity", label: t("emergency.maternity") },
    { id: "pediatric", label: t("emergency.pediatric") },
    { id: "cardiac", label: t("emergency.cardiac") },
  ];

  useEffect(() => {
    if (userLocation || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => undefined,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, [setUserLocation, userLocation]);

  useEffect(() => {
    if (!requestedEmergencyType) return;
    if (requestedEmergencyType !== selectedType) {
      setSelectedType(requestedEmergencyType);
    }
    if (
      !userLocation ||
      loading ||
      searchCriteria?.emergencyType === requestedEmergencyType
    ) {
      return;
    }
    void fetchHospitals(userLocation.lat, userLocation.lng, {
      radius: radius[0],
      emergencyType: requestedEmergencyType,
    });
  }, [
    fetchHospitals,
    loading,
    radius,
    requestedEmergencyType,
    searchCriteria?.emergencyType,
    selectedType,
    setSelectedType,
    userLocation,
  ]);

  useEffect(() => {
    if (
      !userLocation ||
      requestedEmergencyType ||
      hospitals.length ||
      loading ||
      searchCriteria
    ) {
      return;
    }
    void fetchHospitals(userLocation.lat, userLocation.lng, {
      radius: radius[0],
      emergencyType: selectedType,
    });
    // A new location should run once. Filter/radius changes are applied with the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userLocation,
    requestedEmergencyType,
    hospitals.length,
    loading,
    searchCriteria,
    fetchHospitals,
  ]);

  const updateResults = () => {
    if (!userLocation) return;
    void fetchHospitals(userLocation.lat, userLocation.lng, {
      radius: radius[0],
      emergencyType: selectedType,
    });
  };

  return (
    <Layout>
      <div
        className={`container mx-auto space-y-8 px-4 py-6 sm:px-6 sm:py-8 ${
          language === "ar" ? "rtl" : ""
        }`}
      >
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">{t("options.title")}</h1>
          <p className="text-lg text-muted-foreground">
            Filter the candidate list and explore reachable areas without hiding data limitations.
          </p>
        </div>

        <Card className="p-6">
          <h2 className="mb-5 flex items-center text-xl font-semibold">
            <Filter className="mr-2 h-5 w-5" />
            {t("options.emergencyType")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {emergencyTypes.map((type) => (
              <Button
                key={type.id}
                type="button"
                variant={selectedType === type.id ? "default" : "outline"}
                onClick={() => setSelectedType(type.id)}
              >
                {type.label}
              </Button>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Specialty matches come from OpenStreetMap tags or facility names and must be confirmed with the facility.
          </p>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              {t("options.searchRadius")}: {radius[0]} km
            </h2>
            <Button onClick={updateResults} disabled={!userLocation || loading}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {t("options.updateResults")}
            </Button>
          </div>
          <Slider
            value={radius}
            onValueChange={setRadius}
            max={20}
            min={2}
            step={1}
          />
          <div className="mt-3 flex justify-between text-sm text-muted-foreground">
            <span>2 km</span>
            <span>20 km</span>
          </div>
        </Card>

        {!userLocation && (
          <Card className="p-5 text-center">
            <p className="mb-3 text-muted-foreground">
              Share a location or use the presentation demo point.
            </p>
            <Button
              variant="outline"
              onClick={() => setUserLocation({ lat: 33.8938, lng: 35.5018 })}
            >
              Use Beirut demo point
            </Button>
          </Card>
        )}

        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              {t("options.reachableAreas")}
            </h2>
            <Badge
              variant="outline"
              className={
                isochroneSource === "road-network"
                  ? "border-success text-success"
                  : "border-warning text-warning"
              }
            >
              {isochroneSource === "road-network"
                ? "Road-network contours"
                : "Estimated circles"}
            </Badge>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-5 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-success opacity-60" /> 5 min
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-warning opacity-60" /> 10 min
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-destructive opacity-60" /> 15 min
            </div>
          </div>

          <div className="mb-4 flex gap-2 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {isochroneSource === "road-network"
              ? "Contours follow roads but do not include live traffic."
              : "No free isochrone key is configured. These circles are approximate and are not road travel-time boundaries."}
          </div>

          <Map
            memoryKey="options.map"
            className="h-80 lg:h-96"
            hospitals={hospitals}
            userLocation={userLocation}
            onLocationSelect={(lat, lng) => setUserLocation({ lat, lng })}
            onIsochroneSourceChange={setIsochroneSource}
            showIsochrones
          />
        </Card>

        {(routingStatus.notice || specialtyFallback) && (
          <Card className="p-4 text-sm text-muted-foreground">
            {specialtyFallback
              ? "No matching specialty tag was found; general hospitals are displayed for confirmation."
              : routingStatus.notice}
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Options;
