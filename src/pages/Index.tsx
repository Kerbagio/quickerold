import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Shield,
} from "lucide-react";
import Layout from "@/components/Layout";
import Map, { MapRef } from "@/components/Map";
import { useToast } from "@/hooks/use-toast";
import { useHospitals } from "@/hooks/useHospitals";
import { useLanguage } from "@/contexts/LanguageContext";

type Coordinates = { lat: number; lng: number };

const getCurrentPosition = (options: PositionOptions) =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

const Index = () => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const { toast } = useToast();
  const { hospitals, loading, error, fetchHospitals, bestOption } = useHospitals();
  const { t, language } = useLanguage();
  const mapRef = useRef<MapRef>(null);

  const searchAtLocation = async ({ lat, lng }: Coordinates) => {
    setUserLocation({ lat, lng });
    setLocationError(null);
    setSearchAttempted(true);

    await fetchHospitals(lat, lng, {
      radius: 8,
      emergencyType: localStorage.getItem("defaultEmergencyType") || "general",
    });
  };

  const requestLocation = async () => {
    if (locating || loading) return;

    setSearchAttempted(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      const message = "Your browser does not support location services.";
      setLocationError(message);
      toast({
        title: "Location unavailable",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setLocating(true);

    try {
      let position: GeolocationPosition;

      try {
        // Fast first pass: reuse a recent location or accept a coarse fix.
        position = await getCurrentPosition({
          enableHighAccuracy: false,
          maximumAge: 5 * 60 * 1000,
          timeout: 3500,
        });
      } catch (firstError) {
        const geolocationError = firstError as GeolocationPositionError;

        // Permission denial will not improve with a second request.
        if (geolocationError.code === 1) throw firstError;

        // One bounded high-accuracy retry fixes the common first-click timeout.
        position = await getCurrentPosition({
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 8000,
        });
      }

      await searchAtLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (caughtError) {
      const geolocationError = caughtError as GeolocationPositionError;
      const permissionDenied = geolocationError.code === 1;
      const message = permissionDenied
        ? "Location permission is blocked. Enable it in your browser settings, then retry."
        : "We could not confirm your location. Move near a window or use the Beirut demo location.";

      setLocationError(message);
      toast({
        title: permissionDenied ? "Location permission needed" : "Location unavailable",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLocating(false);
    }
  };

  const onLocationSelect = (lat: number, lng: number) => {
    void searchAtLocation({ lat, lng });
  };

  const isSearching = locating || loading;
  const hasSearchError = Boolean(locationError || error);
  const primaryButtonLabel = isSearching
    ? "Finding hospitals..."
    : hasSearchError
      ? "Retry hospital search"
      : searchAttempted
        ? "Refresh hospital search"
        : "Find nearby hospitals";

  return (
    <Layout>
      <div className={`container mx-auto space-y-8 px-6 py-8 ${language === "ar" ? "rtl" : ""}`}>
        <Card className="border-2 bg-hero-gradient p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Shield className="mr-2 h-4 w-4" />
              {t("btn.emergency")}
            </div>
          </div>

          <h1 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl">
            {t("hero.title")}
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col items-center gap-2">
            <Button
              size="lg"
              onClick={() => void requestLocation()}
              className="min-w-[250px] px-8 py-6 text-lg shadow-emergency"
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : searchAttempted ? (
                <RefreshCw className="mr-2 h-5 w-5" />
              ) : (
                <MapPin className="mr-2 h-5 w-5" />
              )}
              {primaryButtonLabel}
            </Button>

            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-2 text-xs text-muted-foreground"
              disabled={isSearching}
              onClick={() => void searchAtLocation({ lat: 33.8938, lng: 35.5018 })}
            >
              Demo: search from central Beirut
            </Button>
          </div>

          {(locationError || error) && !isSearching && (
            <div
              className="mx-auto mt-5 flex max-w-xl items-start justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-left text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{locationError || error}</span>
            </div>
          )}
        </Card>

        {userLocation && (
          <Map
            ref={mapRef}
            className="h-64 lg:h-80"
            hospitals={hospitals}
            onLocationSelect={onLocationSelect}
          />
        )}

        {bestOption && (
          <Card className="border-2 border-primary/20 bg-primary/5 p-6">
            <div className={`mb-4 flex items-center justify-between ${language === "ar" ? "flex-row-reverse" : ""}`}>
              <Badge variant="secondary" className="bg-success text-success-foreground">
                {t("hero.bestOption")}
              </Badge>
              <div className="flex flex-wrap justify-end gap-2">
                <Badge variant="outline">{t("metrics.eta")} {bestOption.eta}</Badge>
                <Badge variant="outline">{bestOption.distance}</Badge>
                <Badge variant="outline" className="text-success">{t("metrics.lowTraffic")}</Badge>
              </div>
            </div>

            <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${language === "ar" ? "sm:flex-row-reverse" : ""}`}>
              <div>
                <h3 className="mb-2 text-xl font-semibold">{bestOption.name}</h3>
                {bestOption.specialty && (
                  <Badge variant="secondary">{bestOption.specialty}</Badge>
                )}
              </div>

              <Button
                size="lg"
                className="shadow-emergency"
                onClick={() => mapRef.current?.showRoutes(
                  bestOption.lat,
                  bestOption.lng,
                  bestOption.name,
                )}
              >
                <Navigation className="mr-2 h-5 w-5" />
                {t("hero.startNavigation")}
              </Button>
            </div>
          </Card>
        )}

        {hospitals.length > 1 && (
          <Card className="p-6">
            <h2 className="mb-6 text-xl font-semibold">Other nearby options</h2>
            <div className="space-y-4">
              {hospitals.slice(1).map((hospital) => (
                <div
                  key={hospital.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/50 ${language === "ar" ? "flex-row-reverse" : ""}`}
                  onClick={() => mapRef.current?.showRoutes(hospital.lat, hospital.lng, hospital.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      mapRef.current?.showRoutes(hospital.lat, hospital.lng, hospital.name);
                    }
                  }}
                >
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold">{hospital.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{hospital.distance}</span>
                      {hospital.specialty && (
                        <Badge variant="outline" className="text-xs">
                          {hospital.specialty}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className={`${language === "ar" ? "text-left" : "text-right"}`}>
                    <div className="text-2xl font-bold text-primary">{hospital.eta}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {searchAttempted && userLocation && hospitals.length === 0 && !isSearching && !hasSearchError && (
          <Card className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">{t("hero.noHospitals")}</h3>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Index;
