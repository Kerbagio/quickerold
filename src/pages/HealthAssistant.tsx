import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
} from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  ExternalLink,
  LockKeyhole,
  MapPin,
  MapPinned,
  Navigation,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageMemory } from "@/hooks/usePageMemory";
import {
  getDecisionHistory,
  type DecisionRecord,
} from "@/services/analytics";
import {
  planAgentCommand,
  type AgentAction,
  type AgentSearchLocation,
  type AgentTraceItem,
} from "@/services/agentCommands";
import {
  explainDecision,
  type AgentExplanationMode,
  type AgentProgress,
} from "@/services/agent";
import { availabilityLabel } from "@/services/availability";
import {
  emergencyTypeLabel,
  normalizeEmergencyType,
  type EmergencyType,
} from "@/services/emergency";
import {
  hospitalSearchErrorMessage,
  HospitalSearchError,
  searchHospitals,
  type HospitalSearchResult,
} from "@/services/hospitalSearch";
import type { Coordinate, EtaSource } from "@/services/routing";

interface AgentSearchResult {
  data: HospitalSearchResult;
  locationLabel: "GPS location" | "Beirut demo point";
}

interface AgentMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  sourceLabel?: string;
  mode?: AgentExplanationMode;
  model?: string;
  actions?: AgentAction[];
  searchResult?: AgentSearchResult;
  demoFallback?: EmergencyType;
}

const suggestions = [
  "Find the fastest ER hospital",
  "Find ER hospitals using the Beirut demo",
  "Find the fastest pediatric hospital",
  "Why was this hospital recommended?",
];

const initialMessage: AgentMessage = {
  id: "welcome",
  role: "agent",
  text: "Tell me what hospital category to find. I can request your location, search nearby facilities, calculate ETAs, and return the best routing option directly here.",
  sourceLabel: "Agent guide",
};

const BEIRUT_DEMO_LOCATION: Coordinate = { lat: 33.8938, lng: 35.5018 };

const sourceLabels: Record<EtaSource, string> = {
  "live-traffic": "Live traffic",
  "road-network": "Road-network ETA",
  "distance-estimate": "Distance estimate",
};

function requestBrowserLocation(): Promise<Coordinate> {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("gps-unavailable"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => reject(new Error("gps-denied")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  });
}

function directionsUrl(result: AgentSearchResult): string {
  const { bestOption } = result.data;
  return `https://www.google.com/maps/dir/?api=1&destination=${bestOption.lat},${bestOption.lng}&travelmode=driving`;
}

