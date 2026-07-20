import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Accessibility,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Filter,
  FlaskConical,
  LoaderCircle,
  MapPin,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Siren,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import Layout from "@/components/Layout";
import LoadingState from "@/components/LoadingState";
import Map from "@/components/Map";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHospitals } from "@/hooks/useHospitals";
import { usePageMemory } from "@/hooks/usePageMemory";
import { useToast } from "@/hooks/use-toast";
import {
  availabilityLabel,
  clearDemoAvailability,
  setDemoAvailability,
  type AvailabilityStatus,
} from "@/services/availability";
import {
  isEmergencyType,
  normalizeEmergencyType,
  type EmergencyType,
} from "@/services/emergency";
import type { Hospital } from "@/services/hospitalSearch";
import type { IsochroneSource } from "@/services/isochrones";
import {
  hasAlwaysOpenEvidence,
  hasEmergencyEvidence,
  hasWheelchairEvidence,
  summarizeAccessEvidence,
} from "@/services/accessEvidence";

type EvidenceFilter = "all" | "wheelchair" | "emergency" | "open-24-7";

interface ScenarioHospital {
  id: string;
  name: string;
  eta: string;
  etaMinutes: number;
  availability: AvailabilityStatus;
}

interface ScenarioState {
  phase: "running" | "complete";
  before: ScenarioHospital;
  affectedHospital: string;
}

const statusStyles: Record<AvailabilityStatus, string> = {
  accepting: "border-success text-success",
  limited: "border-warning text-warning",
  diverting: "border-destructive text-destructive",
  unknown: "text-muted-foreground",
};

function toScenarioHospital(hospital: Hospital): ScenarioHospital {
  return {
    id: hospital.id,
    name: hospital.name,
    eta: hospital.eta,
    etaMinutes: hospital.etaMinutes,
    availability: hospital.availability.status,
  };
}

