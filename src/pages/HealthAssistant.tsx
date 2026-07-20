import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
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
  LockKeyhole,
  MapPinned,
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
import { getDecisionHistory } from "@/services/analytics";
import {
  planAgentCommand,
  type AgentAction,
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
} from "@/services/emergency";

interface AgentMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  sourceLabel?: string;
  mode?: AgentExplanationMode;
  model?: string;
  actions?: AgentAction[];
}

const suggestions = [
  "Find the fastest pediatric hospital",
  "Why was this hospital recommended?",
  "What ETA source did you use?",
  "Open the 10-minute accessibility map",
];

const initialMessage: AgentMessage = {
  id: "welcome",
  role: "agent",
  text: "Ask me to prepare a hospital search, open an accessibility map, or explain the latest routing decision, ETA source, availability rule, or privacy boundary.",
  sourceLabel: "Agent guide",
};

const HealthAssistant = () => {
  const { language } = useLanguage();
  const latestDecision = getDecisionHistory()[0];
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([initialMessage]);
  const [trace, setTrace] = useState<AgentTraceItem[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState<AgentProgress | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, progress]);

  const resetChat = () => {
    if (isThinking) return;
    setMessages([initialMessage]);
    setTrace([]);
    setInput("");
    setProgress(null);
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
                <Badge variant="outline">Private on-device AI</Badge>
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                Ask QuickER Dispatch
              </h1>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
                Type a routing request in plain language. QuickER plans a safe map action or explains the latest hospital decision with visible sources and guardrails.
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
                    Immediate rules response • optional local AI refinement
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
                  placeholder='Try “Find the fastest cardiac hospital” or “Why this option?”'
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
