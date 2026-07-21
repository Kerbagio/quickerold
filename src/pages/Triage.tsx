import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CircleHelp,
  FileText,
  HeartPulse,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { clearPageMemory } from "@/hooks/usePageMemory";
import {
  assessTriage,
  DEFAULT_TRIAGE_CONTEXT,
  type TriageAnswer,
  type TriageContext,
  type TriageResult,
} from "@/services/triage";
import { emergencyTypeLabel } from "@/services/emergency";

const examples = [
  "I have chest pressure and shortness of breath.",
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

const criticalChecks: Array<{
  key: keyof TriageContext;
  question: string;
  hint: string;
  dangerAnswer: TriageAnswer;
}> = [
  {
    key: "conscious",
    question: "Is the person conscious and responding normally?",
    hint: "Choose No if they cannot be awakened or are not responding normally.",
    dangerAnswer: "no",
  },
  {
    key: "breathingNormally",
    question: "Are they breathing normally and able to speak?",
    hint: "Choose No for gasping, choking, stopped breathing, or severe breathing difficulty.",
    dangerAnswer: "no",
  },
  {
    key: "severeBleeding",
    question: "Is there severe or uncontrolled bleeding?",
    hint: "Choose Yes if bleeding is heavy or will not stop.",
    dangerAnswer: "yes",
  },
  {
    key: "worseningRapidly",
    question: "Are the symptoms getting worse quickly?",
    hint: "Rapid worsening raises the urgency even when the cause is unclear.",
    dangerAnswer: "yes",
  },
];

const answerOptions: Array<{ value: TriageAnswer; label: string }> = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Not sure" },
];

