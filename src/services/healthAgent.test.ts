import { describe, expect, it } from "vitest";
import { planHealthAgentTurn } from "@/services/healthAgent";

describe("planHealthAgentTurn", () => {
  it("responds to a greeting immediately without starting a medical assessment", () => {
    const plan = planHealthAgentTurn("Hi");

    expect(plan.intent).toBe("greeting");
    expect(plan.reply).toContain("Hi");
    expect(plan.triage).toBeNull();
    expect(plan.nextQuestion).toBeNull();
  });

  it("asks one critical question at a time and keeps conversation state", () => {
    const first = planHealthAgentTurn("I have a mild headache.");

    expect(first.nextQuestion?.key).toBe("conscious");
    expect(first.state.symptomNarrative).toContain("mild headache");
    expect(first.reply).toContain("conscious");

    const second = planHealthAgentTurn("Yes", first.state);

    expect(second.state.context.conscious).toBe("yes");
    expect(second.nextQuestion?.key).toBe("breathingNormally");
    expect(second.state.symptomNarrative).toBe(first.state.symptomNarrative);
  });

  it("treats a negative consciousness answer as an emergency", () => {
    const first = planHealthAgentTurn("Something is wrong.");
    const second = planHealthAgentTurn("No", first.state);

    expect(second.state.context.conscious).toBe("no");
    expect(second.triage?.urgency).toBe("emergency");
    expect(second.triage?.requiresImmediateAction).toBe(true);
    expect(second.nextQuestion).toBeNull();
  });

  it("understands a natural-language consciousness answer", () => {
    const first = planHealthAgentTurn("My father feels weak.");
    const second = planHealthAgentTurn("He is awake and talking", first.state);

    expect(second.state.context.conscious).toBe("yes");
    expect(second.nextQuestion?.key).toBe("breathingNormally");
  });

  it("does not misread not-sure as a negative answer", () => {
    const first = planHealthAgentTurn("I feel unwell.");
    const second = planHealthAgentTurn("I am not sure", first.state);

    expect(second.state.context.conscious).toBe("unknown");
    expect(second.nextQuestion?.key).toBe("conscious");
  });

  it("asks for critical clarification when wording is ambiguous", () => {
    const plan = planHealthAgentTurn("I am dead.");

    expect(plan.triage?.urgency).toBe("needs-more-info");
    expect(plan.triage?.riskLevel).toBe("high");
    expect(plan.triage?.requiresImmediateAction).toBe(true);
    expect(plan.nextQuestion?.key).toBe("conscious");
  });

  it("does not turn non-medical dead language into a green result", () => {
    const plan = planHealthAgentTurn("My phone battery is dead.");

    expect(plan.triage?.urgency).toBe("needs-more-info");
    expect(plan.triage?.requiresImmediateAction).toBe(false);
  });

  it("explains its function when asked for help", () => {
    const plan = planHealthAgentTurn("What can you do?");

    expect(plan.intent).toBe("help");
    expect(plan.reply).toContain("warning signs");
    expect(plan.triage).toBeNull();
  });
});
