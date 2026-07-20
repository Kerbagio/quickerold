import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Accessibility,
  Activity,
  BarChart3,
  Clock3,
  Database,
  Download,
  FlaskConical,
  Gauge,
  MapPin,
  RefreshCw,
  Route,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import LoadingState from "@/components/LoadingState";
import {
  useHospitals,
  type Hospital,
  type RoutingStatus,
} from "@/hooks/useHospitals";
import { usePageMemory } from "@/hooks/usePageMemory";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  availabilityLabel,
  type AvailabilityStatus,
} from "@/services/availability";
import {
  DECISION_HISTORY_UPDATED_EVENT,
  getDecisionHistory,
  type DecisionRecord,
} from "@/services/analytics";
import { summarizeAccessEvidence } from "@/services/accessEvidence";

type CsvValue = string | number;

const statusStyles: Record<AvailabilityStatus, string> = {
  accepting: "border-success text-success",
  limited: "border-warning text-warning",
  diverting: "border-destructive text-destructive",
  unknown: "text-muted-foreground",
};

function downloadCsv(rows: Array<Record<string, CsvValue>>, filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: CsvValue) => `"${String(value).split('"').join('""')}"`;
  const content = [
    headers.map(escape).join(","),
    ...rows.map((row) =>
      headers.map((header) => escape(row[header] ?? "")).join(","),
    ),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  globalThis.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 1_000);
}

function comparisonLabel(record: DecisionRecord): string {
  if (
    record.selectionReason === "availability-tradeoff" &&
    record.fastestHospital &&
    record.fastestEtaMinutes !== undefined
  ) {
    return `+${Math.max(0, record.etaMinutes - record.fastestEtaMinutes)} min availability trade-off`;
  }
  if ((record.timeDeltaVsNearest ?? 0) > 0 && record.nearestHospital) {
    return `${record.timeDeltaVsNearest} min faster than ${record.nearestHospital}`;
  }
  if (record.nearestHospital) return "Closest and selected option matched";
  return "Comparison not recorded in this earlier search";
}

