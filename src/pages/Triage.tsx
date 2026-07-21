import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
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
import { assessTriage, type TriageResult } from "@/services/triage";
import { emergencyTypeLabel } from "@/services/emergency";

const examples = [
  "I have chest pressure and shortness of breath.",
  "My child has a high fever and keeps vomiting.",
  "I am pregnant and having severe abdominal pain.",
];

const urgencyStyles: Record<TriageResult["urgency"], string> = {
  emergency: "border-destructive/40 bg-destructive/10 text-destructive",
  urgent: "border-warning/40 bg-warning/10 text-warning",
  soon: "border-primary/30 bg-primary/10 text-primary",
  "self-care": "border-success/30 bg-success/10 text-success",
};

const Triage = () => {
  const { language } = useLanguage();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);

  const canAssess = useMemo(() => input.trim().length >= 8, [input]);

  const runAssessment = (value = input) => {
    const cleaned = value.trim().slice(0, 5000);
    if (cleaned.length < 8) return;
    setInput(cleaned);
    setResult(assessTriage(cleaned));
  };

  const reset = () => {
    setInput("");
    setResult(null);
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
                <Badge variant="outline">No AI API</Badge>
                <Badge variant="outline">Browser-only assessment</Badge>
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">QuickER Health Triage</h1>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
                Describe symptoms or paste medical-report text. QuickER checks a transparent set of warning-sign rules, estimates urgency, and prepares the right hospital search.
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
              onChange={(event) => setInput(event.target.value.slice(0, 5000))}
              placeholder="Example: My father developed sudden chest pressure 20 minutes ago and is struggling to breathe."
              className="min-h-[190px] resize-y rounded-2xl"
              aria-label="Symptoms or medical report text"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Do not enter names, IDs, phone numbers, or addresses.</span>
              <span>{input.length}/5000</span>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                className="flex-1"
                disabled={!canAssess}
                onClick={() => runAssessment()}
              >
                <Search className="mr-2 h-5 w-5" /> Assess urgency
              </Button>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Try an example
              </p>
              <div className="flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="rounded-full border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                    onClick={() => runAssessment(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </Card>

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
                      {result.urgency.split("-").join(" ")}
                    </p>
                    <h3 className="mt-1 text-lg font-bold">{result.headline}</h3>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Severity</p>
                      <p className="mt-1 font-semibold capitalize">{result.severity}</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Risk level</p>
                      <p className="mt-1 font-semibold capitalize">{result.riskLevel}</p>
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
                        Detected warning phrases
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.matchedSignals.map((signal) => (
                          <Badge key={signal} variant="outline">{signal}</Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold">Recommended next step</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{result.nextStep}</p>
                  </div>

                  <Button asChild className="w-full" size="lg">
                    <Link to={`/home?emergencyType=${result.emergencyType}&radius=${result.radiusKm}`}>
                      Find suitable hospitals
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <ShieldCheck className="mx-auto h-9 w-9 text-muted-foreground" />
                  <p className="mt-3 font-medium">No assessment yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter symptoms or report text to generate urgency, severity, risk, specialty, and radius fields.
                  </p>
                </div>
              )}
            </Card>

            <Card className="border-primary/20 bg-primary/5 p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h2 className="font-semibold">How this free version works</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    The urgency decision comes from visible browser rules, not an online language-model API. A future optional on-device model can improve wording and follow-up questions without controlling the safety classification.
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
