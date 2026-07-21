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
  label