import {
  translateAppText,
  type RuntimeLanguage,
} from "@/i18n/translateAppText";
import {
  hasRuntimeTranslation,
  translateRuntimeText,
} from "@/i18n/runtimeTranslations";

const specialtyLabels: Record<
  Exclude<RuntimeLanguage, "en">,
  Record<string, string>
> = {
  ar: {
    general: "الطوارئ العامة",
    cardiac: "القلب",
    pediatric: "الأطفال",
    maternity: "الولادة",
  },
  fr: {
    general: "urgences générales",
    cardiac: "cardiologie",
    pediatric: "pédiatrie",
    maternity: "maternité",
  },
};

const safeExtraSources = new Set([
  "You're offline. Reconnect and try again.",
  "You're offline. We'll retry when you're back.",
  "No hospitals were found nearby. Expand the radius or contact local emergency services.",
  "Hospitals were found, but no usable route could be calculated. Try again or contact local emergency services.",
  "The public hospital-data service is temporarily unavailable. Try again shortly or contact local emergency services.",
  "Hospital data could not be loaded. Please try again.",
  "Unable to rank hospitals",
  "Routing services are unavailable. Times are clearly labelled distance estimates.",
  "Live traffic compared the five fastest road candidates; remaining candidates use road-network ETAs to protect the free quota.",
  "Live traffic is unavailable or not configured; showing real road-network ETAs.",
  "Accepting (demo)",
  "Limited (demo)",
  "Diverting (demo)",
  "Availability unknown",
  "Hospital",
  "Live traffic ETA",
  "Road-network ETA",
  "Selected start location",
  "Share or select a start location first.",
  "The public route service is unavailable. You can still open this hospital in your navigation app.",
  "Route to",
  "Close route",
  "Ranked ETA",
  "Loading road path…",
  "Road distance",
  "No-traffic path ETA",
  "Route preview",
  "Open navigation",
  "QuickER is decision support, not an emergency service. Call local emergency services when needed.",
  "Verified brief ready • loading optional local AI…",
  "The closest routed-distance option is also the fastest suitable result in this comparison.",
  "availability remains unknown",
  "the simulated feed marks it accepting",
  "the simulated feed marks it limited",
  "the simulated feed marks it diverting",
  "specialty and current capability still need confirmation with the facility.",
  "The information includes one or more warning signs commonly used to identify a possible medical emergency. QuickER cannot confirm the cause or diagnosis.",
  "Contact local emergency services now. Hospital search can help with navigation, but it must not delay emergency help.",
  "QuickER cannot safely interpret this phrase as low risk. It may be figurative, or it may mean that someone is unresponsive or not breathing.",
  "If anyone is unresponsive, not breathing normally, or in immediate danger, contact local emergency services now. Otherwise, rewrite the message with the actual symptoms.",
  "The information contains features that should be assessed promptly by a qualified healthcare professional.",
  "Arrange urgent in-person care today. Contact emergency services if breathing, consciousness, bleeding, or other symptoms suddenly worsen.",
  "No emergency warning phrase was detected, but the description suggests persistent symptoms that may benefit from clinical review.",
  "Consider contacting a clinician or clinic soon, especially if symptoms persist, worsen, or affect normal activity.",
  "QuickER did not find enough reliable information to assign a low-risk result. Unmatched or unclear text is never treated as proof that the situation is safe.",
  "Answer the critical checks and describe the symptoms, timing, age group, and whether the condition is worsening. Seek professional help whenever you are concerned.",
]);

const safeExtraPatterns = [
  /^(\d+) km hospital search boundary$/,
  /^Includes approximately (\d+) min of live delay\.$/,
  /^(Cardiac|Pediatric|Maternity) match$/,
  /^(\d+) min faster than the closest option$/,
  /^(.+) has the shortest returned route distance, but (.+) has the lower current ETA\.$/,
  /^(.+) has the raw fastest ETA, but the clearly labelled availability order moves (.+) ahead\.$/,
  /^(.+) leads on both returned route distance and ETA, so QuickER does not force a different choice\.$/,
  /^QuickER moved from .+$/,
  /^QuickER recommends .+ with a ranked ETA of \d+ minutes after comparing \d+ candidates\..+$/,
  /^The raw fastest ETA belongs to .+; QuickER adds \d+ (minute|minutes) because the clearly labelled availability rule changed the order\.$/,
  /^It is \d+ minutes faster by the current ETA than the closest routed-distance option, .+\.$/,
  /^I’m concerned about the warning signs in what you described\..+$/,
  /^Based on what you’ve told me, prompt in-person assessment is recommended\..+$/,
  /^This does not match one of the app’s immediate emergency rules, but a medical review may still be appropriate\..*$/,
];

export function translateUiText(
  source: string,
  language: RuntimeLanguage,
): string {
  const normalized = source.trim();
  if (!normalized || language === "en") return normalized;

  const fallbackMatch = normalized.match(
    /^No (general|cardiac|pediatric|maternity) specialty was found in OpenStreetMap tags, so general hospitals are shown for confirmation\.$/i,
  );
  if (fallbackMatch) {
    const specialty = specialtyLabels[language][fallbackMatch[1].toLowerCase()];
    return language === "ar"
      ? `لم يتم العثور على تخصص ${specialty} في وسوم OpenStreetMap، لذلك تُعرض المستشفيات العامة للتأكيد.`
      : `Aucune spécialité de ${specialty} n’a été trouvée dans les balises OpenStreetMap ; les hôpitaux généraux sont affichés pour confirmation.`;
  }

  if (hasRuntimeTranslation(normalized)) {
    return translateRuntimeText(normalized, language);
  }

  if (
    safeExtraSources.has(normalized) ||
    safeExtraPatterns.some((pattern) => pattern.test(normalized))
  ) {
    return translateAppText(normalized, language);
  }

  return normalized;
}

export type { RuntimeLanguage };
