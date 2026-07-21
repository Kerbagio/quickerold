import {
  assessTriage,
  DEFAULT_TRIAGE_CONTEXT,
  type TriageAnswer,
  type TriageContext,
  type TriageResult,
} from "@/services/triage";

export type AgentQuestionKey =
  | keyof TriageContext
  | "symptomDetails"
  | "onset";

export interface HealthAgentState {
  symptomNarrative: string;
  context: TriageContext;
  pendingQuestion: AgentQuestionKey | null;
  triage: TriageResult | null;
  turnCount: number;
}

export interface AgentToolStep {
  id: string;
  tool: string;
  detail: string;
  status: "complete" | "warning";
}

export interface HealthAgentPlan {
  state: HealthAgentState;
  triage: TriageResult;
  nextQuestion: {
    key: AgentQuestionKey;
    text: string;
    expectsStructuredAnswer: boolean;
  } | null;
  fallbackReply: string;
  toolSteps: AgentToolStep[];
  canPrepareHospitalSearch: boolean;
}

const questionText: Record<AgentQuestionKey, string> = {
  conscious: "Is the person conscious and responding normally?",
  breathingNormally: "Is the person breathing normally and able to speak?",
  severeBleeding: "Is there severe or uncontrolled bleeding?",
  worseningRapidly: "Are the symptoms getting worse quickly?",
  symptomDetails:
    "What is the main symptom, and who is affected: an adult, child, baby, or pregnant person?",
  onset: "When did this start, and has it changed since then?",
};

const structuredQuestionOrder: Array<keyof TriageContext> = [
  "conscious",
  "breathingNormally",
  "severeBleeding",
  "worseningRapidly",
];

const yesPattern =
  /^(yes|y|yeah|yep|correct|they are|he is|she is|i am|نعم|اي|أجل|oui|ouais)\b/i;
const noPattern =
  /^(no|n|nope|not|they are not|he is not|she is not|i am not|لا|كلا|non)\b/i;
