import { describe, expect, it } from "vitest";
import {
  isSafeGeneratedAgentReply,
  planHealthAgentTurn,
} from "@/services/healthAgent";


describe("planHealthAgentTurn", () => {
  it("asks one critical question at a time and keeps conversation state", () => {
    const first = planHealthAgentTurn("I have a mild headache.");

    expect(first.nextQuestion?.key).toBe("conscious");
    expect(first.state.symptomNarrative).toContain("mild headache");

    const second = planHealthAgentTurn("Yes", first.state);

    expect(second.state.context.conscious).toBe("yes");
    expect(second.nextQuestion?.key).toBe("breathingNormally");
    expect(second.state.symptomNarrative).toBe(first.state.symptomNarrative);
  });

  it("treats a negative consciousness answer as an emergency tool result", () => {
    const first = planHealthAgentTurn("Something is wrong.");
    const second = planHealthAgentTurn("No", first.state);

    expect(second.state.context.conscious).toBe("no");
    expect(second.triage.urgency).toBe("emergency");
    expect(second.triage.requiresImmediateAction).toBe(true);
    expect(second.nextQuestion).toBeNull();
  });

  it("does not misread not-sure as a negative answer", () => {
    const first = planHealthAgentTurn("I feel unwell.");
    const second = planHealthAgentTurn("I am not sure", first.state);

    expect(second.state.context.conscious).toBe("unknown");
    expect(second.nextQuestion?.key).toBe("conscious");
  });

  it("asks for critical clarification when the wording is ambiguous", () => {
    const plan = planHealthAgentTurn("I am dead.");

    expect(plan.triage.urgency).toBe("needs-more-info");
    expect(plan.triage.requiresImmediateAction).toBe(true);
    expect(plan.nextQuestion?.key).toBe("conscious");
    expect(plan.canPrepareHospitalSearch).toBe(true);
  });

  it("does not turn non-medical dead language into a green result", () => {
    const plan = planHealthAgentTurn("My phone battery is dead.");

    expect(plan.triage.urgency).toBe("needs-more-info");
    expect(plan.triage.requiresImmediateAction).toBe(false);
    expect(plan.nextQuestion?.key).toBe("conscious");
  });
});

describe("isSafeGeneratedAgentReply", () => {
  it("rejects a model reply that downgrades care", () => {
    const plan = planHealthAgentTurn("I have a mild headache.");

    expect(
      isSafeGeneratedAgentReply(
        "Nothing serious is happening and there is no need for care.",
        plan.triage,
      ),
    ).toBe(false);
  });

  it("accepts an emergency response that preserves the tool instruction", () => {
    const plan = planHealthAgentTurn(
      "My father has chest pressure and is struggling to breathe.",
    );

    expect(
      isSafeGeneratedAgentReply(
        "These warning signs may represent an emergency. Contact local emergency services immediately and do not wait for this app.",
        plan.triage,
      ),
    ).toBe(true);
  });
});
