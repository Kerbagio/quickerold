import { describe, expect, it } from "vitest";
import {
  assessTriage,
  DEFAULT_TRIAGE_CONTEXT,
  type TriageContext,
} from "@/services/triage";

function context(overrides: Partial<TriageContext>): TriageContext {
  return { ...DEFAULT_TRIAGE_CONTEXT, ...overrides };
}

describe("assessTriage", () => {
  it("never marks an ambiguous critical statement as low risk", () => {
    const result = assessTriage("I am dead.");

    expect(result.urgency).toBe("needs-more-info");
    expect(result.riskLevel).toBe("high");
    expect(result.requiresImmediateAction).toBe(true);
    expect(result.headline).toContain("Critical statement");
  });

  it("does not treat figurative device language as a medical emergency", () => {
    const result = assessTriage("My phone battery is dead.");

    expect(result.urgency).toBe("needs-more-info");
    expect(result.requiresImmediateAction).toBe(false);
  });

  it("does not trigger chest-pain rules when the symptom is explicitly denied", () => {
    const result = assessTriage("I do not have chest pain. I feel tired.");

    expect(result.urgency).not.toBe("emergency");
  });

  it("treats abnormal breathing as an emergency regardless of the typed wording", () => {
    const result = assessTriage(
      "Something feels wrong.",
      context({ breathingNormally: "no" }),
    );

    expect(result.urgency).toBe("emergency");
    expect(result.requiresImmediateAction).toBe(true);
    expect(result.matchedSignals).toContain("not breathing normally");
  });

  it("treats loss of responsiveness as an emergency", () => {
    const result = assessTriage(
      "They suddenly became ill.",
      context({ conscious: "no" }),
    );

    expect(result.urgency).toBe("emergency");
    expect(result.requiresImmediateAction).toBe(true);
  });

  it("detects combined cardiac warning signs", () => {
    const result = assessTriage(
      "I have chest pressure and shortness of breath.",
    );

    expect(result.urgency).toBe("emergency");
    expect(result.emergencyType).toBe("cardiac");
  });

  it("requires clarification for unmatched short medical text instead of returning green", () => {
    const result = assessTriage("Mild headache.");

    expect(result.urgency).toBe("needs-more-info");
    expect(result.riskLevel).toBe("unknown");
    expect(result.followUpQuestions.length).toBeGreaterThan(0);
  });
});
