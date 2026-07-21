import type { EmergencyType } from "@/services/emergency";

export type TriageUrgency = "emergency" | "urgent" | "soon" | "self-care";

export interface TriageResult {
  urgency: TriageUrgency;
  severity: "high" | "moderate" | "low";
  riskLevel: "high" | "moderate" | "low";
  emergencyType: EmergencyType;
  radiusKm: number;
  headline: string;
  summary: string;
  matchedSignals: string[];
  nextStep: string;
}

interface Rule {
  label: string;
  pattern: RegExp;
  urgency: TriageUrgency;
  emergencyType?: EmergencyType;
}

const rules: Rule[] = [
  {
    label: "difficulty breathing",
    pattern: /\b(can'?t breathe|cannot breathe|difficulty breathing|shortness of breath|choking)\b/i,
    urgency: "emergency",
    emergencyType: "general",
  },
  {
    label: "chest pain or pressure",
    pattern: /\b(chest pain|chest pressure|tightness in (my |the )?chest)\b/i,
    urgency: "emergency",
    emergencyType: "cardiac",
  },
  {
    label: "possible stroke warning sign",
    pattern: /\b(face droop|facial droop|one[- ]sided weakness|slurred speech|sudden confusion|cannot speak)\b/i,
    urgency: "emergency",
    emergencyType: "general",
  },
  {
    label: "loss of consciousness or seizure",
    pattern: /\b(unconscious|passed out|fainted and not waking|seizure|convulsion)\b/i,
    urgency: "emergency",
    emergencyType: "general",
  },
  {
    label: "severe bleeding",
    pattern: /\b(heavy bleeding|severe bleeding|bleeding won'?t stop|uncontrolled bleeding)\b/i,
    urgency: "emergency",
    emergencyType: "general",
  },
  {
    label: "pregnancy emergency warning sign",
    pattern: /\b(pregnant|pregnancy)\b.*\b(heavy bleeding|severe pain|fainting|seizure|water broke)\b/i,
    urgency: "emergency",
    emergencyType: "maternity",
  },
  {
    label: "infant or child concern",
    pattern: /\b(baby|infant|newborn|child|toddler)\b/i,
    urgency: "urgent",
    emergencyType: "pediatric",
  },
  {
    label: "persistent high fever",
    pattern: /\b(high fever|fever.*(three|3|four|4|five|5) days|temperature.*(39|40))\b/i,
    urgency: "urgent",
    emergencyType: "general",
  },
  {
    label: "worsening severe pain",
    pattern: /\b(severe pain|worst pain|pain.*getting worse|unbearable pain)\b/i,
    urgency: "urgent",
    emergencyType: "general",
  },
  {
    label: "dehydration concern",
    pattern: /\b(can'?t keep fluids down|cannot keep fluids down|not urinating|very dehydrated|persistent vomiting)\b/i,
    urgency: "urgent",
    emergencyType: "general",
  },
  {
    label: "pregnancy-related concern",
    pattern: /\b(pregnant|pregnancy|contractions|labor|labour)\b/i,
    urgency: "urgent",
    emergencyType: "maternity",
  },
  {
    label: "symptoms lasting several days",
    pattern: /\b(for|since)\s+(three|3|four|4|five|5|six|6|seven|7)\s+days?\b/i,
    urgency: "soon",
    emergencyType: "general",
  },
];

const urgencyRank: Record<TriageUrgency, number> = {
  "self-care": 0,
  soon: 1,
  urgent: 2,
  emergency: 3,
};

export function assessTriage(input: string): TriageResult {
  const text = input.trim().slice(0, 5000);
  const matches = rules.filter((rule) => rule.pattern.test(text));
  const strongest = matches.reduce<Rule | null>((current, rule) => {
    if (!current || urgencyRank[rule.urgency] > urgencyRank[current.urgency]) {
      return rule;
    }
    return current;
  }, null);

  const urgency = strongest?.urgency ?? (text.length > 80 ? "soon" : "self-care");
  const emergencyType =
    matches.find((rule) => rule.emergencyType === "cardiac")?.emergencyType ??
    matches.find((rule) => rule.emergencyType === "maternity")?.emergencyType ??
    matches.find((rule) => rule.emergencyType === "pediatric")?.emergencyType ??
    strongest?.emergencyType ??
    "general";

  const matchedSignals = [...new Set(matches.map((rule) => rule.label))].slice(0, 5);

  if (urgency === "emergency") {
    return {
      urgency,
      severity: "high",
      riskLevel: "high",
      emergencyType,
      radiusKm: 15,
      headline: "Emergency warning signs detected",
      summary:
        "The description includes warning signs that may require immediate in-person assessment. This tool cannot confirm a diagnosis.",
      matchedSignals,
      nextStep:
        "Call local emergency services now or go to the nearest appropriate emergency department. Do not rely on this app if immediate help is available.",
    };
  }

  if (urgency === "urgent") {
    return {
      urgency,
      severity: "moderate",
      riskLevel: "moderate",
      emergencyType,
      radiusKm: 12,
      headline: "Prompt medical assessment recommended",
      summary:
        "The description contains features that should be assessed promptly by a qualified healthcare professional.",
      matchedSignals,
      nextStep:
        "Arrange urgent in-person care today. If symptoms suddenly worsen or new emergency warning signs appear, contact emergency services.",
    };
  }

  if (urgency === "soon") {
    return {
      urgency,
      severity: "low",
      riskLevel: "moderate",
      emergencyType,
      radiusKm: 8,
      headline: "Medical review may be appropriate",
      summary:
        "No clear emergency phrase was detected, but the information is detailed or suggests symptoms may be persisting.",
      matchedSignals,
      nextStep:
        "Consider contacting a clinician or clinic soon, especially if symptoms persist, worsen, or affect normal activity.",
    };
  }

  return {
    urgency,
    severity: "low",
    riskLevel: "low",
    emergencyType,
    radiusKm: 5,
    headline: "No clear emergency phrase detected",
    summary:
      "The short description did not match the app’s limited emergency rules. That does not prove the situation is safe or rule out a serious condition.",
    matchedSignals,
    nextStep:
      "Add more detail about symptoms, timing, age group, pregnancy status, and whether the condition is worsening. Seek professional care whenever you are concerned.",
  };
}
