import { useRef, useState } from "react";
import {
  AlertCircle,
  Clock3,
  LoaderCircle,
  MapPin,
  Navigation,
  RefreshCw,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AIDecisionBrief from "@/components/AIDecisionBrief";
import DecisionEvidenceCard from "@/components/DecisionEvidenceCard";
import Layout from "@/components/Layout";
import LoadingState from "@/components/LoadingState";
import Map, { type MapRef } from "@/components/Map";
import { useToast } from "@/hooks/use-toast";
import { useHospitals } from "@/hooks/useHospitals";
import { usePageMemory } from "@/hooks/usePageMemory";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  availabilityLabel,
  type AvailabilityStatus,
} from "@/services/availability";
import type { EtaSource } from "@/services/routing";
import {
  emergencyTypeLabel,
  normalizeEmergencyType,
  type EmergencyType,
} from "@/services/emergency";
import { buildDecisionEvidence } from "@/services/decisionEvidence";
import type { DecisionRecord } from "@/services/analytics";

const sourceLabels: Record<EtaSource, string> = {
  "live-traffic": "Live traffic",
  "road-network": "Road-network estimate",
  "distance-estimate": "Distance estimate",
};

const availabilityStyles: Record<AvailabilityStatus, string> = {
  accepting: "border-success text-success",
  limited: "border-warning text-warning",
  diverting: "border-destructive text-destructive",
  unknown: "text-muted-foreground",
};

const BEIRUT_DEMO_LOCATION = { lat: 33.8938, lng: 35.5018 };
type LocationSource = "gps" | "demo";