const Triage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [input, setInput] = useState("");
  const [context, setContext] = useState<TriageContext>({
    ...DEFAULT_TRIAGE_CONTEXT,
  });
  const [result, setResult] = useState<TriageResult | null>(null);

  const canAssess = useMemo(() => input.trim().length >= 3, [input]);

  const runAssessment = (
    value = input,
    nextContext: TriageContext = context,
  ) => {
    const cleaned = value.trim().slice(0, 5000);
    if (cleaned.length < 3) return;
    setInput(cleaned);
    setResult(assessTriage(cleaned, nextContext));
  };

  const updateCriticalCheck = (
    key: keyof TriageContext,
    value: TriageAnswer,
  ) => {
    const nextContext = { ...context, [key]: value };
    setContext(nextContext);
    if (result && input.trim().length >= 3) {
      setResult(assessTriage(input, nextContext));
    }
  };

  const reset = () => {
    setInput("");
    setContext({ ...DEFAULT_TRIAGE_CONTEXT });
    setResult(null);
  };

  const prepareHospitalSearch = () => {
    if (!result) return;
    localStorage.setItem("defaultEmergencyType", result.emergencyType);
    localStorage.setItem("searchRadius", String(result.radiusKm));
    clearPageMemory("home.");
    navigate("/home");
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
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className="bg-success text-success-foreground">$0 to run</Badge>
                <Badge variant="outline">No paid AI API</Badge>
                <Badge variant="outline">Safety-first browser triage</Badge>
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">QuickER Health Triage</h1>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
                Describe the symptoms, then answer four critical checks. QuickER uses hard emergency gates first, estimates urgency, and prepares the appropriate hospital search.
              </p>
            </div>
            <div className="hidden h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 lg:flex">
              <HeartPulse className="h-12 w-12 text-primary" />
            </div>
          </div>
        </Card>

        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <strong>Safety notice:</strong> This prototype does not diagnose illness or replace a clinician. For immediate danger or life-threatening symptoms, contact local emergency services now.
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="space-y-6">
            <Card className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Describe what is happening</h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Include the main symptom, when it started, age group, whether it is worsening, and pregnancy status when relevant.
                  </p>
                </div>
                {result ? (
                  <Button type="button" size="sm" variant="ghost" onClick={reset}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                ) : null}
              </div>

              <Textarea
                value={input}
                onChange={(event) => {
                  setInput(event.target.value.slice(0, 5000));
                  setResult(null);
                }}
                placeholder="Example: My father developed sudden chest pressure 20 minutes ago and is struggling to breathe."
                className="min-h-[170px] resize-y rounded-2xl"
                aria-label="Symptoms or medical report summary"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Do not enter names, IDs, phone numbers, or addresses.</span>
                <span>{input.length}/5000</span>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Try a safety test
                </p>
                <div className="flex flex-wrap gap-2">
                  {examples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      className="rounded-full border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                      onClick={() => {
                        setContext({ ...DEFAULT_TRIAGE_CONTEXT });
                        runAssessment(example, { ...DEFAULT_TRIAGE_CONTEXT });
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">Critical safety checks</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    These answers override the wording analysis. They are never used to downgrade an emergency warning sign.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {criticalChecks.map((check) => (
                  <div key={check.key} className="rounded-2xl border p-4">
                    <p className="font-medium">{check.question}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {check.hint}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {answerOptions.map((option) => {
                        const selected = context[check.key] === option.value;
                        const dangerous = option.value === check.dangerAnswer;
                        return (
                          <Button
                            key={option.value}
                            type="button"
                            size="sm"
                            variant={
                              selected
                                ? dangerous
                                  ? "destructive"
                                  : "default"
                                : "outline"
                            }
                            onClick={() =>
                              updateCriticalCheck(check.key, option.value)
                            }
                          >
                            {option.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                size="lg"
                className="mt-5 w-full"
                disabled={!canAssess}
                onClick={() => runAssessment()}
              >
                <Search className="mr-2 h-5 w-5" /> Assess urgency
              </Button>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Triage result</h2>
              </div>

              {result ? (
                <div className="space-y-4">
                  <div className={`rounded-2xl border p-4 ${urgencyStyles[result.urgency]}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      {urgencyLabels[result.urgency]}
                    </p>
                    <h3 className="mt-1 text-lg font-bold">{result.headline}</h3>
                  </div>

                  {result.requiresImmediateAction ? (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                      <strong>Do not wait for this app:</strong> follow the emergency instruction below now.
                    </div>
                  ) : null}

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {result.summary}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Severity</p>
                      <p className="mt-1 text-sm font-semibold capitalize">{result.severity}</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Risk</p>
                      <p className="mt-1 text-sm font-semibold capitalize">{result.riskLevel}</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className="mt-1 text-sm font-semibold capitalize">{result.confidence}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Suggested facility filter
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{emergencyTypeLabel(result.emergencyType)}</Badge>
                      <Badge variant="outline">Search radius {result.radiusKm} km</Badge>
                    </div>
                  </div>

                  {result.matchedSignals.length ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Signals used
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

                  {result.followUpQuestions.length ? (
                    <div className="rounded-xl border p-4">
                      <div className="flex items-center gap-2">
                        <CircleHelp className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold">Questions still needed</p>
                      </div>
                      <div className="mt-3 space-y-2">
                        {result.followUpQuestions.map((question) => (
                          <div key={question} className="flex gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{question}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold">Recommended next step</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {result.nextStep}
                    </p>
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    size="lg"
                    onClick={prepareHospitalSearch}
                  >
                    {result.urgency === "needs-more-info"
                      ? "Find general emergency hospitals"
                      : "Find suitable hospitals"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <ShieldCheck className="mx-auto h-9 w-9 text-muted-foreground" />
                  <p className="mt-3 font-medium">No assessment yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter the situation, answer the critical checks, and run the assessment. Unknown text will not be marked green.
                  </p>
                </div>
              )}
            </Card>

            <Card className="border-primary/20 bg-primary/5 p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h2 className="font-semibold">Why this is safer than a normal chatbot</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Emergency rules and structured answers control the classification. Unclear statements receive a clarification result instead of low risk, and any future on-device language model will be allowed to improve wording only—not downgrade the safety result.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium">
                    <a
                      href="https://medlineplus.gov/ency/article/001927.htm"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-4"
                    >
                      MedlinePlus emergency signs
                    </a>
                    <a
                      href="https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-4"
                    >
                      NHS emergency guidance
                    </a>
                  </div>
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
