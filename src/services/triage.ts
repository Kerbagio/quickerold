import type { EmergencyType } from "@/services/emergency";

export type TriageUrgency =
  | "emergency"
  | "urgent"
  | "soon"
  | "needs-more-info";
export type TriageAnswer = "yes" | "no" | "unknown";

export interface TriageContext {
  conscious: TriageAnswer;
  breathingNormally: TriageAnswer;
  severeBleeding: TriageAnswer;
  worseningRapidly: TriageAnswer;
}

export interface TriageResult {
  urgency: TriageUrgency;
  severity: "high" | "moderate" | "low" | "unknown";
  riskLevel: "high" | "moderate" | "low" | "unknown";
  confidence: "high" | "moderate" | "low";
  emergencyType: EmergencyType;
  radiusKm: number;
  headline: string;
  summary: string;
  matchedSignals: string[];
  followUpQuestions: string[];
  nextStep: string;
  requiresImmediateAction: boolean;
}

interface Rule {
  label: string;
  pattern: RegExp;
  urgency: Exclude<TriageUrgency, "needs-more-info">;
  emergencyType?: EmergencyType;
  ignoreNegation?: boolean;
}

export const DEFAULT_TRIAGE_CONTEXT: TriageContext = {
  conscious: "unknown",
  breathingNormally: "unknown",
  severeBleeding: "unknown",
  worseningRapidly: "unknown",
};

