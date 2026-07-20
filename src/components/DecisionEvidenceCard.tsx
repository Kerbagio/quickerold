import {
  ArrowRight,
  Clock3,
  GitCompareArrows,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Hospital } from "@/services/hospitalSearch";
import type { DecisionEvidence } from "@/services/decisionEvidence";
import { availabilityLabel } from "@/services/availability";

interface DecisionEvidenceCardProps {
  evidence: DecisionEvidence<Hospital>;
}

const ComparisonCell = ({
  eyebrow,
  hospital,
  icon: Icon,
  selected = false,
}: {
  eyebrow: string;
  hospital: Hospital;
  icon: typeof MapPinned;
  selected?: boolean;
}) => (
  <div
    className={`min-w-0 rounded-2xl border p-4 ${
      selected
        ? "border-primary/40 bg-primary/5 shadow-sm"
        : "bg-background/70"
    }`}
  >
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <Icon className="h-4 w-4" /> {eyebrow}
      </span>
      {selected ? <Badge>Selected</Badge> : null}
    </div>
    <p className="truncate font-semibold" title={hospital.name}>
      {hospital.name}
    </p>
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">{hospital.eta}</span>
      <span>{hospital.distance}</span>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">
      {availabilityLabel(hospital.availability.status)}
    </p>
  </div>
);

const DecisionEvidenceCard = ({ evidence }: DecisionEvidenceCardProps) => {
  const isFaster = evidence.reason === "faster-than-nearest";
  const isTradeoff = evidence.reason === "availability-tradeoff";
  const headline = isFaster
    ? `${evidence.timeDeltaVsNearest} min faster than the closest option`
    : isTradeoff
      ? `${evidence.timeDeltaVsFastest} min availability trade-off`
      : "Closest, fastest, and suitable are the same option";
  const explanation = isFaster
    ? `${evidence.nearestByDistance.name} has the shortest returned route distance, but ${evidence.recommended.name} has the lower current ETA.`
    : isTradeoff
      ? `${evidence.fastestByEta.name} has the raw fastest ETA, but the clearly labelled availability order moves ${evidence.recommended.name} ahead.`
      : `${evidence.recommended.name} leads on both returned route distance and ETA, so QuickER does not force a different choice.`;

  return (
    <Card className="overflow-hidden border-primary/20 shadow-soft">
      <div className="border-b bg-muted/30 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
              <GitCompareArrows className="h-4 w-4" /> Decision evidence
            </div>
            <h2 className="text-2xl font-bold">{headline}</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {explanation}
            </p>
          </div>
          <Badge variant="outline" className="w-fit shrink-0 bg-background/70">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Explainable ranking
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:p-6 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
        <ComparisonCell
          eyebrow="Closest route"
          hospital={evidence.nearestByDistance}
          icon={MapPinned}
        />
        <ArrowRight className="mx-auto hidden h-5 w-5 text-muted-foreground lg:block" />
        <ComparisonCell
          eyebrow="Fastest ETA"
          hospital={evidence.fastestByEta}
          icon={Clock3}
        />
        <ArrowRight className="mx-auto hidden h-5 w-5 text-muted-foreground lg:block" />
        <ComparisonCell
          eyebrow="Fastest suitable"
          hospital={evidence.recommended}
          icon={ShieldCheck}
          selected
        />
      </div>

      <div className="border-t px-5 py-3 text-xs text-muted-foreground sm:px-6">
        “Closest” uses the returned route distance when available. Availability is simulated or unknown unless an authorized operational feed is connected.
      </div>
    </Card>
  );
};

export default DecisionEvidenceCard;
