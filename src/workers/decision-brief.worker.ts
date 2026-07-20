import { pipeline } from "@huggingface/transformers";
import type { DecisionRecord } from "@/services/analytics";

interface ModelOutput {
  generated_text?: string;
}

const MODEL = "Xenova/flan-t5-small";

function progressLabel(value: unknown) {
  if (!value || typeof value !== "object") {
    return { label: "Loading the private on-device model…" };
  }

  const progress = value as {
    status?: string;
    progress?: number;
  };
  const percent = Number.isFinite(progress.progress)
    ? Math.max(0, Math.min(100, Math.round(progress.progress ?? 0)))
    : undefined;
  const label =
    progress.status === "progress"
      ? `Downloading the on-device model${percent === undefined ? "" : ` • ${percent}%`}`
      : progress.status === "ready"
        ? "Model ready • writing the decision brief…"
        : "Loading the private on-device model…";

  return { label, percent };
}

function comparisonFact(decision: DecisionRecord): string {
  if (
    decision.selectionReason === "availability-tradeoff" &&
    decision.fastestHospital &&
    decision.fastestEtaMinutes !== undefined
  ) {
    return `${decision.fastestHospital} has the raw fastest ETA of ${decision.fastestEtaMinutes} minutes, but the clearly labelled availability rule changed the recommendation.`;
  }

  if (
    decision.timeDeltaVsNearest !== undefined &&
    decision.timeDeltaVsNearest > 0 &&
    decision.nearestHospital
  ) {
    return `${decision.recommendedHospital} is ${decision.timeDeltaVsNearest} minutes faster by the current ETA than the closest routed-distance option, ${decision.nearestHospital}.`;
  }

  return "The closest routed-distance option is also the fastest suitable result.";
}

self.onmessage = async (event: MessageEvent<{ decision: DecisionRecord }>) => {
  const { decision } = event.data;
  const verifiedFacts = [
    `QuickER compared ${decision.candidateCount} hospitals for the ${decision.emergencyType} filter.`,
    `It recommends ${decision.recommendedHospital} with a ranked ETA of ${decision.etaMinutes} minutes.`,
    comparisonFact(decision),
    `The ETA source is ${decision.etaSource.split("-").join(" ")}.`,
    decision.availability === "unknown"
      ? "Availability is unknown."
      : `The simulated availability feed marks the recommendation ${decision.availability}.`,
    "Specialty and current capability must be confirmed with the facility.",
  ].join(" ");
  const prompt = [
    "Write one calm, clear decision brief of no more than 85 words using only the verified routing facts below.",
    "Keep the exact recommended hospital name and ranked ETA. Explain the closest-versus-fastest comparison when provided.",
    "Do not add medical advice, diagnosis, treatment, guarantees, emergency phone numbers, links, or new facts.",
    "Do not say that the AI selected the hospital; the routing engine made the decision.",
    `Verified routing facts: ${verifiedFacts}`,
  ].join("\n");

  try {
    const generator = await pipeline("text2text-generation", MODEL, {
      dtype: "q8",
      progress_callback: (progress) => {
        self.postMessage({ type: "progress", ...progressLabel(progress) });
      },
    });
    self.postMessage({
      type: "progress",
      label: "Model ready • writing the decision brief…",
    });
    const output = (await generator(prompt, {
      do_sample: false,
      max_new_tokens: 120,
    })) as ModelOutput | ModelOutput[];
    const text = (Array.isArray(output) ? output[0] : output)?.generated_text;
    if (!text?.trim()) throw new Error("The local model returned no text.");

    self.postMessage({
      type: "complete",
      text: text.trim(),
      model: "FLAN-T5 Small • on-device",
    });
  } catch {
    self.postMessage({ type: "error" });
  }
};
