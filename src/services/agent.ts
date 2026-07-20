import type { DecisionRecord } from "@/services/analytics";

export type AgentExplanationMode = "gemini" | "deterministic";

export interface AgentExplanation {
  text: string;
  mode: AgentExplanationMode;
  model?: string;
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

export async function explainDecision(
  decision: DecisionRecord,
): Promise<AgentExplanation> {
  try {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    if (!response.ok) throw new Error("AI explanation unavailable");

    const payload = (await response.json()) as {
      explanation?: string;
      model?: string;
    };
    if (!payload.explanation?.trim()) throw new Error("Empty AI explanation");

    return {
      text: payload.explanation.trim(),
      mode: "gemini",
      model: payload.model,
    };
  } catch {
    return deterministicExplanation(decision);
  }
}
