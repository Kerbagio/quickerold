import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Clock3,
  HeartPulse,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { clearPageMemory } from "@/hooks/usePageMemory";
import {
  createHealthAgentState,
  planHealthAgentTurn,
  type HealthAgentPlan,
  type HealthAgentState,
} from "@/services/healthAgent";
import {
  generateHealthAgentReply,
  type AgentModelProgress,
} from "@/services/healthAgentRuntime";
import { emergencyTypeLabel } from "@/services/emergency";
import type { TriageResult } from "@/services/triage";

interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: "on-device-ai" | "safety-fallback";
  model?: string;
}

const initialMessage: AgentMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Tell me what is happening in your own words. I will check immediate warning signs, ask one focused question at a time, and prepare a suitable hospital search when there is enough information.",
};

const examples = [
  "My father has chest pressure and is struggling to breathe.",
  "My child has a high fever and keeps vomiting.",
  "I am pregnant and having severe abdominal pain.",
  "I am dead.",
];

const urgencyStyles: Record<TriageResult["urgency"], string> = {
  emergency: "border-destructive/40 bg-destructive/10 text-destructive",
  urgent: "border-warning/40 bg-warning/10 text-warning",
  soon: "border-primary/30 bg-primary/10 text-primary",
  "needs-more-info": "border-border bg-muted/60 text-foreground",
};

const urgencyLabels: Record<TriageResult["urgency"], string> = {
  emergency: "Emergency",
  urgent: "Urgent",
  soon: "Review soon",
  "needs-more-info": "Needs more information",
};

