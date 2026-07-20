import { describe, expect, it } from "vitest";
import type { DecisionRecord } from "@/services/analytics";
import { planAgentCommand } from "@/services/agentCommands";

const decision: DecisionRecord = {
  timestamp: "2026-07-20T00:00:00.000Z",
  emergencyType: "general",
  candidateCount: 6,
  recommendedHospital: "Saint George Hospital",
  etaMinutes: 8,
  etaSource: "road-network",
  availability: "accepting",
};

describe("planAgentCommand", () => {
  it("turns an explicit specialty request into an executable GPS search", () => {
    const plan = planAgentCommand("Find the fastest pediatric hospital", decision);

    expect(plan.intent).toBe("find");
    expect(plan.specialty).toBe("pediatric");
    expect(plan.searchLocation).toBe("gps");
    expect(plan.actions).toEqual([]);
    expect(plan.reply).toContain("return the best routing option here");
    expect(plan.shouldUseLocalModel).toBe(false);
  });

  it("recognizes ER searches and an explicitly labelled Beirut demo point", () => {
    const plan = planAgentCommand(
      "Find ER hospitals using the Beirut demo",
      decision,
    );

    expect(plan.intent).toBe("find");
    expect(plan.specialty).toBeNull();
    expect(plan.searchLocation).toBe("beirut-demo");
  });

  it("executes a new search when availability is part of a find request", () => {
    const plan = planAgentCommand(
      "Find an available ER hospital with the fastest ETA",
      decision,
    );

    expect(plan.intent).toBe("find");
    expect(plan.searchLocation).toBe("gps");
  });

  it("keeps symptom and treatment questions behind the medical boundary", () => {
    const plan = planAgentCommand("Diagnose this pain and tell me treatment", decision);

    expect(plan.intent).toBe("medical-boundary");
    expect(plan.reply).toContain("cannot diagnose");
    expect(plan.trace.find((step) => step.id === "safety")?.status).toBe(
      "warning",
    );
  });

  it("uses the latest decision for explanation requests", () => {
    const plan = planAgentCommand("Why was this hospital recommended?", decision);

    expect(plan.intent).toBe("explain");
    expect(plan.reply).toContain("Saint George Hospital");
    expect(plan.reply).toContain("8 minutes");
    expect(plan.shouldUseLocalModel).toBe(true);
  });

  it("asks for a search when no local decision exists", () => {
    const plan = planAgentCommand("What ETA source did you use?", undefined);

    expect(plan.reply).toContain("do not have a completed routing decision");
    expect(plan.actions[0].href).toContain("/home");
    expect(plan.shouldUseLocalModel).toBe(false);
  });
});