const Dashboard = () => {
  const { language } = useLanguage();
  const {
    hospitals: dashboardHospitals,
    loading,
    fetchHospitals,
    routingStatus: dashboardRoutingStatus,
    searchCriteria: dashboardSearchCriteria,
  } = useHospitals("dashboard");
  const [homeHospitals] = usePageMemory<Hospital[]>("home.hospitals", []);
  const [homeRoutingStatus] = usePageMemory<RoutingStatus>(
    "home.routingStatus",
    { source: null, notice: "", generatedAt: null },
  );
  const [homeLocation] = usePageMemory<{
    lat: number;
    lng: number;
  } | null>("home.location", null);
  const [userLocation, setUserLocation] = usePageMemory<{
    lat: number;
    lng: number;
  } | null>("dashboard.location", () => homeLocation);
  const [history, setHistory] = usePageMemory<DecisionRecord[]>(
    "dashboard.history",
    () => getDecisionHistory(),
  );
  const hospitals = dashboardHospitals.length
    ? dashboardHospitals
    : homeHospitals;
  const routingStatus = dashboardHospitals.length
    ? dashboardRoutingStatus
    : homeRoutingStatus;

  useEffect(() => {
    if (!userLocation && homeLocation) setUserLocation(homeLocation);
  }, [homeLocation, setUserLocation, userLocation]);

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
    if (
      !userLocation ||
      dashboardHospitals.length ||
      homeHospitals.length ||
      loading ||
      dashboardSearchCriteria
    ) {
      return;
    }
    void fetchHospitals(userLocation.lat, userLocation.lng, {
      radius: 15,
      emergencyType: "general",
      recordDecision: false,
    });
  }, [
    dashboardHospitals.length,
    dashboardSearchCriteria,
    fetchHospitals,
    homeHospitals.length,
    loading,
    userLocation,
  ]);

  useEffect(() => {
    const refreshHistory = () => setHistory(getDecisionHistory());
    refreshHistory();
    window.addEventListener(
      DECISION_HISTORY_UPDATED_EVENT,
      refreshHistory,
    );
    window.addEventListener("storage", refreshHistory);
    return () => {
      window.removeEventListener(
        DECISION_HISTORY_UPDATED_EVENT,
        refreshHistory,
      );
      window.removeEventListener("storage", refreshHistory);
    };
  }, [setHistory]);

  const reloadHospitals = () => {
    if (!userLocation) return;
    void fetchHospitals(userLocation.lat, userLocation.lng, {
      radius: 15,
      emergencyType: "general",
      recordDecision: false,
    });
  };

  const averageEta = history.length
    ? Math.round(
        history.reduce((total, record) => total + record.etaMinutes, 0) /
          history.length,
      )
    : 0;
  const comparableSearches = history.filter(
    (record) => record.timeDeltaVsNearest !== undefined,
  );
  const potentialMinutesFaster = comparableSearches.reduce(
    (total, record) => total + Math.max(0, record.timeDeltaVsNearest ?? 0),
    0,
  );
  const availabilityTradeoffs = history.filter(
    (record) => record.selectionReason === "availability-tradeoff",
  ).length;
  const liveTrafficDecisions = history.filter(
    (record) => record.etaSource === "live-traffic",
  ).length;
  const isInitialSearch = loading && hospitals.length === 0;
  const accessEvidence = summarizeAccessEvidence(hospitals);

  const activityData = useMemo(() => {
    const grouped = new Map<
      string,
      { date: string; searches: number; etaTotal: number }
    >();
    history.forEach((record) => {
      const date = record.timestamp.slice(0, 10);
      const current = grouped.get(date) ?? {
        date,
        searches: 0,
        etaTotal: 0,
      };
      current.searches += 1;
      current.etaTotal += record.etaMinutes;
      grouped.set(date, current);
    });
    return [...grouped.values()]
      .sort((first, second) => first.date.localeCompare(second.date))
      .slice(-7)
      .map((item) => ({
        date: item.date.slice(5),
        searches: item.searches,
        averageEta: Math.round(item.etaTotal / item.searches),
      }));
  }, [history]);

  const exportHistory = () => {
    downloadCsv(
      history.map((record) => ({
        Timestamp: record.timestamp,
        "Emergency type": record.emergencyType,
        Candidates: record.candidateCount,
        Recommendation: record.recommendedHospital,
        "ETA minutes": record.etaMinutes,
        "ETA source": record.etaSource,
        Availability: record.availability,
        "Closest hospital": record.nearestHospital ?? "Not recorded",
        "Closest ETA": record.nearestEtaMinutes ?? "Not recorded",
        "Potential minutes faster": Math.max(
          0,
          record.timeDeltaVsNearest ?? 0,
        ),
        "Selection reason": record.selectionReason ?? "Not recorded",
      })),
      `quicker-decisions-${new Date().toISOString().slice(0, 10)}.csv`,
    );
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
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Impact & evidence
          </Badge>
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
            Emergency access dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Measure routing comparisons and public-data coverage without turning prototype activity into claimed patient outcomes.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="relative overflow-hidden p-5">
            <Activity className="mb-5 h-6 w-6 text-primary" />
            <p className="text-3xl font-bold">{history.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Local routing comparisons
            </p>
          </Card>
          <Card className="relative overflow-hidden p-5">
            <Clock3 className="mb-5 h-6 w-6 text-primary" />
            <p className="text-3xl font-bold">
              {averageEta ? `${averageEta} min` : "—"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Average recommended ETA
            </p>
          </Card>
          <Card className="relative overflow-hidden border-success/25 p-5">
            <TimerReset className="mb-5 h-6 w-6 text-success" />
            <p className="text-3xl font-bold text-success">
              {comparableSearches.length ? `${potentialMinutesFaster} min` : "—"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Potentially faster than closest
            </p>
          </Card>
          <Card className="relative overflow-hidden border-warning/25 p-5">
            <ShieldCheck className="mb-5 h-6 w-6 text-warning" />
            <p className="text-3xl font-bold text-warning">
              {availabilityTradeoffs}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Availability trade-offs recorded
            </p>
          </Card>
        </div>

        <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 text-sm text-muted-foreground">
          <strong className="text-foreground">How to read these metrics:</strong>{" "}
          “Potentially faster” is the summed ETA difference between the closest routed-distance candidate and QuickER’s recommendation. It is decision evidence—not proof of time saved in real journeys or improved clinical outcomes.
        </div>

        {!userLocation ? (
          <Card className="border-dashed p-6 text-center">
            <MapPin className="mx-auto mb-3 h-7 w-7 text-primary" />
            <p className="mb-3 text-muted-foreground">
              Add a location to build a current access snapshot.
            </p>
            <Button
              variant="outline"
              onClick={() => setUserLocation({ lat: 33.8938, lng: 35.5018 })}
            >
              Use Beirut demo point
            </Button>
          </Card>
        ) : null}

        <Card className="overflow-hidden shadow-soft">
          <div className="border-b bg-muted/25 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Accessibility className="h-4 w-4" /> Current access snapshot
                </div>
                <h2 className="text-2xl font-bold">Reach and metadata coverage</h2>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Counts reflect the current candidate set and explicit public tags. Missing metadata remains unknown.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={reloadHospitals}
                  disabled={!userLocation || loading}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button size="sm" asChild>
                  <Link to="/options">
                    <FlaskConical className="mr-2 h-4 w-4" /> Scenario Lab
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {isInitialSearch ? (
              <LoadingState
                className="border-0 bg-muted/30 shadow-none"
                title="Calculating the access snapshot"
                description="Ranking facilities and checking public evidence tags…"
              />
            ) : hospitals.length ? (
              <>
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border p-5">
                    <div className="mb-5 flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">ETA reach bands</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: "≤ 5 min", value: accessEvidence.withinFiveMinutes },
                        { label: "≤ 10 min", value: accessEvidence.withinTenMinutes },
                        { label: "≤ 15 min", value: accessEvidence.withinFifteenMinutes },
                      ].map((band) => (
                        <div key={band.label} className="rounded-xl bg-muted/40 p-3">
                          <p className="text-2xl font-bold text-primary">
                            {band.value}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {band.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Based on the current ETA source: {routingStatus.source ?? "not available"}.
                    </p>
                  </div>

                  <div className="rounded-2xl border p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Public tag coverage</h3>
                      </div>
                      <Badge variant="outline">
                        {accessEvidence.metadataCoveragePercent}%
                      </Badge>
                    </div>
                    <Progress
                      value={accessEvidence.metadataCoveragePercent}
                      className="h-2"
                    />
                    <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                      {[
                        {
                          label: "Wheelchair",
                          value: accessEvidence.wheelchairTagged,
                        },
                        {
                          label: "Emergency",
                          value: accessEvidence.emergencyTagged,
                        },
                        {
                          label: "24/7",
                          value: accessEvidence.alwaysOpenTagged,
                        },
                      ].map((signal) => (
                        <div key={signal.label}>
                          <p className="text-xl font-bold">{signal.value}</p>
                          <p className="text-xs text-muted-foreground">
                            {signal.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Coverage means at least one explicit positive access tag; it does not verify the facility.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {hospitals.map((hospital, index) => (
                    <div
                      key={hospital.id}
                      className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{hospital.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {hospital.eta} • {hospital.distance} • {hospital.specialty}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={statusStyles[hospital.availability.status]}
                      >
                        {availabilityLabel(hospital.availability.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-muted/30 p-8 text-center text-muted-foreground">
                Share a location to load current access evidence.
              </div>
            )}
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center text-xl font-semibold">
                  <BarChart3 className="mr-2 h-5 w-5" /> Local decision activity
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {liveTrafficDecisions} comparisons used a live-traffic source.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportHistory}
                disabled={!history.length}
              >
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>

            <div className="h-72">
              {activityData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Bar
                      dataKey="searches"
                      name="Comparisons"
                      fill="hsl(0 84% 50%)"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="averageEta"
                      name="Average ETA"
                      fill="hsl(221 83% 53%)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl bg-muted/40 px-6 text-center text-muted-foreground">
                  Use Find Hospital to create local decision evidence. No sample history is fabricated.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="flex items-center text-xl font-semibold">
                <Route className="mr-2 h-5 w-5" /> Closest-versus-selected log
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Precise coordinates are excluded from this browser history.
              </p>
            </div>

            <div className="space-y-3">
              {history.slice(0, 6).map((record) => (
                <div key={`${record.timestamp}-${record.recommendedHospital}`} className="rounded-xl border p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.timestamp).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <h3 className="mt-1 truncate font-semibold">
                        {record.recommendedHospital}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {comparisonLabel(record)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Badge>{record.etaMinutes} min</Badge>
                      <Badge variant="outline">{record.etaSource}</Badge>
                    </div>
                  </div>
                </div>
              ))}
              {!history.length ? (
                <div className="rounded-xl bg-muted/40 p-8 text-center text-muted-foreground">
                  No routing comparisons recorded yet.
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        {loading && hospitals.length > 0 ? (
          <div className="flex items-center gap-3 rounded-xl border p-4 text-sm text-muted-foreground">
            <Skeleton className="h-8 w-8 rounded-xl" /> Updating the current access snapshot…
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default Dashboard;
