import { useEffect, useMemo } from "react";
import {
  Activity,
  BarChart3,
  Clock,
  Database,
  Download,
  MapPin,
  RefreshCw,
  RotateCcw,
  Siren,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Layout from "@/components/Layout";
import { useHospitals } from "@/hooks/useHospitals";
import { usePageMemory } from "@/hooks/usePageMemory";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  availabilityLabel,
  clearDemoAvailability,
  setDemoAvailability,
  type AvailabilityStatus,
} from "@/services/availability";
import {
  getDecisionHistory,
  type DecisionRecord,
} from "@/services/analytics";

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
  const escape = (value: CsvValue) =>
    `"${String(value).split('"').join('""')}"`;
  const content = [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header] ?? "")).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const Dashboard = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const {
    hospitals,
    loading,
    fetchHospitals,
    routingStatus,
    searchCriteria,
  } = useHospitals("dashboard");
  const [userLocation, setUserLocation] = usePageMemory<{
    lat: number;
    lng: number;
  } | null>("dashboard.location", null);
  const [history, setHistory] = usePageMemory<DecisionRecord[]>(
    "dashboard.history",
    () => getDecisionHistory(),
  );

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
    if (!userLocation || hospitals.length || loading || searchCriteria) return;
    void fetchHospitals(userLocation.lat, userLocation.lng, {
      radius: 15,
      emergencyType: "general",
    });
  }, [
    fetchHospitals,
    hospitals.length,
    loading,
    searchCriteria,
    userLocation,
  ]);

  useEffect(() => {
    setHistory(getDecisionHistory());
  }, [hospitals, setHistory]);

  const reloadHospitals = () => {
    if (!userLocation) return;
    void fetchHospitals(userLocation.lat, userLocation.lng, {
      radius: 15,
      emergencyType: "general",
    });
  };

  const updateStatus = (hospitalId: string, status: AvailabilityStatus) => {
    setDemoAvailability(hospitalId, status);
    reloadHospitals();
  };

  const runDemoScenario = () => {
    const fastestByEta = [...hospitals].sort(
      (first, second) => first.etaMinutes - second.etaMinutes,
    );
    if (fastestByEta.length < 2) {
      toast({
        title: "Load at least two hospitals first",
        description: "Share a location or use the Beirut demo point.",
        variant: "destructive",
      });
      return;
    }

    setDemoAvailability(fastestByEta[0].id, "diverting");
    setDemoAvailability(fastestByEta[1].id, "accepting");
    if (fastestByEta[2]) {
      setDemoAvailability(fastestByEta[2].id, "limited");
    }
    reloadHospitals();
    toast({
      title: "Demo operations feed updated",
      description:
        "The fastest facility is now diverting, so QuickER will rerank to an eligible alternative.",
    });
  };

  const resetDemoFeed = () => {
    clearDemoAvailability();
    reloadHospitals();
    toast({
      title: "Demo feed cleared",
      description: "All availability statuses are unknown again.",
    });
  };

  const averageEta = history.length
    ? Math.round(
        history.reduce((total, record) => total + record.etaMinutes, 0) /
          history.length,
      )
    : 0;
  const liveTrafficDecisions = history.filter(
    (record) => record.etaSource === "live-traffic",
  ).length;
  const acceptingHospitals = hospitals.filter(
    (hospital) => hospital.availability.status === "accepting",
  ).length;

  const activityData = useMemo(() => {
    const grouped = new Map<
      string,
      { date: string; searches: number; etaTotal: number }
    >();
    history.forEach((record) => {
      const date = record.timestamp.slice(0, 10);
      const current = grouped.get(date) ?? { date, searches: 0, etaTotal: 0 };
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
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">Emergency access dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Real metrics from this browser plus a clearly labelled operations-feed simulator.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5 text-center">
            <Activity className="mx-auto mb-3 h-6 w-6 text-primary" />
            <div className="text-3xl font-bold text-primary">{history.length}</div>
            <p className="text-sm text-muted-foreground">Recorded searches</p>
          </Card>
          <Card className="p-5 text-center">
            <Clock className="mx-auto mb-3 h-6 w-6 text-primary" />
            <div className="text-3xl font-bold text-primary">
              {averageEta ? `${averageEta} min` : "—"}
            </div>
            <p className="text-sm text-muted-foreground">Average recommended ETA</p>
          </Card>
          <Card className="p-5 text-center">
            <MapPin className="mx-auto mb-3 h-6 w-6 text-primary" />
            <div className="text-3xl font-bold text-primary">{hospitals.length}</div>
            <p className="text-sm text-muted-foreground">Current candidates</p>
          </Card>
          <Card className="p-5 text-center">
            <Siren className="mx-auto mb-3 h-6 w-6 text-primary" />
            <div className="text-3xl font-bold text-primary">
              {acceptingHospitals}
            </div>
            <p className="text-sm text-muted-foreground">Accepting in demo feed</p>
          </Card>
        </div>

        <Card className="border-warning/40 bg-warning/5 p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Database className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Demo operations feed</h2>
                <Badge variant="outline" className="border-warning text-warning">
                  Simulated
                </Badge>
              </div>
              <p className="max-w-3xl text-sm text-muted-foreground">
                These statuses are stored only in this browser. They demonstrate how an authorized ambulance or hospital feed could trigger automatic reranking; they are not real capacity data.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={runDemoScenario} disabled={hospitals.length < 2}>
                <Siren className="mr-2 h-4 w-4" /> Run rerouting demo
              </Button>
              <Button variant="outline" onClick={resetDemoFeed}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
        </Card>

        {!userLocation && (
          <Card className="p-5 text-center">
            <p className="mb-3 text-muted-foreground">
              Location was not shared, so the current hospital feed is empty.
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
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Current ranked facilities</h2>
              <p className="text-sm text-muted-foreground">
                {routingStatus.notice || "Share a location to load facilities."}
              </p>
            </div>
            <Button variant="outline" onClick={reloadHospitals} disabled={!userLocation || loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="space-y-3">
            {hospitals.map((hospital, index) => (
              <div
                key={hospital.id}
                className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Rank #{index + 1}</p>
                  <h3 className="truncate font-semibold">{hospital.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {hospital.eta} • {hospital.distance} • {hospital.etaSource}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={statusStyles[hospital.availability.status]}
                >
                  {availabilityLabel(hospital.availability.status)}
                </Badge>
                <Select
                  value={hospital.availability.status}
                  onValueChange={(value: AvailabilityStatus) =>
                    updateStatus(hospital.id, value)
                  }
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accepting">Accepting</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                    <SelectItem value="diverting">Diverting</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            {!hospitals.length && (
              <div className="rounded-xl bg-muted/40 p-8 text-center text-muted-foreground">
                No current hospital data.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center text-xl font-semibold">
                <BarChart3 className="mr-2 h-5 w-5" /> Local decision history
              </h2>
              <p className="text-sm text-muted-foreground">
                Decision history excludes precise coordinates. {liveTrafficDecisions} searches used live traffic.
              </p>
            </div>
            <Button variant="outline" onClick={exportHistory} disabled={!history.length}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>

          <div className="h-64">
            {activityData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="searches" name="Searches" fill="#2563eb" />
                  <Bar dataKey="averageEta" name="Average ETA" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-muted/40 text-center text-muted-foreground">
                Use Find Hospital to create real local history. No sample data is fabricated.
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
