import { pipeline } from "@huggingface/transformers";

interface DecisionInput {
  emergencyType: string;
  candidateCount: number;
  recommendedHospital: string;
  etaMinutes: number;
  etaSource: string;
  availability: string;
}

interface ModelOutput {
  generated_text?: string;
}

const MODEL = "Xenova/flan-t5-small";

function progressLabel(value: unknown) {
  if (!value || typeof value !== "object") {
    return { label: "Loading the on-device AI model…" };
  }

  const progress = value as {
    status?: string;
    file?: string;
    progress?: number;
  };
  const percent = Number.isFinite(progress.progress)
    ? Math.max(0, Math.min(100, Math.round(progress.progress ?? 0)))
    : undefined;
  const label =
    progress.status === "progress"
      ? `Downloading the on-device model${percent === undefined ? "" : ` • ${percent}%`}`
      : progress.status === "ready"
        ? "Model ready • generating a private explanation…"
        : "Loading the on-device AI model…";

  return { label, percent };
}

self.onmessage = async (event: MessageEvent<{ decision: DecisionInput }>) => {
  const { decision } = event.data;
  const factualExplanation = [
    `QuickER compared ${decision.candidateCount} hospitals for the ${decision.emergencyType} filter.`,
    `It recommends ${decision.recommendedHospital} with a ranked ETA of ${decision.etaMinutes} minutes.`,
    `The ETA source is ${decision.etaSource.split("-").join(" ")}.`,
    decision.availability === "unknown"
      ? "Availability is unknown."
      : `The simulated availability feed marks it ${decision.availability}.`,
    "Specialty and current capability must be confirmed with the facility.",
  ].join(" ");
  const prompt = [
    "Paraphrase the routing explanation below as one calm paragraph of no more than 70 words.",
    "Keep the hospital name and every number exactly. Do not add medical advice, diagnosis, treatment, certainty, or new facts.",
    factualExplanation,
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
      label: "Model ready • generating a private explanation…",
    });
    const output = (await generator(prompt, {
      do_sample: false,
      max_new_tokens: 100,
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