const Triage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([initialMessage]);
  const [agentState, setAgentState] = useState<HealthAgentState>(() =>
    createHealthAgentState(),
  );
  const [plan, setPlan] = useState<HealthAgentPlan | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState<AgentModelProgress | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, plan, progress]);

  const reset = () => {
    if (isThinking) return;
    setInput("");
    setMessages([initialMessage]);
    setAgentState(createHealthAgentState());
    setPlan(null);
    setProgress(null);
  };

  const submitPrompt = async (rawPrompt = input) => {
    const prompt = rawPrompt.trim().slice(0, 1200);
    if (!prompt || isThinking) return;

    const nextPlan = planHealthAgentTurn(prompt, agentState);
    const requestId = `${Date.now()}-user`;
    const responseId = `${Date.now()}-assistant`;
    const userMessage: AgentMessage = {
      id: requestId,
      role: "user",
      content: prompt,
    };
    const immediateReply: AgentMessage = {
      id: responseId,
      role: "assistant",
      content: nextPlan.fallbackReply,
      mode: "safety-fallback",
    };
    const modelConversation = [...messages, userMessage].map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setInput("");
    setAgentState(nextPlan.state);
    setPlan(nextPlan);
    setMessages((current) => [...current, userMessage, immediateReply]);
    setIsThinking(true);
    setProgress({ label: "Starting the private on-device agent…" });

    const generated = await generateHealthAgentReply(
      modelConversation,
      nextPlan,
      setProgress,
    );

    setMessages((current) =>
      current.map((message) =>
        message.id === responseId
          ? {
              ...message,
              content: generated.text,
              mode: generated.mode,
              model: generated.model,
            }
          : message,
      ),
    );
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

  const prepareHospitalSearch = () => {
    const result = plan?.triage;
    if (!result) return;
    localStorage.setItem("defaultEmergencyType", result.emergencyType);
    localStorage.setItem("searchRadius", String(result.radiusKm));
    clearPageMemory("home.");
    navigate("/home");
  };

  const result = plan?.triage ?? null;

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
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className="bg-success text-success-foreground">
                  $0 • no API key
                </Badge>
                <Badge variant="outline">On-device Qwen agent</Badge>
                <Badge variant="outline">Validated tool calls</Badge>
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                QuickER Health Agent
              </h1>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
                A real conversational agent with temporary memory, focused
                follow-up questions, a deterministic safety tool, and a direct
                handoff to hospital search.
              </p>
            </div>
            <div className="hidden h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 lg:flex">
              <HeartPulse className="h-12 w-12 text-primary" />
            </div>
          </div>
        </Card>

        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <strong>Safety notice:</strong> The agent cannot diagnose or replace a
          clinician. When the safety tool detects immediate danger, contact local
          emergency services without waiting for the model or hospital search.
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(310px,0.75fr)]">
          <Card className="flex min-h-[680px] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Agent conversation</h2>
                  <p className="text-xs text-muted-foreground">
                    Safety tools first • local model writes the response
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={reset}
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
                  {message.role === "assistant" ? (
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
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    {message.role === "assistant" && message.mode ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.mode === "on-device-ai" ? (
                          <Badge variant="secondary">
                            <Sparkles className="mr-1 h-3 w-3" /> On-device AI
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <ShieldCheck className="mr-1 h-3 w-3" /> Safety fallback
                          </Badge>
                        )}
                        {message.model ? (
                          <Badge variant="outline">{message.model}</Badge>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {message.role === "user" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <UserRound className="h-4 w-4" />
                    </div>
                  ) : null}
                </div>
              ))}

              {plan?.nextQuestion ? (
                <div className="ml-11 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Agent needs one answer
                  </p>
                  <p className="mt-1 font-medium">{plan.nextQuestion.text}</p>
                  {plan.nextQuestion.expectsStructuredAnswer ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { label: "Yes", value: "Yes" },
                        { label: "No", value: "No" },
                        { label: "Not sure", value: "Not sure" },
                      ].map((option) => (
                        <Button
                          key={option.label}
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isThinking}
                          onClick={() => void submitPrompt(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Reply naturally in the message box below.
                    </p>
                  )}
                </div>
              ) : null}

              <div ref={messageEndRef} />
            </div>

            <div className="border-t bg-background p-4 sm:p-5">
              {!agentState.turnCount ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {examples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      disabled={isThinking}
                      onClick={() => void submitPrompt(example)}
                      className="rounded-full border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              ) : null}

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
                  onChange={(event) => setInput(event.target.value.slice(0, 1200))}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe symptoms or answer the agent's question…"
                  className="min-h-[92px] resize-none rounded-2xl pb-10 pr-14"
                  disabled={isThinking}
                  aria-label="Message the QuickER health agent"
                />
                <span className="absolute bottom-3 left-4 text-[11px] text-muted-foreground">
                  {input.length}/1200 • Enter to send
                </span>
                <Button
                  type="submit"
                  size="icon"
                  className="absolute bottom-3 right-3 rounded-xl"
                  disabled={!input.trim() || isThinking}
                  aria-label="Send message"
                >
                  {isThinking ? (
                    <Clock3 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Messages stay in temporary tab memory. Model inference runs in
                this browser after a one-time model download.
              </p>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Live triage state</h2>
              </div>

              {result ? (
                <div className="space-y-4">
                  <div
                    className={`rounded-2xl border p-4 ${urgencyStyles[result.urgency]}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      {urgencyLabels[result.urgency]}
                    </p>
                    <h3 className="mt-1 text-lg font-bold">{result.headline}</h3>
                  </div>

                  {result.requiresImmediateAction ? (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                      <strong>Immediate action:</strong> do not wait for the model
                      or this app before contacting emergency services.
                    </div>
                  ) : null}

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Severity</p>
                      <p className="mt-1 text-sm font-semibold capitalize">
                        {result.severity}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Risk</p>
                      <p className="mt-1 text-sm font-semibold capitalize">
                        {result.riskLevel}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className="mt-1 text-sm font-semibold capitalize">
                        {result.confidence}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Hospital-search tool input
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {emergencyTypeLabel(result.emergencyType)}
                      </Badge>
                      <Badge variant="outline">{result.radiusKm} km radius</Badge>
                    </div>
                  </div>

                  {result.matchedSignals.length ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Signals used by the safety tool
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.matchedSignals.map((signal) => (
                          <Badge key={signal} variant="outline">
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    disabled={!plan?.canPrepareHospitalSearch}
                    onClick={prepareHospitalSearch}
                  >
                    {result.requiresImmediateAction
                      ? "Find nearby emergency hospitals"
                      : "Prepare hospital search"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                  The validated urgency, risk, confidence, specialty, and radius
                  will appear after the first message.
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Agent tool activity</h2>
              </div>
              {plan?.toolSteps.length ? (
                <div className="space-y-4">
                  {plan.toolSteps.map((step) => (
                    <div key={step.id} className="flex gap-3">
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                          step.status === "warning"
                            ? "bg-warning/15 text-warning"
                            : "bg-success/15 text-success"
                        }`}
                      >
                        {step.status === "warning" ? (
                          <CircleAlert className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="font-mono text-xs font-semibold">
                          {step.tool}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      {isThinking ? (
                        <Clock3 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div>
                      <p className="font-mono text-xs font-semibold">
                        local_model.compose
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {isThinking
                          ? "The on-device model is composing a natural response from the conversation and verified tool result."
                          : "The generated response was validated before display; unsafe output falls back to the safety-engine wording."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Send a message to see the agent execute its tools.
                </div>
              )}
              <p className="mt-4 border-t pt-3 text-[11px] text-muted-foreground">
                This shows observable tool actions and validation—not hidden
                model reasoning.
              </p>
            </Card>

            <Card className="border-primary/20 bg-primary/5 p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h2 className="font-semibold">Why this is a real agent</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    The response is generated from the live conversation. The
                    agent updates structured context, calls the triage tool,
                    chooses the next question, validates the model output, and
                    passes verified parameters to hospital search.
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

export default Triage;