function matchesEvidenceFilter(
  hospital: Hospital,
  filter: EvidenceFilter,
): boolean {
  if (filter === "wheelchair") return hasWheelchairEvidence(hospital);
  if (filter === "emergency") return hasEmergencyEvidence(hospital);
  if (filter === "open-24-7") return hasAlwaysOpenEvidence(hospital);
  return true;
}

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
  const [isochroneSource, setIsochroneSource] = usePageMemory<IsochroneSource>(
    "options.isochroneSource",
    "distance-estimate",
  );
  const [evidenceFilter, setEvidenceFilter] = usePageMemory<EvidenceFilter>(
    "options.evidenceFilter",
    "all",
  );
  const [scenario, setScenario] = usePageMemory<ScenarioState | null>(
    "options.scenario",
    null,
  );
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const {
    hospitals,
    loading,
    error,
    fetchHospitals,
    routingStatus,
    searchCriteria,
    specialtyFallback,
  } = useHospitals("options");
  const isInitialSearch = loading && hospitals.length === 0;
  const bestOption = hospitals[0] ?? null;
  const activeEmergencyType =
    searchCriteria?.emergencyType ?? selectedType;
  const analysisNeedsUpdate =
    Boolean(searchCriteria) && selectedType !== activeEmergencyType;
  const visibleHospitals = hospitals.filter((hospital) =>
    matchesEvidenceFilter(hospital, evidenceFilter),
  );
  const accessEvidence = summarizeAccessEvidence(hospitals);

  const emergencyTypes: Array<{ id: EmergencyType; label: string }> = [
    { id: "general", label: t("emergency.general") },
    { id: "maternity", label: t("emergency.maternity") },
    { id: "pediatric", label: t("emergency.pediatric") },
    { id: "cardiac", label: t("emergency.cardiac") },
  ];
  const evidenceFilters: Array<{ id: EvidenceFilter; label: string }> = [
    { id: "all", label: "All candidates" },
    { id: "wheelchair", label: "Wheelchair tagged" },
    { id: "emergency", label: "Emergency tagged" },
    { id: "open-24-7", label: "24/7 tagged" },
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
    // A new location runs once. Filter and radius changes use Update analysis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userLocation,
    requestedEmergencyType,
    hospitals.length,
    loading,
    searchCriteria,
    fetchHospitals,
  ]);

  const updateResults = async () => {
    if (!userLocation) return;
    setScenario(null);
    await fetchHospitals(userLocation.lat, userLocation.lng, {
      radius: radius[0],
      emergencyType: activeEmergencyType,
    });
  };

  const runReroutingScenario = async () => {
    if (!userLocation || hospitals.length < 2) {
      toast({
        title: "Load at least two hospitals first",
        description: "Use GPS or the Beirut presentation point, then try again.",
        variant: "destructive",
      });
      return;
    }

    const before = hospitals[0];
    const alternatives = hospitals
      .filter((hospital) => hospital.id !== before.id)
      .sort((first, second) => first.etaMinutes - second.etaMinutes);
    const acceptingAlternative = alternatives[0];

    clearDemoAvailability();
    setDemoAvailability(before.id, "diverting");
    setDemoAvailability(acceptingAlternative.id, "accepting");
    if (alternatives[1]) {
      setDemoAvailability(alternatives[1].id, "limited");
    }
    setScenario({
      phase: "running",
      before: toScenarioHospital(before),
      affectedHospital: before.name,
    });

    await fetchHospitals(userLocation.lat, userLocation.lng, {
      radius: radius[0],
      emergencyType: selectedType,
    });
    setScenario((current) =>
      current ? { ...current, phase: "complete" } : current,
    );
    toast({
      title: "Scenario reranked",
      description:
        "The previous recommendation is marked diverting in the demo feed. QuickER selected the next eligible option.",
    });
  };

  const resetScenario = async () => {
    clearDemoAvailability();
    setScenario(null);
    if (userLocation) {
      await fetchHospitals(userLocation.lat, userLocation.lng, {
        radius: radius[0],
        emergencyType: activeEmergencyType,
      });
    }
  };

  return (
    <Layout>
      <div
        className={`container mx-auto space-y-8 px-4 py-6 sm:px-6 sm:py-8 ${
          language === "ar" ? "rtl" : ""
        }`}
      >
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <FlaskConical className="mr-1.5 h-3.5 w-3.5" /> Scenario Lab
          </Badge>
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
            Stress-test the hospital decision
          </h1>
          <p className="text-lg text-muted-foreground">
            Change the facility type, simulate an availability update, and inspect access evidence without presenting prototype data as live capacity.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 flex items-center text-xl font-semibold">
              <Filter className="mr-2 h-5 w-5 text-primary" /> Facility capability
            </h2>
            <div className="flex flex-wrap gap-2">
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
            {analysisNeedsUpdate ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Select Update analysis to apply this capability filter.
              </div>
            ) : null}
            <p className="mt-4 text-sm text-muted-foreground">
              Matches come from public tags or facility names and must be confirmed with the facility.
            </p>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Radius</h2>
              <Badge variant="secondary">{radius[0]} km</Badge>
            </div>
            <Slider
              value={radius}
              onValueChange={setRadius}
              max={20}
              min={2}
              step={1}
            />
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>2 km</span>
              <span>20 km</span>
            </div>
            <Button
              className="mt-5 w-full"
              onClick={() => void updateResults()}
              disabled={!userLocation || loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Update analysis
            </Button>
          </Card>
        </div>

        {!userLocation ? (
          <Card className="border-dashed p-6 text-center">
            <MapPin className="mx-auto mb-3 h-7 w-7 text-primary" />
            <p className="mb-3 text-muted-foreground">
              Share a location or use the labelled presentation point to begin.
            </p>
            <Button
              variant="outline"
              onClick={() => setUserLocation({ lat: 33.8938, lng: 35.5018 })}
            >
              Use Beirut demo point
            </Button>
          </Card>
        ) : null}

        {isInitialSearch ? (
          <LoadingState
            title="Preparing the Scenario Lab"
            description="Loading hospital candidates, ETA evidence, and access metadata…"
          />
        ) : null}

        {hospitals.length > 0 ? (
          <Card className="overflow-hidden border-warning/35 shadow-soft">
            <div className="border-b bg-warning/5 p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warning">
                    <Siren className="h-4 w-4" /> Availability rerouting scenario
                  </div>
                  <h2 className="text-2xl font-bold">
                    What if the recommended hospital starts diverting?
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                    This controlled simulation changes only the local demo feed, then reruns the real specialty and ETA ranking pipeline.
                  </p>
                </div>
                <Badge variant="outline" className="w-fit border-warning text-warning">
                  <Database className="mr-1.5 h-3.5 w-3.5" /> Simulated status
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 p-5 sm:p-6 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Before
                </p>
                <p className="mt-3 font-semibold">
                  {scenario?.before.name ?? bestOption?.name}
                </p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {scenario?.before.eta ?? bestOption?.eta}
                </p>
                <Badge variant="outline" className="mt-3">
                  {scenario
                    ? availabilityLabel(scenario.before.availability)
                    : bestOption
                      ? availabilityLabel(bestOption.availability.status)
                      : "Unknown"}
                </Badge>
              </div>

              <ArrowRight className="mx-auto hidden h-5 w-5 self-center text-muted-foreground lg:block" />

              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
                <ShieldAlert className="mx-auto h-6 w-6 text-destructive" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-destructive">
                  Scenario event
                </p>
                <p className="mt-2 text-sm font-medium">
                  {scenario?.affectedHospital ?? bestOption?.name} becomes diverting
                </p>
              </div>

              <ArrowRight className="mx-auto hidden h-5 w-5 self-center text-muted-foreground lg:block" />

              <div className="rounded-2xl border border-success/30 bg-success/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  After reranking
                </p>
                {scenario?.phase === "running" || loading ? (
                  <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Recalculating…
                  </div>
                ) : scenario && bestOption ? (
                  <>
                    <p className="mt-3 font-semibold">{bestOption.name}</p>
                    <p className="mt-1 text-2xl font-bold text-success">
                      {bestOption.eta}
                    </p>
                    <Badge
                      variant="outline"
                      className={`mt-3 ${statusStyles[bestOption.availability.status]}`}
                    >
                      {availabilityLabel(bestOption.availability.status)}
                    </Badge>
                  </>
                ) : (
                  <p className="mt-5 text-sm text-muted-foreground">
                    Run the scenario to reveal the new eligible option.
                  </p>
                )}
              </div>
            </div>

            {scenario?.phase === "complete" && bestOption ? (
              <div className="mx-5 mb-5 flex gap-3 rounded-xl border border-success/30 bg-success/5 p-4 text-sm sm:mx-6 sm:mb-6">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <p>
                  QuickER moved from <strong>{scenario.before.name}</strong> to{" "}
                  <strong>{bestOption.name}</strong>. The new choice is{" "}
                  {Math.abs(
                    bestOption.etaMinutes - scenario.before.etaMinutes,
                  )}{" "}
                  {Math.abs(
                    bestOption.etaMinutes - scenario.before.etaMinutes,
                  ) === 1
                    ? "minute"
                    : "minutes"}{" "}
                  {bestOption.etaMinutes >= scenario.before.etaMinutes
                    ? "longer"
                    : "faster"}{" "}
                  by the current ETA, with the availability trade-off shown instead of hidden.
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t bg-muted/20 p-5 sm:px-6">
              <Button
                onClick={() => void runReroutingScenario()}
                disabled={loading || hospitals.length < 2}
              >
                <Siren className="mr-2 h-4 w-4" /> Run rerouting scenario
              </Button>
              <Button
                variant="outline"
                onClick={() => void resetScenario()}
                disabled={loading}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset demo feed
              </Button>
            </div>
          </Card>
        ) : null}

        {hospitals.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Candidates", value: hospitals.length },
              { label: "Within 5 min", value: accessEvidence.withinFiveMinutes },
              { label: "Within 10 min", value: accessEvidence.withinTenMinutes },
              { label: "Wheelchair tagged", value: accessEvidence.wheelchairTagged },
              { label: "Emergency tagged", value: accessEvidence.emergencyTagged },
            ].map((metric) => (
              <Card key={metric.label} className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </Card>
            ))}
          </div>
        ) : null}

        <Card className="p-5 shadow-soft sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                <Accessibility className="h-4 w-4" /> Access evidence map
              </div>
              <h2 className="text-2xl font-bold">Reach and public metadata</h2>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Filter visible markers by explicit OpenStreetMap evidence. Missing tags mean unknown—not inaccessible or unavailable.
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                isochroneSource === "road-network"
                  ? "w-fit border-success text-success"
                  : "w-fit border-warning text-warning"
              }
            >
              {isochroneSource === "road-network"
                ? "Road-network contours"
                : "Estimated circles"}
            </Badge>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {evidenceFilters.map((filter) => (
              <Button
                key={filter.id}
                size="sm"
                type="button"
                variant={evidenceFilter === filter.id ? "default" : "outline"}
                onClick={() => setEvidenceFilter(filter.id)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>{visibleHospitals.length} visible candidates</span>
            <span>{accessEvidence.alwaysOpenTagged} explicitly tagged 24/7</span>
            <span>{accessEvidence.wheelchairTagged} with positive wheelchair tags</span>
          </div>

          <div className="mb-4 flex gap-2 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {isochroneSource === "road-network"
              ? "Contours follow roads but do not include live traffic. Public facility tags can be missing or outdated."
              : "Reach areas are approximate circles, not road travel-time boundaries. Public facility tags can be missing or outdated."}
          </div>

          {isInitialSearch ? (
            <LoadingState
              className="border-0 bg-muted/30 shadow-none"
              title="Building the accessibility view"
              description="Loading candidate and reach evidence…"
              rows={2}
            />
          ) : userLocation ? (
            <Map
              memoryKey="options.map"
              className="h-80 lg:h-[28rem]"
              hospitals={visibleHospitals}
              userLocation={userLocation}
              onLocationSelect={(lat, lng) => setUserLocation({ lat, lng })}
              onIsochroneSourceChange={setIsochroneSource}
              showIsochrones
            />
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
              <MapPin className="mb-4 h-8 w-8 text-primary" />
              <p className="font-semibold">Choose a start location first</p>
            </div>
          )}
        </Card>

        {(routingStatus.notice || specialtyFallback || error) && !loading ? (
          <Card className="p-4 text-sm text-muted-foreground">
            {error
              ? error
              : specialtyFallback
                ? "No matching specialty tag was found; general hospitals are displayed for confirmation."
                : routingStatus.notice}
          </Card>
        ) : null}
      </div>
    </Layout>
  );
};

export default Options;
