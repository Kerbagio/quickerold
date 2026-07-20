import type { DecisionRecord } from "@/services/analytics";
import { deterministicExplanation } from "@/services/agent";
import {
  emergencyTypeLabel,
  type EmergencyType,
} from "@/services/emergency";

export type AgentIntent =
  | "find"
  | "explain"
  | "source"
  | "availability"
  | "map"
  | "privacy"
  | "medical-boundary"
  | "help";

export type AgentSearchLocation = "gps" | "beirut-demo";

export interface AgentAction {
  label: string;
  description: string;
  href: string;
}

export interface AgentTraceItem {
  id: string;
  label: string;
  detail: string;
  status: "complete" | "warning" | "running";
}

export interface AgentCommandPlan {
  intent: AgentIntent;
  specialty: EmergencyType | null;
  searchLocation: AgentSearchLocation;
  reply: string;
  actions: AgentAction[];
  shouldUseLocalModel: boolean;
  sourceLabel: string;
  trace: AgentTraceItem[];
}

const medicalRequest =
  /\b(symptoms?|diagnos\w*|medicat\w*|medicine|treat\w*|dosage|pain|bleed\w*|breath\w*|unconscious|fever|injur\w*)\b/i;

function detectSpecialty(query: string): EmergencyType | null {
  if (/\bcardiac\b/i.test(query)) return "cardiac";
  if (/\bpediatric\b|\bpaediatric\b/i.test(query)) return "pediatric";
  if (/\bmaternity\b/i.test(query)) return "maternity";
  if (/\bgeneral(?:\s+er)?\b/i.test(query)) return "general";
  return null;
}

function detectIntent(query: string, specialty: EmergencyType | null): AgentIntent {
  if (medicalRequest.test(query)) return "medical-boundary";
  if (/\bprivacy\b|\bstor(?:e|ed|age)\b|\btrack\w*\b|\bmy data\b/i.test(query)) {
    return "privacy";
  }
  if (/\bmap\b|\bheatmap\b|\bisochrone\b|\breachable\b/i.test(query)) {
    return "map";
  }
  if (/\bwhy\b|\bexplain\b|\bchosen\b|\brecommend\w*\b/i.test(query)) {
    return "explain";
  }
  if (/\bsource\b/i.test(query)) return "source";
  if (
    specialty ||
    /\bfind\b|\bfastest\b|\bnearby\b|\bhospitals?\b|\broute\b|\bsearch\b/i.test(query)
  ) {
    return "find";
  }
  if (/\bavailab\w*\b|\baccepting\b|\bdiverting\b|\bcapacity\b|\bbeds?\b/i.test(query)) {
    return "availability";
  }
  if (/\beta\b|\btraffic\b|\bdistance\b|\btravel time\b/i.test(query)) {
    return "source";
  }
  return "help";
}

function etaSourceDescription(decision: DecisionRecord): string {
  if (decision.etaSource === "live-traffic") {
    return "The latest stored ETA used the optional live-traffic source.";
  }
  if (decision.etaSource === "road-network") {
    return "The latest stored ETA used OSRM road-network travel time and does not claim live traffic.";
  }
  return "The routing service was unavailable, so the latest stored ETA used a clearly labelled distance estimate.";
}

function findActions(specialty: EmergencyType): AgentAction[] {
  const label = emergencyTypeLabel(specialty);
  return [
    {
      label: `Find ${label} options`,
      description: "Run a GPS or presentation-point hospital search.",
      href: `/home?emergencyType=${specialty}`,
    },
    {
      label: `Open ${label} map`,
      description: "Open filters and 5/10/15-minute accessibility layers.",
      href: `/options?emergencyType=${specialty}`,
    },
  ];
}

