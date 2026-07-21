import { pipeline } from "@huggingface/transformers";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface TriageSnapshot {
  urgency: string;
  severity: string;
  riskLevel: string;
  confidence: string;
  headline: string;
  summary: string;
  nextStep: string;
  matchedSignals: string[];
  requiresImmediateAction: boolean;
}

interface GenerateRequest {
  requestId: string;
  conversation: ChatMessage[];
  triage: TriageSnapshot;
  nextQuestion: string | null;
  toolSummary: string[];
}

interface GeneratedChatMessage {
  role?: string;
  content?: string;
}

interface GenerationRecord {
  generated_text?: string | GeneratedChatMessage[];
}

type TextGenerator = (
  input: Array<{ role: string; content: string }>,
  options: Record<string, unknown>,
) => Promise<GenerationRecord | GenerationRecord[]>;

const MODEL = "onnx-community/Qwen2.5-0.5B-Instruct";
let generatorPromise: Promise<TextGenerator> | null = null;

function progressMessage(value: unknown): {
  label: string;
  percent?: number;
} {
  if (!value || typeof value !== "object") {
    return { label: "Loading the private on-device agent…" };
  }

  const progress = value as {
    status?: string;
    file?: string;
    progress?: number;
  };
  const percent = Number.isFinite(progress.progress)
    ? Math.max(0, Math.min(100, Math.round(progress.progress ?? 0)))
    : undefined;

  if (progress.status === "progress") {
    return {
      label: `Downloading the private agent${percent === undefined ? "" : ` • ${percent}%`}`,
      percent,
    };
  }

  if (progress.status === "ready") {
    return { label: "Agent ready • composing a response…", percent: 100 };
  }

  return { label: "Loading the private on-device agent…", percent };
}

async function loadGenerator(): Promise<TextGenerator> {
  const supportsWebGpu = "gpu" in navigator;
  const modelOptions: Record<string, unknown> = {
    dtype: supportsWebGpu ? "q4" : "q8",
    progress_callback: (value: unknown) => {
      self.postMessage({ type: "progress", ...progressMessage(value) });
    },
  };
  if (supportsWebGpu) modelOptions.device = "webgpu";

  const generator = await pipeline(
    "text-generation",
    MODEL,
    modelOptions,
  );
  return generator as unknown as TextGenerator;
}

function getGenerator(): Promise<TextGenerator> {
  generatorPromise ??= loadGenerator();
  return generatorPromise;
}

function extractText(output: GenerationRecord | GenerationRecord[]): string {
  const record = Array.isArray(output) ? output[0] : output;
  const generated = record?.generated_text;
  if (typeof generated === "string") return generated.trim();
  if (Array.isArray(generated)) {
    return generated.at(-1)?.content?.trim() ?? "";
  }
  return "";
}

function buildSystemPrompt(request: GenerateRequest): string {
  const result = request.triage;
  return [
    "You are QuickER, a calm health-navigation agent running privately in the user's browser.",
    "You are not a doctor and must never diagnose, prescribe, or claim that a situation is safe.",
    "The deterministic safety-tool result below is authoritative. Never downgrade it or contradict it.",
    "Write a natural response tailored to this conversation, not a canned template.",
    "Use no more than 90 words. Explain uncertainty plainly.",
    "Do not provide medication instructions, treatment plans, links, or invented medical facts.",
    result.requiresImmediateAction
      ? "This result requires immediate action. Clearly tell the user to contact local emergency services now."
      : "Do not exaggerate the result. State the recommended urgency and next step accurately.",
    `Tool urgency: ${result.urgency}`,
    `Tool severity: ${result.severity}`,
    `Tool risk: ${result.riskLevel}`,
    `Tool confidence: ${result.confidence}`,
    `Tool headline: ${result.headline}`,
    `Tool summary: ${result.summary}`,
    `Tool next step: ${result.nextStep}`,
    `Detected signals: ${result.matchedSignals.join(", ") || "none"}`,
    `Next structured question shown by the interface: ${request.nextQuestion ?? "none"}`,
    `Tools executed: ${request.toolSummary.join("; ")}`,
  ].join("\n");
}

self.onmessage = async (event: MessageEvent<GenerateRequest>) => {
  const request = event.data;

  try {
    const generator = await getGenerator();
    self.postMessage({
      type: "progress",
      label: "Agent ready • composing a private response…",
      percent: 100,
    });

    const recentConversation = request.conversation
      .slice(-8)
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 1200),
      }));

    const output = await generator(
      [
        { role: "system", content: buildSystemPrompt(request) },
        ...recentConversation,
        {
          role: "user",
          content:
            "Respond to the latest user message using the authoritative tool result. Do not repeat the structured follow-up question because the interface displays it separately.",
        },
      ],
      {
        max_new_tokens: 130,
        do_sample: true,
        temperature: 0.45,
        top_p: 0.9,
        repetition_penalty: 1.12,
        return_full_text: true,
      },
    );

    const text = extractText(output);
    if (!text) throw new Error("The local model returned no response.");

    self.postMessage({
      type: "complete",
      requestId: request.requestId,
      text,
      model: "Qwen2.5 0.5B Instruct • on-device",
    });
  } catch (error) {
    generatorPromise = null;
    self.postMessage({
      type: "error",
      requestId: request.requestId,
      message:
        error instanceof Error ? error.message : "The local model failed to run.",
    });
  }
};