const unknownPattern =
  /^(not sure|unsure|unknown|i don'?t know|do not know|i am not sure|مش عارف|ما بعرف|لا أعرف|je ne sais pas)\b/i;

function parseStructuredAnswer(text: string): TriageAnswer | null {
  const normalized = text.trim();
  if (unknownPattern.test(normalized)) return "unknown";
  if (noPattern.test(normalized)) return "no";
  if (yesPattern.test(normalized)) return "yes";
  return null;
}

function appendNarrative(current: string, text: string): string {
  const cleaned = text.trim().slice(0, 1200);
  if (!cleaned) return current;
  const combined = current ? `${current}\n${cleaned}` : cleaned;
  return combined.slice(-5000);
}

function getNextQuestion(
  context: TriageContext,
  triage: TriageResult,
  symptomNarrative: string,
  turnCount: number,
): AgentQuestionKey | null {
  if (triage.urgency === "emergency") return null;
  if (triage.requiresImmediateAction && triage.urgency !== "needs-more-info") {
    return null;
  }

  const missingCritical = structuredQuestionOrder.find(
    (key) => context[key] === "unknown",
  );
  if (missingCritical) return missingCritical;

  if (triage.urgency === "needs-more-info") {
    if (symptomNarrative.trim().length < 45 || turnCount <= 4) {
      return "symptomDetails";
    }
    return "onset";
  }

  return null;
}

function buildFallbackReply(triage: TriageResult): string {
  if (triage.requiresImmediateAction || triage.urgency === "emergency") {
    return `${triage.summary} ${triage.nextStep}`;
  }

  if (triage.urgency === "urgent") {
    return `${triage.summary} ${triage.nextStep}`;
  }

  return triage.summary;
}

export function createHealthAgentState(): HealthAgentState {
  return {
    symptomNarrative: "",
    context: { ...DEFAULT_TRIAGE_CONTEXT },
    pendingQuestion: null,
    triage: null,
    turnCount: 0,
  };
}

export function planHealthAgentTurn(
  userText: string,
  previousState: HealthAgentState = createHealthAgentState(),
): HealthAgentPlan {
  const cleaned = userText.trim().slice(0, 1200);
  const nextContext: TriageContext = { ...previousState.context };
  let symptomNarrative = previousState.symptomNarrative;
  const toolSteps: AgentToolStep[] = [];

  if (
    previousState.pendingQuestion &&
    structuredQuestionOrder.includes(
      previousState.pendingQuestion as keyof TriageContext,
    )
  ) {
    const answer = parseStructuredAnswer(cleaned);
    if (answer) {
      const contextKey = previousState.pendingQuestion as keyof TriageContext;
      nextContext[contextKey] = answer;
      toolSteps.push({
        id: `context-${contextKey}`,
        tool: "triage.update_context",
        detail: `Recorded ${contextKey} as ${answer}.`,
        status: "complete",
      });
    } else {
      symptomNarrative = appendNarrative(symptomNarrative, cleaned);
      toolSteps.push({
        id: `context-${previousState.pendingQuestion}`,
        tool: "triage.update_context",
        detail:
          "The reply was not a clear yes/no/not-sure answer, so it was added as symptom context instead.",
        status: "warning",
      });
    }
  } else {
    symptomNarrative = appendNarrative(symptomNarrative, cleaned);
    toolSteps.push({
      id: "context-narrative",
      tool: "triage.update_context",
      detail: "Added the latest message to temporary in-tab symptom context.",
      status: "complete",
    });
  }

  const triage = assessTriage(symptomNarrative || cleaned, nextContext);
  toolSteps.push({
    id: "assess-triage",
    tool: "triage.assess",
    detail: `Returned ${triage.urgency} urgency with ${triage.confidence} confidence.`,
    status:
      triage.confidence === "low" || triage.urgency === "needs-more-info"
        ? "warning"
        : "complete",
  });

  const turnCount = previousState.turnCount + 1;
  const nextQuestionKey = getNextQuestion(
    nextContext,
    triage,
    symptomNarrative,
    turnCount,
  );

  toolSteps.push({
    id: "select-next-action",
    tool: "triage.select_follow_up",
    detail: nextQuestionKey
      ? `Selected one focused follow-up: ${questionText[nextQuestionKey]}`
      : "No additional question is required before presenting the current action.",
    status: "complete",
  });

  const nextState: HealthAgentState = {
    symptomNarrative,
    context: nextContext,
    pendingQuestion: nextQuestionKey,
    triage,
    turnCount,
  };

  return {
    state: nextState,
    triage,
    nextQuestion: nextQuestionKey
      ? {
          key: nextQuestionKey,
          text: questionText[nextQuestionKey],
          expectsStructuredAnswer: structuredQuestionOrder.includes(
            nextQuestionKey as keyof TriageContext,
          ),
        }
      : null,
    fallbackReply: buildFallbackReply(triage),
    toolSteps,
    canPrepareHospitalSearch:
      triage.urgency !== "needs-more-info" || triage.requiresImmediateAction,
  };
}

export function isSafeGeneratedAgentReply(
  text: string,
  triage: TriageResult,
): boolean {
  const normalized = text.trim().toLowerCase();
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const unsafeClaim =
    /\b(you have|diagnos\w*|take this|take medication|stop medication|prescri\w*|cure\w*|guarantee\w*|nothing is wrong|nothing serious|no need for care|not urgent|safe to wait|green result)\b/i;

  if (normalized.length < 18 || normalized.length > 900 || wordCount > 145) {
    return false;
  }
  if (unsafeClaim.test(normalized)) return false;
  if (normalized.includes("http://") || normalized.includes("https://")) {
    return false;
  }

  if (triage.requiresImmediateAction) {
    return /\b(emergency|immediate|urgent help|contact.*emergency)\b/i.test(
      normalized,
    );
  }

  return true;
}