export function planAgentCommand(
  rawQuery: string,
  decision: DecisionRecord | undefined,
): AgentCommandPlan {
  const query = rawQuery.trim().slice(0, 300);
  const specialty = detectSpecialty(query);
  const intent = detectIntent(query, specialty);
  const selectedSpecialty = specialty ?? "general";
  const searchLocation = /\bbeirut\b|\bdemo(?:nstration)?\b/i.test(query)
    ? "beirut-demo"
    : "gps";
  let reply: string;
  let actions: AgentAction[] = [];
  let shouldUseLocalModel = false;
  let sourceLabel = "QuickER safety rules";

  if (intent === "medical-boundary") {
    reply =
      "I can help compare hospital routes, but I cannot diagnose symptoms, determine treatment, or decide which medical specialty you need. Choose an emergency category you already know, or start a general hospital search. If the situation is urgent, contact local emergency services now.";
    actions = findActions("general");
  } else if (intent === "find") {
    const label = emergencyTypeLabel(selectedSpecialty);
    reply =
      searchLocation === "beirut-demo"
        ? `I’ll search from the clearly labelled Beirut demo point, retrieve nearby ${label} options, calculate road ETAs, and return the best routing option here.`
        : `I’ll request your browser location, retrieve nearby ${label} options, calculate road ETAs, and return the best routing option here.`;
    sourceLabel = "Executable routing tools";
  } else if (intent === "map") {
    const label = emergencyTypeLabel(selectedSpecialty);
    reply = `Open the ${label} accessibility map to inspect nearby facilities and the 5/10/15-minute layers. The static $0 build labels estimated circles clearly when road isochrones are unavailable.`;
    actions = [findActions(selectedSpecialty)[1]];
    sourceLabel = "Map action";
  } else if (intent === "privacy") {
    reply =
      "QuickER does not intentionally store precise coordinates in decision history. The local dashboard stores only a small routing summary, while coordinates are sent to map and routing providers only when needed for a search. The optional explanation model runs in your browser.";
    actions = [
      {
        label: "Read privacy details",
        description: "Review location, local history, and provider disclosures.",
        href: "/privacy-policy",
      },
    ];
    sourceLabel = "Privacy disclosure";
  } else if (!decision) {
    reply =
      "I do not have a completed routing decision in this browser yet. Run one hospital search first; then I can explain the recommendation, ETA source, and availability rule.";
    actions = findActions(selectedSpecialty);
    sourceLabel = "No local decision yet";
  } else if (intent === "source") {
    reply = `${etaSourceDescription(decision)} ${decision.recommendedHospital} was recorded at ${decision.etaMinutes} minutes after comparing ${decision.candidateCount} candidates.`;
    shouldUseLocalModel = true;
    sourceLabel = decision.etaSource.split("-").join(" ");
  } else if (intent === "availability") {
    const availability =
      decision.availability === "unknown"
        ? "unknown"
        : `${decision.availability} in the simulated demo feed`;
    reply = `${decision.recommendedHospital} has a stored availability status of ${availability}. QuickER ranks accepting, limited, unknown, then diverting facilities before comparing ETA within each tier. This is not live hospital capacity.`;
    shouldUseLocalModel = true;
    sourceLabel = "Simulated availability";
    actions = [
      {
        label: "Open rerouting demo",
        description: "Show how a diverting status changes the recommendation.",
        href: "/dashboard",
      },
    ];
  } else if (intent === "explain") {
    reply = deterministicExplanation(decision).text;
    shouldUseLocalModel = true;
    sourceLabel = "Latest local decision";
    actions = [
      {
        label: "View routing results",
        description: "Return to the hospital ranking and route map.",
        href: "/home",
      },
    ];
  } else {
    reply =
      "Try asking me to find a cardiac, pediatric, maternity, or general hospital; explain the latest recommendation; identify the ETA source; check the availability rule; open the accessibility map; or explain location privacy.";
    sourceLabel = "Agent help";
  }

  const contextDetail =
    intent === "find"
      ? "A new routing search will run now; no previous decision is required."
      : decision
        ? `Loaded the latest local decision for ${decision.recommendedHospital}; precise coordinates are not stored.`
        : "No previous routing summary is stored in this browser.";
  const safetyWarning = intent === "medical-boundary";
  const actionDetail =
    intent === "find"
      ? "Authorized the location, hospital discovery, ETA ranking, and result verification tool chain."
      : actions.length
        ? `Prepared ${actions.length} verified navigation action${actions.length === 1 ? "" : "s"}.`
        : "Prepared a source-grounded response with no external action.";

  return {
    intent,
    specialty,
    searchLocation,
    reply,
    actions,
    shouldUseLocalModel,
    sourceLabel,
    trace: [
      {
        id: "intent",
        label: "Intent router",
        detail: `Recognized a ${intent.split("-").join(" ")} request${specialty ? ` for ${emergencyTypeLabel(specialty)}` : ""}.`,
        status: "complete",
      },
      {
        id: "safety",
        label: "Safety boundary",
        detail: safetyWarning
          ? "A medical request was detected, so diagnosis and treatment guidance were blocked."
          : "The request stays within routing, map, data-source, or privacy support.",
        status: safetyWarning ? "warning" : "complete",
      },
      {
        id: "context",
        label: "Local context",
        detail: contextDetail,
        status: decision || intent === "find" ? "complete" : "warning",
      },
      {
        id: "action",
        label: "Action planner",
        detail: actionDetail,
        status: "complete",
      },
    ],
  };
}