const emergencyRules: Rule[] = [
  {
    label: "not breathing or gasping",
    pattern:
      /\b(not breathing|stopped breathing|can'?t breathe|cannot breathe|gasping|choking|unable to speak because.*breath)\b/i,
    urgency: "emergency",
    emergencyType: "general",
    ignoreNegation: true,
  },
  {
    label: "severe breathing difficulty",
    pattern:
      /\b(severe difficulty breathing|struggling to breathe|difficulty breathing|shortness of breath|blue lips|bluish lips)\b/i,
    urgency: "emergency",
    emergencyType: "general",
  },
  {
    label: "chest pain or pressure",
    pattern:
      /\b(chest pain|chest pressure|chest feels (tight|heavy)|tightness in (my |the )?chest|pain.*(arm|jaw|neck))\b/i,
    urgency: "emergency",
    emergencyType: "cardiac",
  },
  {
    label: "possible stroke warning sign",
    pattern:
      /\b(face droop|facial droop|one[- ]sided weakness|slurred speech|sudden confusion|cannot speak|unable to speak|sudden vision loss)\b/i,
    urgency: "emergency",
    emergencyType: "general",
  },
  {
    label: "unconscious or unresponsive",
    pattern:
      /\b(unconscious|unresponsive|not responding|collapsed|passed out and not waking|fainted and not waking)\b/i,
    urgency: "emergency",
    emergencyType: "general",
  },
  {
    label: "seizure",
    pattern:
      /\b(seizure (won'?t stop|not stopping)|continuous seizure|convulsion|fitting and not waking)\b/i,
    urgency: "emergency",
    emergencyType: "general",
  },
  {
    label: "severe bleeding",
    pattern:
      /\b(heavy bleeding|severe bleeding|bleeding won'?t stop|uncontrolled bleeding|blood is pouring|blood is spraying)\b/i,
    urgency: "emergency",
    emergencyType: "general",
  },
  {
    label: "severe allergic reaction",
    pattern:
      /\b(swollen (tongue|face|throat)|face swelling|tongue swelling|anaphylaxis|severe allergic reaction)\b/i,
    urgency: "emergency",
    emergencyType: "general",
  },
  {
    label: "poisoning or overdose concern",
    pattern: /\b(poisoning|poisoned|overdose|took too much medicine)\b/i,
    urgency: "emergency",
    emergencyType: "general",
  },
  {
    label: "major injury or burn",
    pattern:
      /\b(serious head injury|major trauma|hit by a car|car crash|severe burn|burned all over|fell from (a )?height)\b/i,
    urgency: "emergency",
    emergencyType: "general",
  },
  {
    label: "vomiting or coughing blood",
    pattern: /\b(vomiting blood|throwing up blood|coughing up blood)\b/i,
    urgency: "emergency",
    emergencyType: "general",
  },
  {
    label: "pregnancy emergency warning sign",
    pattern:
      /\b(pregnant|pregnancy)\b.*\b(heavy bleeding|severe pain|fainting|seizure|water broke|not moving)\b/i,
    urgency: "emergency",
    emergencyType: "maternity",
  },
];

const urgentRules: Rule[] = [
  {
    label: "infant or child concern",
    pattern: /\b(baby|infant|newborn|child|toddler)\b/i,
    urgency: "urgent",
    emergencyType: "pediatric",
  },
  {
    label: "persistent high fever",
    pattern:
      /\b(high fever|fever.*(three|3|four|4|five|5) days|temperature.*(39|40))\b/i,
    urgency: "urgent",
    emergencyType: "general",
  },
  {
    label: "worsening or severe pain",
    pattern:
      /\b(severe pain|worst pain|pain.*getting worse|unbearable pain|sudden severe pain)\b/i,
    urgency: "urgent",
    emergencyType: "general",
  },
  {
    label: "dehydration concern",
    pattern:
      /\b(can'?t keep fluids down|cannot keep fluids down|not urinating|very dehydrated|persistent vomiting|vomiting all day)\b/i,
    urgency: "urgent",
    emergencyType: "general",
  },
  {
    label: "pregnancy-related concern",
    pattern: /\b(pregnant|pregnancy|contractions|labor|labour)\b/i,
    urgency: "urgent",
    emergencyType: "maternity",
  },
];

const soonRules: Rule[] = [
  {
    label: "symptoms lasting several days",
    pattern:
      /\b(for|since)\s+(three|3|four|4|five|5|six|6|seven|7)\s+days?\b/i,
    urgency: "soon",
    emergencyType: "general",
  },
  {
    label: "persistent symptoms",
    pattern:
      /\b(not getting better|keeps coming back|persistent cough|persistent headache|ongoing pain)\b/i,
    urgency: "soon",
    emergencyType: "general",
  },
];

const ambiguityPattern =
  /\b(i am dead|i'?m dead|dying|going to die|about to die|someone is dead|he is dead|she is dead|they are dead)\b/i;
const figurativePattern =
  /\b(dead tired|dead serious|dead battery|phone is dead|battery is dead|laptop is dead|computer is dead|wifi is dead|internet is dead|app is dead|project is dead|bored to death|laughed to death|drop dead gorgeous)\b/i;
const medicalVocabularyPattern =
  /\b(pain|fever|bleeding|breath|breathing|vomit|dizzy|faint|weak|swelling|rash|injury|pregnant|pregnancy|seizure|cough|headache|stomach|chest|heart|symptom|blood|temperature|unconscious|unresponsive)\b/i;

function isNegated(text: string, matchIndex: number): boolean {
  const before = text.slice(Math.max(0, matchIndex - 42), matchIndex);
  return /\b(no|not|without|denies|denied|never had|doesn'?t have|do not have|don'?t have)\b[^.!?]{0,24}$/i.test(
    before,
  );
}

function matchesRule(text: string, rule: Rule): boolean {
  const match = rule.pattern.exec(text);
  if (!match) return false;
  return rule.ignoreNegation || !isNegated(text, match.index);
}

function uniqueLabels(rules: Rule[]): string[] {
  return [...new Set(rules.map((rule) => rule.label))].slice(0, 6);
}

function selectEmergencyType(rules: Rule[]): EmergencyType {
  return (
    rules.find((rule) => rule.emergencyType === "cardiac")?.emergencyType ??
    rules.find((rule) => rule.emergencyType === "maternity")?.emergencyType ??
    rules.find((rule) => rule.emergencyType === "pediatric")?.emergencyType ??
    rules[0]?.emergencyType ??
    "general"
  );
}

function missingCriticalQuestions(context: TriageContext): string[] {
  const questions: string[] = [];
  if (context.conscious === "unknown") {
    questions.push("Is the person conscious and responding normally?");
  }
  if (context.breathingNormally === "unknown") {
    questions.push("Is the person breathing normally and able to speak?");
  }
  if (context.severeBleeding === "unknown") {
    questions.push("Is there severe or uncontrolled bleeding?");
  }
  if (context.worseningRapidly === "unknown") {
    questions.push("Are the symptoms getting worse quickly?");
  }
  return questions;
}

export function assessTriage(
  input: string,
  context: TriageContext = DEFAULT_TRIAGE_CONTEXT,
): TriageResult {
  const text = input.trim().slice(0, 5000);

  const criticalContextSignals: string[] = [];
  if (context.conscious === "no") {
    criticalContextSignals.push("not conscious or not responding normally");
  }
  if (context.breathingNormally === "no") {
    criticalContextSignals.push("not breathing normally");
  }
  if (context.severeBleeding === "yes") {
    criticalContextSignals.push("severe or uncontrolled bleeding");
  }

  const emergencyMatches = emergencyRules.filter((rule) =>
    matchesRule(text, rule),
  );
  const urgentMatches = urgentRules.filter((rule) => matchesRule(text, rule));
  const soonMatches = soonRules.filter((rule) => matchesRule(text, rule));
  const ambiguousCriticalStatement =
    ambiguityPattern.test(text) && !figurativePattern.test(text);

  if (criticalContextSignals.length || emergencyMatches.length) {
    const allSignals = [
      ...criticalContextSignals,
      ...uniqueLabels(emergencyMatches),
    ];
    return {
      urgency: "emergency",
      severity: "high",
      riskLevel: "high",
      confidence: criticalContextSignals.length ? "high" : "moderate",
      emergencyType: selectEmergencyType(emergencyMatches),
      radiusKm: 15,
      headline: "Emergency warning signs detected",
      summary:
        "The information includes one or more warning signs commonly used to identify a possible medical emergency. QuickER cannot confirm the cause or diagnosis.",
      matchedSignals: allSignals.slice(0, 6),
      followUpQuestions: [],
      nextStep:
        "Contact local emergency services now. Hospital search can help with navigation, but it must not delay emergency help.",
      requiresImmediateAction: true,
    };
  }

  if (ambiguousCriticalStatement) {
    return {
      urgency: "needs-more-info",
      severity: "unknown",
      riskLevel: "high",
      confidence: "low",
      emergencyType: "general",
      radiusKm: 15,
      headline: "Critical statement needs immediate clarification",
      summary:
        "QuickER cannot safely interpret this phrase as low risk. It may be figurative, or it may mean that someone is unresponsive or not breathing.",
      matchedSignals: ["possible critical-status statement"],
      followUpQuestions: [
        "Do you mean that someone is unresponsive or not breathing?",
        ...missingCriticalQuestions(context).slice(0, 2),
      ],
      nextStep:
        "If anyone is unresponsive, not breathing normally, or in immediate danger, contact local emergency services now. Otherwise, rewrite the message with the actual symptoms.",
      requiresImmediateAction: true,
    };
  }

  if (context.worseningRapidly === "yes" || urgentMatches.length) {
    const matchedSignals = uniqueLabels(urgentMatches);
    if (context.worseningRapidly === "yes") {
      matchedSignals.unshift("symptoms worsening quickly");
    }
    return {
      urgency: "urgent",
      severity: "moderate",
      riskLevel: "moderate",
      confidence: urgentMatches.length ? "moderate" : "low",
      emergencyType: selectEmergencyType(urgentMatches),
      radiusKm: 12,
      headline: "Prompt medical assessment recommended",
      summary:
        "The information contains features that should be assessed promptly by a qualified healthcare professional.",
      matchedSignals: matchedSignals.slice(0, 6),
      followUpQuestions: missingCriticalQuestions(context).slice(0, 3),
      nextStep:
        "Arrange urgent in-person care today. Contact emergency services if breathing, consciousness, bleeding, or other symptoms suddenly worsen.",
      requiresImmediateAction: false,
    };
  }

  if (soonMatches.length) {
    return {
      urgency: "soon",
      severity: "low",
      riskLevel: "moderate",
      confidence: "moderate",
      emergencyType: selectEmergencyType(soonMatches),
      radiusKm: 8,
      headline: "Medical review may be appropriate",
      summary:
        "No emergency warning phrase was detected, but the description suggests persistent symptoms that may benefit from clinical review.",
      matchedSignals: uniqueLabels(soonMatches),
      followUpQuestions: missingCriticalQuestions(context).slice(0, 3),
      nextStep:
        "Consider contacting a clinician or clinic soon, especially if symptoms persist, worsen, or affect normal activity.",
      requiresImmediateAction: false,
    };
  }

  const followUpQuestions = missingCriticalQuestions(context);
  if (!medicalVocabularyPattern.test(text)) {
    followUpQuestions.unshift(
      "What symptoms or medical problem are you asking about?",
    );
  } else {
    followUpQuestions.unshift(
      "When did the symptoms start, and are they getting worse?",
    );
  }

  return {
    urgency: "needs-more-info",
    severity: "unknown",
    riskLevel: "unknown",
    confidence: "low",
    emergencyType: "general",
    radiusKm: 8,
    headline: "More information is required",
    summary:
      "QuickER did not find enough reliable information to assign a low-risk result. Unmatched or unclear text is never treated as proof that the situation is safe.",
    matchedSignals: [],
    followUpQuestions: [...new Set(followUpQuestions)].slice(0, 4),
    nextStep:
      "Answer the critical checks and describe the symptoms, timing, age group, and whether the condition is worsening. Seek professional help whenever you are concerned.",
    requiresImmediateAction: false,
  };
}
