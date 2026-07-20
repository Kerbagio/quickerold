interface Env {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

interface DecisionInput {
  emergencyType: string;
  candidateCount: number;
  recommendedHospital: string;
  etaMinutes: number;
  etaSource: string;
  availability: string;
}

interface GeminiInteraction {
  model?: string;
  steps?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

function validDecision(value: unknown): value is DecisionInput {
  if (!value || typeof value !== "object") return false;
  const decision = value as Partial<DecisionInput>;
  return (
    typeof decision.emergencyType === "string" &&
    decision.emergencyType.length <= 30 &&
    Number.isInteger(decision.candidateCount) &&
    Number(decision.candidateCount) > 0 &&
    Number(decision.candidateCount) <= 50 &&
    typeof decision.recommendedHospital === "string" &&
    decision.recommendedHospital.length > 0 &&
    decision.recommendedHospital.length <= 120 &&
    Number.isFinite(decision.etaMinutes) &&
    Number(decision.etaMinutes) > 0 &&
    Number(decision.etaMinutes) <= 600 &&
    typeof decision.etaSource === "string" &&
    decision.etaSource.length <= 30 &&
    typeof decision.availability === "string" &&
    decision.availability.length <= 30
  );
}

export async function onRequestPost({ request, env }: PagesContext) {
  const requestOrigin = request.headers.get("Origin");
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  }

  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (contentLength > 4096) return json({ error: "Request too large." }, 413);
  if (!env.GEMINI_API_KEY) {
    return json({ error: "Free AI layer is not configured." }, 503);
  }

  let decision: unknown;
  try {
    const body = (await request.json()) as { decision?: unknown };
    decision = body.decision;
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }
  if (!validDecision(decision)) {
    return json({ error: "Invalid decision data." }, 400);
  }

  const availabilityNote =
    decision.availability === "unknown"
      ? "Availability is unknown."
      : `Availability is from a simulated demo feed and is marked ${decision.availability}.`;
  const prompt = [
    "You are QuickER's routing-decision explainer.",
    "Write one calm paragraph of at most 75 words using only the structured facts below.",
    "Explain the routing choice, but do not diagnose, recommend treatment, invent facts, confirm hospital capability, or tell the user to delay contacting emergency services.",
    "State that specialty and current capability must be confirmed.",
    `Emergency filter: ${decision.emergencyType}`,
    `Candidates compared: ${decision.candidateCount}`,
    `Recommended facility: ${decision.recommendedHospital}`,
    `Ranked ETA: ${decision.etaMinutes} minutes`,
    `ETA source: ${decision.etaSource}`,
    availabilityNote,
  ].join("\n");

  try {
    const model = env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({ model, input: prompt, store: false }),
      },
    );
    if (!response.ok) return json({ error: "AI quota unavailable." }, 503);

    const interaction = (await response.json()) as GeminiInteraction;
    const explanation = interaction.steps
      ?.flatMap((step) => (step.type === "model_output" ? step.content ?? [] : []))
      .find((content) => content.type === "text")
      ?.text?.trim();
    if (!explanation) return json({ error: "AI returned no explanation." }, 503);

    return json({
      explanation: explanation.slice(0, 800),
      model: interaction.model ?? model,
    });
  } catch {
    return json({ error: "AI service unavailable." }, 503);
  }
}