const HealthAssistant = () => {
  const { language } = useLanguage();
  const [sessionDecision, setSessionDecision] =
    usePageMemory<DecisionRecord | null>("agent.sessionDecision", null);
  const latestDecision = sessionDecision ?? getDecisionHistory()[0];
  const [input, setInput] = usePageMemory("agent.input", "");
  const [messages, setMessages] = usePageMemory<AgentMessage[]>(
    "agent.messages",
    [initialMessage],
  );
  const [trace, setTrace] = usePageMemory<AgentTraceItem[]>(
    "agent.trace",
    [],
  );
  const [isThinking, setIsThinking] = usePageMemory(
    "agent.isThinking",
    false,
  );
  const [progress, setProgress] = usePageMemory<AgentProgress | null>(
    "agent.progress",
    null,
  );
  const messageEndRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, progress]);

  const resetChat = () => {
    if (isThinking) return;
    setMessages([initialMessage]);
    setTrace([]);
    setInput("");
    setProgress(null);
  };

  const updateMessage = (
    messageId: string,
    update: Partial<AgentMessage>,
  ) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, ...update } : message,
      ),
    );
  };

  const updateTraceStep = (step: AgentTraceItem) => {
    setTrace((current) => {
      const existingIndex = current.findIndex((item) => item.id === step.id);
      if (existingIndex === -1) return [...current, step];
      return current.map((item, index) =>
        index === existingIndex ? step : item,
      );
    });
  };

  const executeHospitalSearch = async (
    responseId: string,
    emergencyType: EmergencyType,
    searchLocation: AgentSearchLocation,
  ) => {
    setIsThinking(true);
    setProgress({
      label:
        searchLocation === "beirut-demo"
          ? "Starting from the labelled Beirut demo point…"
          : "Requesting your browser location…",
    });
    updateMessage(responseId, {
      text:
        searchLocation === "beirut-demo"
          ? "Using the clearly labelled Beirut demo point. I’m searching hospitals and calculating ETAs now…"
          : "I’m requesting your location, then I’ll search hospitals and rank their ETAs here…",
      sourceLabel: "Location tool",
      actions: [],
      demoFallback: undefined,
    });
    updateTraceStep({
      id: "location",
      label: "Location tool",
      detail:
        searchLocation === "beirut-demo"
          ? "Using the presentation-only Beirut coordinate; it is not represented as the user's GPS location."
          : "Waiting for browser GPS permission; precise coordinates are not stored in decision history.",
      status: "running",
    });

    try {
      const origin =
        searchLocation === "beirut-demo"
          ? BEIRUT_DEMO_LOCATION
          : await requestBrowserLocation();
      const locationLabel =
        searchLocation === "beirut-demo"
          ? "Beirut demo point"
          : "GPS location";

      updateTraceStep({
        id: "location",
        label: "Location tool",
        detail:
          searchLocation === "beirut-demo"
            ? "Loaded the clearly labelled Beirut presentation point."
            : "Received a temporary GPS coordinate for this search only.",
        status: "complete",
      });
      setProgress({ label: "Searching OpenStreetMap hospital data…" });
      updateTraceStep({
        id: "discovery",
        label: "Hospital discovery tool",
        detail: `Searching OpenStreetMap within 8 km for ${emergencyTypeLabel(emergencyType)} options.`,
        status: "running",
      });

      let result: HospitalSearchResult | null = null;
      let lastSearchError: unknown;
      for (const radius of [8, 15, 25]) {
        setProgress({
          label: `Searching hospitals and routes within ${radius} km…`,
        });
        updateTraceStep({
          id: "discovery",
          label: "Hospital discovery tool",
          detail: `Searching OpenStreetMap within ${radius} km for ${emergencyTypeLabel(emergencyType)} options.`,
          status: "running",
        });
        try {
          result = await searchHospitals(origin.lat, origin.lng, {
            radius,
            emergencyType,
          });
          break;
        } catch (error) {
          lastSearchError = error;
          if (
            !(error instanceof HospitalSearchError) ||
            error.code !== "no-hospitals" ||
            radius === 25
          ) {
            throw error;
          }
        }
      }
      if (!result) throw lastSearchError;

      const { bestOption } = result;
      const searchResult: AgentSearchResult = { data: result, locationLabel };
      setSessionDecision({
        timestamp: new Date().toISOString(),
        emergencyType: result.emergencyType,
        candidateCount: result.hospitals.length,
        recommendedHospital: bestOption.name,
        etaMinutes: bestOption.etaMinutes,
        etaSource: bestOption.etaSource,
        availability: bestOption.availability.status,
      });
      const source = result.routingStatus.source
        ? sourceLabels[result.routingStatus.source]
        : "Routing result";
      const fallbackNotice = result.specialtyFallback
        ? ` No exact ${emergencyTypeLabel(emergencyType)} specialty tag was found, so these are general hospitals that must be confirmed with the facility.`
        : "";

      updateMessage(responseId, {
        text: `Search complete. Best routing option: ${bestOption.name} — ETA ${bestOption.eta}. I compared ${result.hospitals.length} eligible hospitals from the ${locationLabel.toLowerCase()}.${fallbackNotice}`,
        sourceLabel: source,
        mode: "deterministic",
        searchResult,
        demoFallback: undefined,
        actions: [],
      });
      updateTraceStep({
        id: "discovery",
        label: "Hospital discovery tool",
        detail: `Retrieved and filtered ${result.hospitals.length} routeable hospital candidates within ${result.radiusKm} km.`,
        status: "complete",
      });
      updateTraceStep({
        id: "routing",
        label: "ETA ranking tool",
        detail: `${source} ranked ${bestOption.name} at ${bestOption.eta}; availability tier was applied before ETA.`,
        status:
          bestOption.etaSource === "distance-estimate" ? "warning" : "complete",
      });
      updateTraceStep({
        id: "verification",
        label: "Result verifier",
        detail:
          "Confirmed that the displayed hospital, ETA, source, availability label, and alternatives came from the completed tool result.",
        status: "complete",
      });
    } catch (error) {
      const locationFailure =
        error instanceof Error &&
        (error.message === "gps-denied" || error.message === "gps-unavailable");
      const message = locationFailure
        ? "I couldn’t access your GPS location, so I did not pretend to run a local search. Enable browser location and try again, or use the clearly labelled Beirut demo point for the presentation."
        : hospitalSearchErrorMessage(error);

      updateMessage(responseId, {
        text: message,
        sourceLabel: locationFailure ? "Location permission required" : "Search unavailable",
        mode: "deterministic",
        searchResult: undefined,
        demoFallback: locationFailure ? emergencyType : undefined,
        actions: [],
      });
      updateTraceStep({
        id: locationFailure ? "location" : "discovery",
        label: locationFailure ? "Location tool" : "Hospital search tool",
        detail: message,
        status: "warning",
      });
    } finally {
      setProgress(null);
      setIsThinking(false);
    }
  };

  const submitPrompt = async (rawPrompt = input) => {
    const prompt = rawPrompt.trim().slice(0, 300);
    if (!prompt || isThinking) return;

    const plan = planAgentCommand(prompt, latestDecision);
    const requestId = `${Date.now()}-request`;
    const responseId = `${Date.now()}-response`;
    const userMessage: AgentMessage = {
      id: requestId,
      role: "user",
      text: prompt,
    };
    const immediateReply: AgentMessage = {
      id: responseId,
      role: "agent",
      text: plan.reply,
      sourceLabel: plan.sourceLabel,
      mode: "deterministic",
      actions: plan.actions,
    };

    setInput("");
    setMessages((current) => [...current, userMessage, immediateReply]);
    setTrace(plan.trace);

    if (plan.intent === "find") {
      await executeHospitalSearch(
        responseId,
        plan.specialty ?? "general",
        plan.searchLocation,
      );
      return;
    }

    if (!plan.shouldUseLocalModel || !latestDecision) {
      setTrace((current) => [
        ...current,
        {
          id: "response",
          label: "Response composer",
          detail: "Returned an immediate verified rules-based response.",
          status: "complete",
        },
      ]);
      return;
    }

    setIsThinking(true);
    setProgress({ label: "Starting the private on-device model…" });
    setTrace((current) => [
      ...current,
      {
        id: "model",
        label: "On-device language model",
        detail: "Loading FLAN-T5 locally to refine the verified answer.",
        status: "running",
      },
    ]);

    const generated = await explainDecision(
      latestDecision,
      setProgress,
      prompt,
    );
    const usedLocalModel = generated.mode === "local-ai";

    setMessages((current) =>
      current.map((message) =>
        message.id === responseId
          ? {
              ...message,
              text: usedLocalModel ? generated.text : message.text,
              mode: generated.mode,
              model: generated.model,
            }
          : message,
      ),
    );
    setTrace((current) => [
      ...current.map((step) =>
        step.id === "model"
          ? {
              ...step,
              detail: usedLocalModel
                ? "Generated a private explanation without sending the decision to an AI API."
                : "The model was unavailable or failed validation, so the immediate verified answer was kept.",
              status: usedLocalModel ? ("complete" as const) : ("warning" as const),
            }
          : step,
      ),
      {
        id: "verification",
        label: "Output verifier",
        detail: usedLocalModel
          ? "Confirmed the hospital name and ETA, then rejected unsupported medical claims and links."
          : "Confirmed the deterministic fallback contains only stored routing facts and safety disclosures.",
        status: "complete",
      },
    ]);
    setProgress(null);
    setIsThinking(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitPrompt();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitPrompt();
    }
  };

  return (
    <Layout>
      <div
        className={`container mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-8 ${
          language === "ar" ? "rtl" : ""
        }`}
      >
        <Card className="overflow-hidden border-primary/20 bg-hero-gradient">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge className="bg-success text-success-foreground">
                  <span className="mr-2 h-2 w-2 rounded-full bg-current" />
                  Agent ready
                </Badge>
                <Badge variant="outline">$0 • no API key</Badge>
                <Badge variant="outline">Executes routing tools</Badge>
                <Badge variant="outline">Private on-device AI</Badge>
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                Ask QuickER Dispatch
              </h1>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
                Type a hospital request in plain language. QuickER can request your location, search real public hospital data, calculate ETAs, and return the ranked result directly in this conversation.
              </p>
            </div>
            <div className="hidden h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 lg:flex">
              <Bot className="h-12 w-12 text-primary" />
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <Card className="flex min-h-[650px] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Dispatch conversation</h2>
                  <p className="text-xs text-muted-foreground">
                    Executes search tools • returns ranked results in chat
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={resetChat}
                disabled={isThinking}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto bg-muted/20 p-4 sm:p-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "agent" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </div>
                  ) : null}
                  <div
                    className={`max-w-[88%] rounded-2xl p-4 text-sm shadow-sm ${
                      message.role === "user"
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border bg-background"
                    }`}
                  >
                    <p className="leading-relaxed">{message.text}</p>
                    {message.role === "agent" ? (
                      <>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.mode === "local-ai" ? (
                            <Badge variant="secondary">
                              <Sparkles className="mr-1 h-3 w-3" />
                              On-device AI
                            </Badge>
                          ) : message.mode === "deterministic" ? (
                            <Badge variant="secondary">
                              <ShieldCheck className="mr-1 h-3 w-3" />
                              Verified rules
                            </Badge>
                          ) : null}
                          {message.sourceLabel ? (
                            <Badge variant="outline">{message.sourceLabel}</Badge>
                          ) : null}
                        </div>
                        {message.searchResult ? (
                          <div className="mt-4 overflow-hidden rounded-xl border bg-muted/20">
                            <div className="border-b bg-primary/5 p-4">
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <Badge className="bg-success text-success-foreground">
                                  Best routing option
                                </Badge>
                                <Badge variant="outline">
                                  <MapPin className="mr-1 h-3 w-3" />
                                  {message.searchResult.locationLabel}
                                </Badge>
                              </div>
                              <h3 className="text-lg font-semibold">
                                {message.searchResult.data.bestOption.name}
                              </h3>
                              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div className="rounded-lg bg-background p-2.5">
                                  <p className="text-[11px] text-muted-foreground">ETA</p>
                                  <p className="font-bold text-primary">
                                    {message.searchResult.data.bestOption.eta}
                                  </p>
                                </div>
                                <div className="rounded-lg bg-background p-2.5">
                                  <p className="text-[11px] text-muted-foreground">Distance</p>
                                  <p className="font-semibold">
                                    {message.searchResult.data.bestOption.distance}
                                  </p>
                                </div>
                                <div className="rounded-lg bg-background p-2.5">
                                  <p className="text-[11px] text-muted-foreground">Source</p>
                                  <p className="font-semibold">
                                    {sourceLabels[
                                      message.searchResult.data.bestOption.etaSource
                                    ]}
                                  </p>
                                </div>
                                <div className="rounded-lg bg-background p-2.5">
                                  <p className="text-[11px] text-muted-foreground">Availability</p>
                                  <p className="font-semibold">
                                    {availabilityLabel(
                                      message.searchResult.data.bestOption.availability
                                        .status,
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="secondary">
                                  {message.searchResult.data.bestOption.specialty}
                                </Badge>
                                <Badge variant="outline">
                                  {message.searchResult.data.hospitals.length} compared
                                </Badge>
                              </div>
                            </div>

                            {message.searchResult.data.hospitals.length > 1 ? (
                              <div className="p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Fast alternatives
                                </p>
                                <div className="space-y-2">
                                  {message.searchResult.data.hospitals
                                    .slice(1, 4)
                                    .map((hospital, index) => (
                                      <div
                                        key={hospital.id}
                                        className="flex items-center justify-between gap-3 rounded-lg bg-background p-2.5"
                                      >
                                        <div className="min-w-0">
                                          <p className="truncate font-medium">
                                            #{index + 2} {hospital.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {hospital.distance} • {availabilityLabel(
                                              hospital.availability.status,
                                            )}
                                          </p>
                                        </div>
                                        <span className="shrink-0 font-bold text-primary">
                                          {hospital.eta}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ) : null}

                            <div className="grid gap-2 border-t p-4 sm:grid-cols-3">
                              <Button size="sm" asChild>
                                <a
                                  href={directionsUrl(message.searchResult)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Navigation className="mr-2 h-4 w-4" />
                                  Open directions
                                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                </a>
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isThinking}
                                onClick={() =>
                                  void submitPrompt(
                                    "Why was this hospital recommended?",
                                  )
                                }
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Explain choice
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <Link
                                  to={`/options?emergencyType=${message.searchResult.data.emergencyType}`}
                                >
                                  <MapPinned className="mr-2 h-4 w-4" />
                                  Access map
                                </Link>
                              </Button>
                            </div>
                            <p className="border-t px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
                              Ranked by available status first, then ETA. Availability is simulated or unknown—not live hospital capacity. Confirm services with the facility.
                            </p>
                          </div>
                        ) : null}
                        {message.demoFallback ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-4"
                            disabled={isThinking}
                            onClick={() =>
                              void executeHospitalSearch(
                                message.id,
                                message.demoFallback ?? "general",
                                "beirut-demo",
                              )
                            }
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            Use Beirut demo point
                          </Button>
                        ) : null}
                        {message.actions?.length ? (
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {message.actions.map((action) => (
                              <Button
                                key={`${message.id}-${action.href}`}
                                size="sm"
                                variant="outline"
                                className="h-auto justify-between whitespace-normal py-2 text-left"
                                asChild
                              >
                                <Link to={action.href} title={action.description}>
                                  {action.label}
                                  <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                                </Link>
                              </Button>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                  {message.role === "user" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <UserRound className="h-4 w-4" />
                    </div>
                  ) : null}
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>

            <div className="border-t bg-background p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void submitPrompt(suggestion)}
                    disabled={isThinking}
                    className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {progress ? (
                <div className="mb-3 space-y-2" aria-live="polite">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full bg-primary transition-all ${
                        progress.percent === undefined ? "w-1/3 animate-pulse" : ""
                      }`}
                      style={
                        progress.percent === undefined
                          ? undefined
                          : { width: `${progress.percent}%` }
                      }
                    />
                  </div>
                  <p className="flex items-center text-xs text-muted-foreground">
                    <Sparkles className="mr-2 h-3.5 w-3.5 animate-pulse" />
                    {progress.label}
                  </p>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="relative">
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value.slice(0, 300))}
                  onKeyDown={handleKeyDown}
                  placeholder='Try “Find an available ER hospital with the fastest ETA”'
                  className="min-h-[92px] resize-none rounded-2xl pb-10 pr-14"
                  disabled={isThinking}
                  aria-label="Ask the QuickER dispatch agent"
                />
                <span className="absolute bottom-3 left-4 text-[11px] text-muted-foreground">
                  {input.length}/300 • Enter to send
                </span>
                <Button
                  type="submit"
                  size="icon"
                  className="absolute bottom-3 right-3 rounded-xl"
                  disabled={!input.trim() || isThinking}
                  aria-label="Send request"
                >
                  {isThinking ? (
                    <Clock3 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                QuickER handles routing and data questions only. It does not diagnose or provide treatment advice.
              </p>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPinned className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Latest route context</h2>
                </div>
                <Badge variant="outline">Local only</Badge>
              </div>
              {latestDecision ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Recommended facility
                    </p>
                    <p className="mt-1 font-semibold">
                      {latestDecision.recommendedHospital}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Ranked ETA</p>
                      <p className="mt-1 text-xl font-bold text-primary">
                        {latestDecision.etaMinutes} min
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Candidates</p>
                      <p className="mt-1 text-xl font-bold">
                        {latestDecision.candidateCount}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {emergencyTypeLabel(
                        normalizeEmergencyType(latestDecision.emergencyType),
                      )}
                    </Badge>
                    <Badge variant="outline">
                      {latestDecision.etaSource.split("-").join(" ")}
                    </Badge>
                    <Badge variant="outline">
                      {availabilityLabel(latestDecision.availability)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Availability is simulated unless an authorized operational feed is connected.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-muted/40 p-4 text-center">
                  <Database className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
                  <p className="mb-3 text-sm text-muted-foreground">
                    Run a hospital search to give the agent a decision to explain.
                  </p>
                  <Button size="sm" asChild>
                    <Link to="/home">Start a search</Link>
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Agent activity</h2>
                </div>
                {isThinking ? (
                  <Badge className="animate-pulse">Working</Badge>
                ) : (
                  <Badge variant="outline">Ready</Badge>
                )}
              </div>
              {trace.length ? (
                <div className="space-y-4" aria-live="polite">
                  {trace.map((step, index) => (
                    <div key={`${step.id}-${index}`} className="flex gap-3">
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                          step.status === "warning"
                            ? "bg-warning/15 text-warning"
                            : step.status === "running"
                              ? "bg-primary/15 text-primary"
                              : "bg-success/15 text-success"
                        }`}
                      >
                        {step.status === "warning" ? (
                          <CircleAlert className="h-3.5 w-3.5" />
                        ) : step.status === "running" ? (
                          <Clock3 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{step.label}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Send a request to see the tools, context, actions, and validation used for the response.
                </div>
              )}
              <p className="mt-4 border-t pt-3 text-[11px] text-muted-foreground">
                This trace shows observable actions and sources, not hidden chain-of-thought.
              </p>
            </Card>

            <Card className="border-warning/30 bg-warning/10 p-5">
              <div className="flex gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div>
                  <h2 className="font-semibold">Safety boundary</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    The agent cannot diagnose, select treatment, confirm facility capability, or replace local emergency services. Specialty metadata must be confirmed with the facility.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HealthAssistant;
