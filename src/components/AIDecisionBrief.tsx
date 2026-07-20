import { BrainCircuit, CheckCircle2, LoaderCircle, LockKeyhole, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePageMemory } from "@/hooks/usePageMemory";
import type { DecisionRecord } from "@/services/analytics";
import {
  generateDecisionBrief,
  type DecisionBrief,
} from "@/services/decisionAI";

interface BriefMemory {
  decisionKey: string;
  brief: DecisionBrief | null;
  loading: boolean;
  progressLabel: string;
  progressPercent?: number;
}

interface AIDecisionBriefProps {
  decision: DecisionRecord;
  memoryKey?: string;
}

const AIDecisionBrief = ({
  decision,
  memoryKey = "home.aiBrief",
}: AIDecisionBriefProps) => {
  const decisionKey = [
    decision.timestamp,
    decision.recommendedHospital,
    decision.etaMinutes,
    decision.availability,
  ].join(":");
  const [memory, setMemory] = usePageMemory<BriefMemory>(memoryKey, {
    decisionKey: "",
    brief: null,
    loading: false,
    progressLabel: "",
  });
  const isCurrent = memory.decisionKey === decisionKey;
  const brief = isCurrent ? memory.brief : null;
  const loading = isCurrent && memory.loading;

  const createBrief = async () => {
    setMemory({
      decisionKey,
      brief: null,
      loading: true,
      progressLabel: "Preparing verified routing facts…",
    });
    const result = await generateDecisionBrief(decision, (progress) => {
      setMemory((current) =>
        current.decisionKey === decisionKey
          ? {
              ...current,
              progressLabel: progress.label,
              progressPercent: progress.percent,
            }
          : current,
      );
    });
    setMemory((current) =>
      current.decisionKey === decisionKey
        ? {
            ...current,
            brief: result,
            loading: false,
            progressLabel: "",
            progressPercent: undefined,
          }
        : current,
    );
  };

  return (
    <Card className="overflow-hidden border-accent/25 shadow-soft">
      <div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="border-b bg-accent/5 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <Badge variant="outline" className="mb-3 border-accent/30 text-accent">
            Private on-device AI
          </Badge>
          <h2 className="text-2xl font-bold">Decision Brief</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            AI turns the verified ranking into a clear explanation. It receives no precise coordinates and cannot change which hospital QuickER selected.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <LockKeyhole className="h-4 w-4" /> Runs in this browser after download
          </div>
        </div>

        <div className="flex min-h-64 flex-col justify-center p-5 sm:p-6">
          {loading ? (
            <div role="status" aria-live="polite">
              <div className="flex items-center gap-3">
                <LoaderCircle className="h-5 w-5 animate-spin text-accent" />
                <p className="font-semibold">{memory.progressLabel}</p>
              </div>
              <Progress
                className="mt-4 h-2"
                value={memory.progressPercent ?? 12}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                The first model download can take longer; later runs can use the browser cache.
              </p>
            </div>
          ) : brief ? (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    brief.mode === "local-ai"
                      ? "bg-accent text-accent-foreground"
                      : undefined
                  }
                  variant={brief.mode === "local-ai" ? "default" : "outline"}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {brief.mode === "local-ai"
                    ? "On-device AI • validated"
                    : "Verified rules fallback"}
                </Badge>
                {brief.model ? (
                  <span className="text-xs text-muted-foreground">
                    {brief.model}
                  </span>
                ) : null}
              </div>
              <p className="text-base leading-relaxed text-foreground">
                {brief.text}
              </p>
              {brief.mode === "deterministic" ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  The local model was unavailable or its output failed validation, so this result is not presented as AI-generated.
                </p>
              ) : null}
              <Button
                className="mt-5"
                size="sm"
                variant="outline"
                onClick={() => void createBrief()}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Regenerate brief
              </Button>
            </div>
          ) : (
            <div>
              <p className="font-semibold">Explain this exact routing decision</p>
              <p className="mt-2 text-sm text-muted-foreground">
                QuickER sends only the selected hospital, ETA, source, comparison, and labelled availability status to the local model. Unsupported clinical claims are rejected.
              </p>
              <Button className="mt-5" onClick={() => void createBrief()}>
                <BrainCircuit className="mr-2 h-4 w-4" /> Generate AI brief
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AIDecisionBrief;
