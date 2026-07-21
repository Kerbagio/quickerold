import {
  isSafeGeneratedAgentReply,
  type AgentToolStep,
  type HealthAgentPlan,
} from "@/services/healthAgent";

export interface AgentConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentModelProgress {
  label: string;
  percent?: number;
}

export interface AgentGeneratedReply {
  text: string;
  mode: "on-device-ai" | "safety-fallback";
  model?: string;
  error?: string;
}

interface PendingRequest {
  plan: HealthAgentPlan;
  resolve: (value: AgentGeneratedReply) => void;
  onProgress?: (progress: AgentModelProgress) => void;
  timeoutId: number;
}

interface WorkerProgressMessage {
  type: "progress";
  label: string;
  percent?: number;
}

interface WorkerCompleteMessage {
  type: "complete";
  requestId: string;
  text: string;
  model: string;
}

interface WorkerErrorMessage {
  type: "error";
  requestId: string;
  message?: string;
}

type WorkerResponse =
  | WorkerProgressMessage
  | WorkerCompleteMessage
  | WorkerErrorMessage;

let worker: Worker | null = null;
const pending = new Map<string, PendingRequest>();
let latestRequestId: string | null = null;

function fallbackReply(
  plan: HealthAgentPlan,
  error?: string,
): AgentGeneratedReply {
  return {
    text: plan.fallbackReply,
    mode: "safety-fallback",
    error,
  };
}

function settleRequest(
  requestId: string,
  reply: AgentGeneratedReply,
): void {
  const request = pending.get(requestId);
  if (!request) return;
  window.clearTimeout(request.timeoutId);
  pending.delete(requestId);
  request.resolve(reply);
}

function failAllPending(message: string): void {
  pending.forEach((request, requestId) => {
    window.clearTimeout(request.timeoutId);
    request.resolve(fallbackReply(request.plan, message));
    pending.delete(requestId);
  });
  worker?.terminate();
  worker = null;
  latestRequestId = null;
}

function getWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(
    new URL("../workers/healthAgent.worker.ts", import.meta.url),
    { type: "module" },
  );

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const data = event.data;

    if (data.type === "progress") {
      const active = latestRequestId ? pending.get(latestRequestId) : undefined;
      active?.onProgress?.({ label: data.label, percent: data.percent });
      return;
    }

    if (data.type === "error") {
      const request = pending.get(data.requestId);
      if (!request) return;
      settleRequest(
        data.requestId,
        fallbackReply(request.plan, data.message ?? "The local model failed."),
      );
      return;
    }

    const request = pending.get(data.requestId);
    if (!request) return;
    const valid = isSafeGeneratedAgentReply(data.text, request.plan.triage);
    settleRequest(
      data.requestId,
      valid
        ? {
            text: data.text.trim(),
            mode: "on-device-ai",
            model: data.model,
          }
        : fallbackReply(
            request.plan,
            "The generated response failed the safety validator.",
          ),
    );
  };

  worker.onerror = () => {
    failAllPending("The private model worker could not start.");
  };

  return worker;
}

function toolSummary(steps: AgentToolStep[]): string[] {
  return steps.map((step) => `${step.tool}: ${step.detail}`);
}

export function generateHealthAgentReply(
  conversation: AgentConversationMessage[],
  plan: HealthAgentPlan,
  onProgress?: (progress: AgentModelProgress) => void,
): Promise<AgentGeneratedReply> {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  latestRequestId = requestId;

  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      settleRequest(
        requestId,
        fallbackReply(plan, "The local model took too long to respond."),
      );
    }, 360_000);

    pending.set(requestId, {
      plan,
      resolve,
      onProgress,
      timeoutId,
    });

    try {
      getWorker().postMessage({
        requestId,
        conversation: conversation.slice(-10),
        triage: plan.triage,
        nextQuestion: plan.nextQuestion?.text ?? null,
        toolSummary: toolSummary(plan.toolSteps),
      });
    } catch (error) {
      settleRequest(
        requestId,
        fallbackReply(
          plan,
          error instanceof Error
            ? error.message
            : "The local model could not be started.",
        ),
      );
    }
  });
}
