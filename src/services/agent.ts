import type { DecisionRecord } from "@/services/analytics";

export type AgentExplanationMode = "local-ai" | "deterministic";

export interface AgentExplanation {
  text: string;
  mode: AgentExplanationMode;
  model?: string;
}

export interface AgentProgress {
  label: string;
  percent?: number;
}

export function deterministicExplanation(
  decision: DecisionRecord,
): AgentExplanation {
  const availability =
    decision.availability === "unknown"
      ? "availability is unknown"
      : `the demo availability feed marks it ${decision.availability}`;

  return {
    mode: "deterministic",
    text: `QuickER recommends ${decision.recommendedHospital} after comparing ${decision.candidateCount} candidates for the ${decision.emergencyType} filter. ${availability}, and its ranked ETA is ${decision.etaMinutes} minutes using ${decision.etaSource.split("-").join(" ")} data. Confirm specialty and current capability with the facility.`,
  };
}

export function isSafeModelExplanation(
  text: string,
  decision: DecisionRecord,
): boolean {
  const normalized = text.trim().toLocaleLowerCase();
  const hospitalName = decision.recommendedHospital.trim().toLocaleLowerCase();
  const unsafeClaim =
    /\b(diagnos\w*|treat\w*|medicat\w*|guarantee\w*|cure\w*|definitely safe|you have|safe to wait|delay care)\b/i;
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  return (
    normalized.length >= 20 &&
    normalized.length <= 700 &&
    wordCount <= 100 &&
    normalized.includes(hospitalName) &&
    normalized.includes(String(decision.etaMinutes)) &&
    !unsafeClaim.test(normalized) &&
    !normalized.includes("http://") &&
    !normalized.includes("https://")
  );
}

export async function explainDecision(
  decision: DecisionRecord,
  onProgress?: (progress: AgentProgress) => void,
  question?: string,
): Promise<AgentExplanation> {
  return new Promise((resolve) => {
    const fallback = () => resolve(deterministicExplanation(decision));

    try {
      const worker = new Worker(
        new URL("../workers/agent.worker.ts", import.meta.url),
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
          isSafeModelExplanation(event.data.text, decision)
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
      worker.postMessage({
        decision,
        question: question?.trim().slice(0, 300),
      });
    } catch {
      fallback();
    }
  });
}
