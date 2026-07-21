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

export type HealthAgentIntent = "greeting" | "help" | "thanks" | "triage";

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
  triage: TriageResult | null;
  intent: HealthAgentIntent;
  nextQuestion: {
    key: AgentQuestionKey;
    text: string;
    expectsStructuredAnswer: boolean;
  } | null;
  reply: string;
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

const greetingPattern =
  /^(hi|hello|hey|good morning|good afternoon|good evening|مرحبا|مرحباً|اهلا|أهلا|bonjour|salut)[!. ]*$/i;
const thanksPattern =
  /^(thanks|thank you|thx|شكرا|شكراً|merci|okay thanks|ok thanks)[!. ]*$/i;
const helpPattern =
  /^(help|what can you do|how does this work|شو بتعمل|ماذا تفعل|aide|comment ça marche)[?.! ]*$/i;
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

function inferAnswerFromNaturalLanguage(
  key: keyof TriageContext,
  text: string,
): TriageAnswer | null {
  const normalized = text.trim().toLowerCase();
  const direct = parseStructuredAnswer(normalized);
  if (direct) return direct;

  if (key === "conscious") {
    if (/\b(unconscious|unresponsive|not responding|cannot wake|can't wake|passed out)\b/i.test(normalized)) return "no";
    if (/\b(awake|alert|responding|talking|speaking|walking)\b/i.test(normalized)) return "yes";
  }

  if (key === "breathingNormally") {
    if (/\b(not breathing|gasping|choking|struggling to breathe|can't breathe|cannot breathe)\b/i.test(normalized)) return "no";
    if (/\b(breathing normally|breathing fine|can breathe|speaking normally|talking normally)\b/i.test(normalized)) return "yes";
  }

  if (key === "severeBleeding") {
    if (/\b(no bleeding|not bleeding|bleeding stopped)\b/i.test(normalized)) return "no";
    if (/\b(heavy bleeding|severe bleeding|won't stop bleeding|uncontrolled bleeding)\b/i.test(normalized)) return "yes";
  }

  if (key === "worseningRapidly") {
    if (/\b(getting worse|worsening|rapidly worse|much worse)\b/i.test(normalized)) return "yes";
    if (/\b(not getting worse|stable|same as before|not worsening)\b/i.test(normalized)) return "no";
  }

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
    if (symptomNarrative.trim().length < 55 || turnCount <= 4) {
      return "symptomDetails";
    }
    return "onset";
  }

  return null;
}

function detectedSignalText(triage: TriageResult): string {
  const signals = triage.matchedSignals.slice(0, 2);
  if (!signals.length) return "";
  return ` I noticed ${signals.join(" and ")}.`;
}

function composeReply(
  triage: TriageResult,
  nextQuestion: AgentQuestionKey | null,
  turnCount: number,
): string {
  const question = nextQuestion ? questionText[nextQuestion] : "";
  const signalText = detectedSignalText(triage);

  if (triage.urgency === "emergency") {
    return `I’m concerned about the warning signs in what you described.${signalText} ${triage.nextStep}`;
  }

  if (triage.requiresImmediateAction) {
    return `I can’t safely treat that message as low risk. If someone is unresponsive, not breathing normally, or in immediate danger, contact local emergency services now.${question ? ` ${question}` : ""}`;
  }

  if (triage.urgency === "urgent") {
    return `Based on what you’ve told me, prompt in-person assessment is recommended.${signalText} ${triage.nextStep}${question ? ` ${question}` : ""}`;
  }

  if (triage.urgency === "soon") {
    return `This does not match one of the app’s immediate emergency rules, but a medical review may still be appropriate.${signalText}${question ? ` ${question}` : ""}`;
  }

  const openings = [
    "I need a little more information before I can judge the urgency safely.",
    "Thanks — I don’t have enough reliable detail yet to classify this safely.",
    "I’m not going to guess from an unclear description.",
  ];
  const opening = openings[turnCount % openings.length];
  return `${opening}${question ? ` ${question}` : " Please describe the main symptom and when it started."}`;
}

function conversationalPlan(
  previousState: HealthAgentState,
  intent: Exclude<HealthAgentIntent, "triage">,
  reply: string,
): HealthAgentPlan {
  const nextState: HealthAgentState = {
    ...previousState,
    context: { ...previousState.context },
    turnCount: previousState.turnCount + 1,
  };
  const pending = previousState.pendingQuestion;

  return {
    state: nextState,
    triage: previousState.triage,
    intent,
    nextQuestion: pending
      ? {
          key: pending,
          text: questionText[pending],
          expectsStructuredAnswer: structuredQuestionOrder.includes(
            pending as keyof TriageContext,
          ),
        }
      : null,
    reply,
    toolSteps: [
      {
        id: `conversation-${intent}`,
        tool: "conversation.respond",
        detail: `Handled a ${intent} message without starting a medical assessment.`,
        status: "complete",
      },
    ],
    canPrepareHospitalSearch: Boolean(
      previousState.triage &&
        (previousState.triage.urgency !== "needs-more-info" ||
          previousState.triage.requiresImmediateAction),
    ),
  };
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

  if (greetingPattern.test(cleaned)) {
    const followUp = previousState.pendingQuestion
      ? ` We can continue where we stopped: ${questionText[previousState.pendingQuestion]}`
      : " Tell me who needs help, the main symptom, and when it started.";
    return conversationalPlan(
      previousState,
      "greeting",
      `Hi — I’m here to help you work out how urgently care may be needed.${followUp}`,
    );
  }

  if (thanksPattern.test(cleaned)) {
    return conversationalPlan(
      previousState,
      "thanks",
      previousState.pendingQuestion
        ? `You’re welcome. To continue the assessment: ${questionText[previousState.pendingQuestion]}`
        : "You’re welcome. Describe any new symptoms whenever you need to start another assessment.",
    );
  }

  if (helpPattern.test(cleaned)) {
    return conversationalPlan(
      previousState,
      "help",
      "Describe what is happening in your own words. I will check immediate warning signs, ask one focused question at a time, and prepare the appropriate hospital filter. I do not diagnose or recommend treatment.",
    );
  }

  const nextContext: TriageContext = { ...previousState.context };
  let symptomNarrative = previousState.symptomNarrative;
  const toolSteps: AgentToolStep[] = [];

  if (
    previousState.pendingQuestion &&
    structuredQuestionOrder.includes(
      previousState.pendingQuestion as keyof TriageContext,
    )
  ) {
    const contextKey = previousState.pendingQuestion as keyof TriageContext;
    const answer = inferAnswerFromNaturalLanguage(contextKey, cleaned);
    if (answer) {
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
        id: `context-${contextKey}`,
        tool: "triage.update_context",
        detail:
          "The reply was not clear enough to answer the current safety check, so it was kept as symptom context.",
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
    intent: "triage",
    nextQuestion: nextQuestionKey
      ? {
          key: nextQuestionKey,
          text: questionText[nextQuestionKey],
          expectsStructuredAnswer: structuredQuestionOrder.includes(
            nextQuestionKey as keyof TriageContext,
          ),
        }
      : null,
    reply: composeReply(triage, nextQuestionKey, turnCount),
    toolSteps,
    canPrepareHospitalSearch:
      triage.urgency !== "needs-more-info" || triage.requiresImmediateAction,
  };
}
