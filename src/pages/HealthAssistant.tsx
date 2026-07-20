import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Database,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDecisionHistory } from "@/services/analytics";
import {
  deterministicExplanation,
  explainDecision,
  type AgentExplanation,
} from "@/services/agent";

const HealthAssistant = () => {
  const { language } = useLanguage();
  const latestDecision = getDecisionHistory()[0];
  const [explanation, setExplanation] = useState<AgentExplanation | null>(() =>
    latestDecision ? deterministicExplanation(latestDecision) : null,
  );
  const [isExplaining, setIsExplaining] = useState(false);

  const generateExplanation = async () => {
    if (!latestDecision) return;
    setIsExplaining(true);
    setExplanation(await explainDecision(latestDecision));
    setIsExplaining(false);
  };

  const steps = [
    {
      icon: MapPinned,
      title: "Observe",
      description: "Read the selected start point, emergency filter, nearby hospitals and ETA source.",
    },
    {
      icon: Database,
      title: "Evaluate",
      description: "Check specialty metadata and availability status before comparing eligible ETAs.",
    },
    {
      icon: ShieldCheck,
      title: "Act",
      description: "Rank facilities, highlight the safest eligible option and prepare its road route.",
    },
    {
      icon: BrainCircuit,
      title: "Explain",
      description: "Show exactly which data source and rule produced the recommendation.",
    },
  ];

  return (
    <Layout>
      <div
        className={`container mx-auto space-y-8 px-4 py-6 sm:px-6 sm:py-8 ${
          language === "ar" ? "rtl" : ""
        }`}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-4 text-3xl font-bold">QuickER Dispatch Agent</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A transparent decision agent for hospital routing—not a symptom checker and not medical advice.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Card key={step.title} className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <step.icon className="h-6 w-6 text-primary" />
                <Badge variant="outline">Step {index + 1}</Badge>
              </div>
              <h2 className="mb-2 font-semibold">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </Card>
          ))}
        </div>

        <Card className="border-primary/30 bg-primary/5 p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Latest agent decision</h2>
              <p className="text-sm text-muted-foreground">
                Generated from structured routing data stored locally in this browser.
              </p>
            </div>
            <Badge variant="outline">Deterministic safety rules</Badge>
          </div>

          {latestDecision ? (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <div>
                  <h3 className="font-semibold">
                    Recommend {latestDecision.recommendedHospital}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {explanation?.text}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge variant="outline">
                  {explanation?.mode === "gemini"
                    ? `Gemini AI${explanation.model ? ` • ${explanation.model}` : ""}`
                    : "Deterministic fallback"}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateExplanation}
                  disabled={isExplaining}
                >
                  <Sparkles className={`mr-2 h-4 w-4 ${isExplaining ? "animate-pulse" : ""}`} />
                  {isExplaining ? "Generating…" : "Explain with free AI"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Availability is a demo feed unless explicitly connected to an authorized hospital system. Specialty metadata must be confirmed with the facility.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-background p-6 text-center">
              <p className="mb-4 text-muted-foreground">
                No routing decision has been recorded yet.
              </p>
              <Button asChild>
                <Link to="/home">
                  Find a hospital <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <BrainCircuit className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Optional free AI layer</h2>
              </div>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Gemini converts only the non-location decision summary into a natural explanation through a Cloudflare Pages Function. The rules engine remains responsible for eligibility and routing, so the app still functions when AI is unconfigured or its free quota is unavailable.
              </p>
            </div>
            <Badge variant="outline">Free-tier optional</Badge>
          </div>
        </Card>

        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <strong>Safety boundary:</strong> The agent does not diagnose symptoms, determine treatment, confirm hospital capability, or replace local emergency services.
        </div>
      </div>
    </Layout>
  );
};

export default HealthAssistant;
