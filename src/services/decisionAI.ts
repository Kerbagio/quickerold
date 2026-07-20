import type { DecisionRecord } from "@/services/analytics";

export type DecisionBriefMode = "local-ai" | "deterministic";

export interface DecisionBrief {
  text: string;
  mode: DecisionBriefMode;
  model?: string;
}

export interface DecisionBriefProgress {
  label: string;
  percent?: number;
}

function comparisonSentence(decision: DecisionRecord): string {
  if (
    decision.selectionReason === "availability-tradeoff" &&
    decision.fastestHospital &&
    decision.fastestEtaMinutes !== undefined
  ) {
    const extraMinutes = Math.max(
      0,
      decision.etaMinutes - decision.fastestEtaMinutes,
    );
    return `The raw fastest ETA belongs to ${decision.fastestHospital}; QuickER adds ${extraMinutes} ${extraMinutes === 1 ? "minute" : "minutes"} because the clearly labelled availability rule changed the order.`;
  }

  if (
    decision.timeDeltaVsNearest !== undefined &&
    decision.timeDeltaVsNearest > 0 &&
    decision.nearestHospital
  ) {
    return `It is ${decision.timeDeltaVsNearest} minutes faster by the current ETA than the closest routed-distance option, ${decision.nearestHospital}.`;
  }

  return "The closest routed-distance option is also the fastest suitable result in this comparison.";
}

export function deterministicDecisionBrief(
  decision: DecisionRecord,
): DecisionBrief {
  const availability =
    decision.availability === "unknown"
      ? "availability remains unknown"
      : `the simulated feed marks it ${decision.availability}`;

  return {
    mode: "deterministic",
    text: `QuickER recommends ${decision.recommendedHospital} with a ranked ETA of ${decision.etaMinutes} minutes after comparing ${decision.candidateCount} candidates. ${comparisonSentence(decision)} The ETA uses ${decision.etaSource.split("-").join(" ")} data, ${availability}, and specialty and current capability still need confirmation with the facility.`,
  };
}

export function isSafeModelDecisionBrief(
  text: string,
  decision: DecisionRecord,
): boolean {
  const normalized = text.trim().toLocaleLowerCase();
  const hospitalName = decision.recommendedHospital.trim().toLocaleLowerCase();
  const unsupportedClaim =
    /\b(diagnos\w*|treat\w*|medicat\w*|guarantee\w*|cure\w*|definitely safe|you have|safe to wait|delay care|will survive)\b/i;
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  return (
    normalized.length >= 20 &&
    normalized.length <= 800 &&
    wordCount <= 110 &&
    normalized.includes(hospitalName) &&
    normalized.includes(String(decision.etaMinutes)) &&
    !unsupportedClaim.test(normalized) &&
    !normalized.includes("http://") &&
    !normalized.includes("https://")
  );
}

export async function generateDecisionBrief(
  decision: DecisionRecord,
  onProgress?: (progress: DecisionBriefProgress) => void,
): Promise<DecisionBrief> {
  return new Promise((resolve) => {
    const fallback = () => resolve(deterministicDecisionBrief(decision));

    try {
      const worker = new Worker(
        new URL("../workers/decision-brief.worker.ts", import.meta.url),
        { type: "module" },
      );
      const timeout = window.setTimeout(() => {
        worker.terminate();
        fallback();
      }, 300_000);

      worker.onmessage = (
        event: MessageEvent<
          | { type: "progress"; label: string; percent?: number }
          | { type: "complete"; text: string; model: string }
          | { type: "error" }
        >,
      ) => {
        if (event.data.type === "progress") {
          onProgress?.({
            label: event.data.label,
            percent: event.data.percent,
          });
          return;
        }

        window.clearTimeout(timeout);
        worker.terminate();
        if (
          event.data.type === "complete" &&
          isSafeModelDecisionBrief(event.data.text, decision)
        ) {
          resolve({
            text: event.data.text.trim(),
            mode: "local-ai",
            model: event.data.model,
          });
          return;
        }
        fallback();
      };
      worker.onerror = () => {
        window.clearTimeout(timeout);
        worker.terminate();
        fallback();
      };
      worker.postMessage({ decision });
    } catch {
      fallback();
    }
  });
}
