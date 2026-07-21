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
  HeartPulse,
  RotateCcw,
  Send,
  ShieldCheck,
  UserRound,
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
import { emergencyTypeLabel } from "@/services/emergency";
import type { TriageResult } from "@/services/triage";

interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const initialMessage: AgentMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi — tell me what is happening in your own words. I will ask one focused question at a time and help prepare the right hospital search.",
};

const examples = [
  "Hi",
  "My father has chest pressure and is struggling to breathe.",
  "My child has a high fever and keeps vomiting.",
  "I am pregnant and having severe abdominal pain.",
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
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, plan]);

  const reset = () => {
    setInput("");
    setMessages([initialMessage]);
    setAgentState(createHealthAgentState());
    setPlan(null);
  };

  const submitPrompt = (rawPrompt = input) => {
    const prompt = rawPrompt.trim().slice(0, 1200);
    if (!prompt) return;

    const nextPlan = planHealthAgentTurn(prompt, agentState);
    const now = Date.now();
    const userMessage: AgentMessage = {
      id: `${now}-user`,
      role: "user",
      content: prompt,
    };
    const assistantMessage: AgentMessage = {
      id: `${now}-assistant`,
      role: "assistant",
      content: nextPlan.reply,
    };

    setInput("");
    setAgentState(nextPlan.state);
    setPlan(nextPlan);
    setMessages((current) => [...current, userMessage, assistantMessage]);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitPrompt();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitPrompt();
    }
  };

  const prepareHospitalSearch = () => {
    const result = plan?.triage ?? agentState.triage;
    if (!result) return;
    localStorage.setItem("defaultEmergencyType", result.emergencyType);
    localStorage.setItem("searchRadius", String(result.radiusKm));
    clearPageMemory("home.");
    navigate("/home");
  };

  const result = plan?.triage ?? agentState.triage;
  const canPrepareHospitalSearch = Boolean(
    result &&
      (plan?.canPrepareHospitalSearch ??
        (result.urgency !== "needs-more-info" || result.requiresImmediateAction)),
  );

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
                  $0 • ready instantly
                </Badge>
                <Badge variant="outline">No download</Badge>
                <Badge variant="outline">No API key</Badge>
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                QuickER Triage Assistant
              </h1>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
                A guided conversation that remembers your answers, checks urgent
                warning signs, and prepares the appropriate hospital search.
              </p>
            </div>
            <div className="hidden h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 lg:flex">
              <HeartPulse className="h-12 w-12 text-primary" />
            </div>
          </div>
        </Card>

        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <strong>Safety notice:</strong> This assistant does not diagnose or
          replace a clinician. For immediate danger or life-threatening symptoms,
          contact local emergency services now.
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)]">
          <Card className="flex min-h-[650px] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Conversation</h2>
                  <p className="text-xs text-muted-foreground">
                    Instant replies • temporary in-tab memory
                  </p>
                </div>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={reset}>
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
                  </div>
                  {message.role === "user" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <UserRound className="h-4 w-4" />
                    </div>
                  ) : null}
                </div>
              ))}

              {plan?.nextQuestion ? (
                <div className="ml-0 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:ml-11">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    One quick question
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
                          onClick={() => submitPrompt(option.value)}
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
                      onClick={() => submitPrompt(example)}
                      className="rounded-full border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="relative">
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value.slice(0, 1200))}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe symptoms or answer the question…"
                  className="min-h-[92px] resize-none rounded-2xl pb-10 pr-14"
                  aria-label="Message the QuickER triage assistant"
                />
                <span className="absolute bottom-3 left-4 text-[11px] text-muted-foreground">
                  {input.length}/1200 • Enter to send
                </span>
                <Button
                  type="submit"
                  size="icon"
                  className="absolute bottom-3 right-3 rounded-xl"
                  disabled={!input.trim()}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                No model is downloaded. Messages remain only in this tab and are
                cleared when you reset or reload.
              </p>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Current assessment</h2>
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
                      <strong>Immediate action:</strong> do not wait for this app
                      before contacting emergency services.
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
                      Hospital search
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
                        Warning signs detected
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

                  {canPrepareHospitalSearch ? (
                    <Button
                      type="button"
                      size="lg"
                      className="w-full"
                      onClick={prepareHospitalSearch}
                    >
                      Find suitable hospitals
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  ) : (
                    <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                      Answer the next question before hospital filtering is enabled.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-5 text-center">
                  <HeartPulse className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-medium">No assessment yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Say hello or describe what is happening to begin.
                  </p>
                </div>
              )}
            </Card>

            <Card className="border-primary/20 bg-primary/5 p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h2 className="font-semibold">What this version is</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    This is an instant guided triage assistant, not a general-purpose
                    LLM. It adapts questions from the conversation and uses a safety
                    rules engine, without pretending to diagnose.
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