function readBrowserPosition(
  options: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function getCurrentBrowserPosition(): Promise<GeolocationPosition> {
  try {
    return await readBrowserPosition({
      enableHighAccuracy: false,
      timeout: 8_000,
      maximumAge: 120_000,
    });
  } catch (error) {
    if ((error as GeolocationPositionError | undefined)?.code === 1) {
      throw error;
    }

    return readBrowserPosition({
      enableHighAccuracy: true,
      timeout: 12_000,
      maximumAge: 0,
    });
  }
}

const Index = () => {
  const [selectedType, setSelectedType] = usePageMemory<EmergencyType>(
    "home.emergencyType",
    () =>
      normalizeEmergencyType(localStorage.getItem("defaultEmergencyType")),
  );
  const [userLocation, setUserLocation] = usePageMemory<{
    lat: number;
    lng: number;
  } | null>("home.location", null);
  const [permissionDenied, setPermissionDenied] = usePageMemory(
    "home.permissionDenied",
    false,
  );
  const [locationSource, setLocationSource] =
    usePageMemory<LocationSource | null>("home.locationSource", null);
  const [locating, setLocating] = useState(false);
  const { toast } = useToast();
  const {
    hospitals,
    loading,
    error,
    fetchHospitals,
    bestOption,
    routingStatus,
    specialtyFallback,
    searchCriteria,
  } = useHospitals("home");
  const { language } = useLanguage();
  const mapRef = useRef<MapRef>(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const isInitialSearch = loading && hospitals.length === 0;
  const isSearchBusy = locating || loading;
  const activeEmergencyType = searchCriteria?.emergencyType ?? selectedType;
  const decisionEvidence = buildDecisionEvidence(hospitals);
  const decisionRecord: DecisionRecord | null =
    bestOption && decisionEvidence
      ? {
          timestamp: routingStatus.generatedAt ?? "current-search",
          emergencyType: activeEmergencyType,
          candidateCount: hospitals.length,
          recommendedHospital: bestOption.name,
          etaMinutes: bestOption.etaMinutes,
          etaSource: bestOption.etaSource,
          availability: bestOption.availability.status,
          nearestHospital: decisionEvidence.nearestByDistance.name,
          nearestEtaMinutes: decisionEvidence.nearestByDistance.etaMinutes,
          nearestDistanceKm: decisionEvidence.nearestByDistance.distanceKm,
          fastestHospital: decisionEvidence.fastestByEta.name,
          fastestEtaMinutes: decisionEvidence.fastestByEta.etaMinutes,
          recommendedDistanceKm: bestOption.distanceKm,
          timeDeltaVsNearest: decisionEvidence.timeDeltaVsNearest,
          selectionReason: decisionEvidence.reason,
        }
      : null;
  const emergencyTypes: Array<{ id: EmergencyType; label: string }> = [
    { id: "general", label: emergencyTypeLabel("general") },
    { id: "cardiac", label: emergencyTypeLabel("cardiac") },
    { id: "pediatric", label: emergencyTypeLabel("pediatric") },
    { id: "maternity", label: emergencyTypeLabel("maternity") },
  ];

  const runSearch = async (
    location: { lat: number; lng: number },
    source: LocationSource,
  ) => {
    setUserLocation(location);
    setLocationSource(source);
    setPermissionDenied(false);
    await fetchHospitals(location.lat, location.lng, {
      radius: 8,
      emergencyType: selectedType,
    });
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setPermissionDenied(true);
      toast({
        title: "Location is unavailable",
        description:
          "This browser does not support GPS. Use the clearly labelled demo location instead.",
        variant: "destructive",
      });
      return;
    }

    setLocating(true);
    try {
      const position = await getCurrentBrowserPosition();
      setLocating(false);
      await runSearch(
        {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        "gps",
      );
    } catch {
      setPermissionDenied(true);
      toast({
        title: "Current location unavailable",
        description:
          "Allow browser location and try again, or use the clearly labelled Beirut demo point.",
        variant: "destructive",
      });
    } finally {
      setLocating(false);
    }
  };

  const handleHospitalSearch = async () => {
    if (isSearchBusy) return;

    if (userLocation) {
      await runSearch(userLocation, locationSource ?? "gps");
      return;
    }

    await requestLocation();
  };

  const facilityLabel = emergencyTypeLabel(selectedType);
  const searchButtonLabel = locating
    ? "Getting your current location…"
    : loading
      ? hospitals.length
        ? "Updating hospital rankings…"
        : "Finding hospitals and calculating ETAs…"
      : error
        ? "Try hospital search again"
        : userLocation
          ? `Refresh ${
              locationSource === "demo" ? "demo " : ""
            }${facilityLabel} results`
          : `Find fastest ${facilityLabel} near me`;

  const showHospitalRoute = (hospital: (typeof hospitals)[number]) => {
    mapRef.current?.showRoutes(hospital.lat, hospital.lng, hospital.name);
    window.requestAnimationFrame(() => {
      mapSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <Layout>
      <div
        className={`container mx-auto space-y-8 px-4 py-6 sm:px-6 sm:py-8 ${
          language === "ar" ? "rtl" : ""
        }`}
      >
        <Card className="border-2 border-primary/20 bg-hero-gradient p-6 text-center shadow-soft sm:p-8">
          <div className="mb-5 flex justify-center">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Shield className="mr-2 h-4 w-4" />
              QuickER decision support
            </div>
          </div>

          <h1 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl">
            Not the nearest hospital—the fastest suitable option
          </h1>
          <p className="mx-auto mb-7 max-w-2xl text-lg text-muted-foreground">
            Share your location to compare road travel times. Live traffic is used only when the free provider is available.
          </p>

          <div className="mx-auto mb-6 max-w-2xl">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Which facility capability should QuickER look for?
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {emergencyTypes.map((type) => (
                <Button
                  key={type.id}
                  type="button"
                  size="sm"
                  variant={selectedType === type.id ? "default" : "outline"}
                  className={
                    selectedType === type.id
                      ? "shadow-emergency"
                      : "bg-background/70"
                  }
                  onClick={() => setSelectedType(type.id)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              This filters public facility metadata; it does not diagnose the emergency or confirm capability.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <Button
              size="lg"
              disabled={isSearchBusy}
              aria-busy={isSearchBusy}
              onClick={() => void handleHospitalSearch()}
              className="min-w-72 px-8 py-6 text-base shadow-emergency sm:text-lg"
            >
              {isSearchBusy ? (
                <LoaderCircle className="mr-2 h-5 w-5 motion-safe:animate-spin" />
              ) : userLocation ? (
                <RefreshCw className="mr-2 h-5 w-5" />
              ) : (
                <MapPin className="mr-2 h-5 w-5" />
              )}
              {searchButtonLabel}
            </Button>

            {!userLocation && !isSearchBusy ? (
              <button
                type="button"
                className="mt-3 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                onClick={() =>
                  void runSearch(BEIRUT_DEMO_LOCATION, "demo")
                }
              >
                Presenting without GPS? Use the labelled Beirut demo point
              </button>
            ) : null}

            {locationSource === "demo" && userLocation && !isSearchBusy ? (
              <div className="mt-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
                <strong>Demo location active:</strong> results use central
                Beirut, not your GPS.{" "}
                <button
                  type="button"
                  className="font-semibold underline underline-offset-4"
                  onClick={() => void requestLocation()}
                >
                  Switch to current GPS
                </button>
              </div>
            ) : null}
          </div>

          {permissionDenied && !userLocation && (
            <div className="mx-auto mt-4 flex max-w-xl items-center justify-center rounded-xl bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="mr-2 h-5 w-5 shrink-0" />
              Your GPS location was not shared. The demo point is never presented as your real location.
            </div>
          )}
        </Card>

        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <strong>Emergency notice:</strong> QuickER does not dispatch ambulances or confirm clinical capability. For an urgent or life-threatening situation, call local emergency services immediately.
        </div>

        {isInitialSearch && (
          <LoadingState
            title="Comparing nearby hospitals"
            description="QuickER is checking public hospital data and calculating road travel times. Results will replace this preview when ready."
          />
        )}

        {userLocation && !isInitialSearch && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {routingStatus.source && (
                <Badge
                  variant={
                    routingStatus.source === "live-traffic" ? "default" : "outline"
                  }
                  className={
                    routingStatus.source === "live-traffic"
                      ? "bg-success text-success-foreground"
                      : undefined
                  }
                >
                  {sourceLabels[routingStatus.source]}
                </Badge>
              )}
              <span className="text-muted-foreground">
                {hospitals.length} candidates ranked
                {routingStatus.generatedAt
                  ? ` • updated ${new Date(
                      routingStatus.generatedAt,
                    ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : ""}
              </span>
            </div>
            {routingStatus.notice && (
              <p className="text-sm text-muted-foreground">
                {routingStatus.notice}
              </p>
            )}
            {specialtyFallback && (
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
                No matching specialty was found in OpenStreetMap tags. General hospitals are shown; confirm the required service before travelling.
              </div>
            )}
          </>
        )}

        {bestOption && (
          <Card className="overflow-hidden border-2 border-primary/30 shadow-emergency">
            <div className="h-1.5 bg-safety-gradient" />
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Badge className="bg-primary text-primary-foreground">
                  Fastest suitable option
                </Badge>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">ETA {bestOption.eta}</Badge>
                  <Badge variant="outline">{bestOption.distance}</Badge>
                  <Badge
                    variant="outline"
                    className={
                      availabilityStyles[bestOption.availability.status]
                    }
                  >
                    {availabilityLabel(bestOption.availability.status)}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Best current result for{" "}
                    {emergencyTypeLabel(activeEmergencyType)}
                  </p>
                  <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
                    {bestOption.name}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{bestOption.specialty}</Badge>
                    <Badge variant="outline">
                      {sourceLabels[bestOption.etaSource]}
                    </Badge>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                    Ranked by availability status first, then fastest ETA among eligible facilities. Demo availability is not hospital-confirmed.
                  </p>
                </div>

                <div className="flex flex-col items-stretch gap-3 sm:flex-row lg:flex-col">
                  <div className="rounded-2xl bg-primary/10 px-6 py-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Ranked ETA
                    </p>
                    <p className="mt-1 text-4xl font-bold text-primary">
                      {bestOption.eta}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => showHospitalRoute(bestOption)}
                  >
                    <Navigation className="mr-2 h-5 w-5" />
                    View route
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {decisionEvidence ? (
          <DecisionEvidenceCard evidence={decisionEvidence} />
        ) : null}

        {decisionRecord ? (
          <AIDecisionBrief decision={decisionRecord} />
        ) : null}

        {userLocation && !isInitialSearch && hospitals.length > 0 ? (
          <div ref={mapSectionRef} className="scroll-mt-24">
          <Card className="p-4 shadow-soft sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Clock3 className="h-4 w-4" /> Route evidence
                </div>
                <h2 className="text-xl font-bold">Hospital routes and alternatives</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Select any hospital card below to compare its route.
              </p>
            </div>
            <Map
              ref={mapRef}
              memoryKey="home.map"
              className="h-80 lg:h-[28rem]"
              hospitals={hospitals}
              userLocation={userLocation}
            />
          </Card>
          </div>
        ) : null}

        {hospitals.length > 1 && (
          <Card className="p-6">
            <h2 className="mb-5 text-xl font-semibold">Alternative hospitals</h2>
            <div className="space-y-3">
              {hospitals.slice(1).map((hospital, index) => (
                <button
                  type="button"
                  key={hospital.id}
                  onClick={() => showHospitalRoute(hospital)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">#{index + 2}</p>
                    <h3 className="truncate font-semibold">{hospital.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{hospital.distance}</span>
                      <Badge variant="outline" className="text-xs">
                        {hospital.specialty}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          availabilityStyles[hospital.availability.status]
                        }`}
                      >
                        {availabilityLabel(hospital.availability.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-2xl font-bold text-primary">
                      {hospital.eta}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sourceLabels[hospital.etaSource]}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {error && !loading && (
          <Card className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Search unavailable</h3>
            <p className="text-muted-foreground">{error}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Use the single search button above to try again. Your facility
              type and location are preserved.
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Index;
