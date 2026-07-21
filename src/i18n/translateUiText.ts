import {
  translateAppText,
  type RuntimeLanguage,
} from "@/i18n/translateAppText";

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

  return translateAppText(normalized, language);
}

export type { RuntimeLanguage };
