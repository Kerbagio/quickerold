import {
  translateRuntimeText,
  type RuntimeLanguage,
} from "@/i18n/runtimeTranslations";

type ExtraTable = Record<string, string>;

const extraAr: ExtraTable = {
  "You're offline. Reconnect and try again.": "أنت غير متصل بالإنترنت. أعد الاتصال وحاول مجدداً.",
  "You're offline. We'll retry when you're back.": "أنت غير متصل بالإنترنت. سنعيد المحاولة عند عودة الاتصال.",
  "No hospitals were found nearby. Expand the radius or contact local emergency services.": "لم يتم العثور على مستشفيات قريبة. وسّع نطاق البحث أو اتصل بخدمات الطوارئ المحلية.",
  "Hospitals were found, but no usable route could be calculated. Try again or contact local emergency services.": "تم العثور على مستشفيات، لكن تعذر حساب مسار صالح. حاول مجدداً أو اتصل بخدمات الطوارئ المحلية.",
  "The public hospital-data service is temporarily unavailable. Try again shortly or contact local emergency services.": "خدمة بيانات المستشفيات العامة غير متاحة مؤقتاً. حاول بعد قليل أو اتصل بخدمات الطوارئ المحلية.",
  "Hospital data could not be loaded. Please try again.": "تعذر تحميل بيانات المستشفيات. يرجى المحاولة مجدداً.",
  "Unable to rank hospitals": "تعذر ترتيب المستشفيات",
  "Routing services are unavailable. Times are clearly labelled distance estimates.": "خدمات التوجيه غير متاحة. الأوقات المعروضة موسومة بوضوح كتقديرات للمسافة.",
  "Live traffic compared the five fastest road candidates; remaining candidates use road-network ETAs to protect the free quota.": "قارنت حركة المرور المباشرة أسرع خمسة خيارات على الطريق؛ وتستخدم الخيارات المتبقية أوقات شبكة الطرق للحفاظ على الحصة المجانية.",
  "Live traffic is unavailable or not configured; showing real road-network ETAs.": "حركة المرور المباشرة غير متاحة أو غير مهيأة؛ يتم عرض أوقات حقيقية مبنية على شبكة الطرق.",
  "Accepting (demo)": "يستقبل الحالات (تجريبي)",
  "Limited (demo)": "قدرة محدودة (تجريبي)",
  "Diverting (demo)": "تحويل الحالات (تجريبي)",
  "Availability unknown": "حالة التوفر غير معروفة",
  "Hospital": "مستشفى",
  "Live traffic ETA": "وقت وصول بحركة مرور مباشرة",
  "Road-network ETA": "وقت وصول بحسب شبكة الطرق",
  "Selected start location": "موقع البداية المحدد",
  "Share or select a start location first.": "شارك موقعاً أو اختر موقع بداية أولاً.",
  "The public route service is unavailable. You can still open this hospital in your navigation app.": "خدمة المسارات العامة غير متاحة. لا يزال بإمكانك فتح هذا المستشفى في تطبيق الملاحة.",
  "Route to": "المسار إلى",
  "Close route": "إغلاق المسار",
  "Ranked ETA": "وقت الوصول المرتب",
  "Loading road path…": "جارٍ تحميل مسار الطريق…",
  "Road distance": "مسافة الطريق",
  "No-traffic path ETA": "وقت المسار من دون حركة مرور",
  "Route preview": "معاينة المسار",
  "Open navigation": "فتح الملاحة",
  "QuickER is decision support, not an emergency service. Call local emergency services when needed.": "QuickER أداة لدعم القرار وليس خدمة طوارئ. اتصل بخدمات الطوارئ المحلية عند الحاجة.",
  "Verified brief ready • loading optional local AI…": "الملخص المتحقق منه جاهز • جارٍ تحميل الذكاء الاصطناعي المحلي الاختياري…",
  "The closest routed-distance option is also the fastest suitable result in this comparison.": "الخيار الأقرب بحسب مسافة الطريق هو أيضاً أسرع نتيجة مناسبة في هذه المقارنة.",
  "availability remains unknown": "تبقى حالة التوفر غير معروفة",
  "the simulated feed marks it accepting": "يشير المصدر التجريبي إلى أنه يستقبل الحالات",
  "the simulated feed marks it limited": "يشير المصدر التجريبي إلى أن قدرته محدودة",
  "the simulated feed marks it diverting": "يشير المصدر التجريبي إلى أنه يحوّل الحالات",
  "specialty and current capability still need confirmation with the facility.": "لا يزال التخصص والقدرة الحالية بحاجة إلى تأكيد من المنشأة.",
  "The information includes one or more warning signs commonly used to identify a possible medical emergency. QuickER cannot confirm the cause or diagnosis.": "تتضمن المعلومات علامة خطر واحدة أو أكثر تُستخدم عادةً للتعرف إلى طارئ طبي محتمل. لا يمكن لـ QuickER تأكيد السبب أو التشخيص.",
  "Contact local emergency services now. Hospital search can help with navigation, but it must not delay emergency help.": "اتصل بخدمات الطوارئ المحلية الآن. قد يساعد البحث عن مستشفى في الملاحة، لكنه يجب ألا يؤخر طلب المساعدة الطارئة.",
  "QuickER cannot safely interpret this phrase as low risk. It may be figurative, or it may mean that someone is unresponsive or not breathing.": "لا يمكن لـ QuickER تفسير هذه العبارة بأمان على أنها منخفضة الخطورة. قد تكون مجازية، أو قد تعني أن شخصاً لا يستجيب أو لا يتنفس.",
  "If anyone is unresponsive, not breathing normally, or in immediate danger, contact local emergency services now. Otherwise, rewrite the message with the actual symptoms.": "إذا كان أي شخص لا يستجيب أو لا يتنفس بشكل طبيعي أو في خطر فوري، فاتصل بخدمات الطوارئ المحلية الآن. وإلا فأعد كتابة الرسالة مع الأعراض الفعلية.",
  "The information contains features that should be assessed promptly by a qualified healthcare professional.": "تتضمن المعلومات مؤشرات ينبغي تقييمها سريعاً من قبل مختص صحي مؤهل.",
  "Arrange urgent in-person care today. Contact emergency services if breathing, consciousness, bleeding, or other symptoms suddenly worsen.": "رتّب رعاية حضورية عاجلة اليوم. اتصل بخدمات الطوارئ إذا ساء التنفس أو الوعي أو النزيف أو أي أعراض أخرى فجأة.",
  "No emergency warning phrase was detected, but the description suggests persistent symptoms that may benefit from clinical review.": "لم يتم اكتشاف عبارة إنذار طارئة، لكن الوصف يشير إلى أعراض مستمرة قد تستفيد من مراجعة سريرية.",
  "Consider contacting a clinician or clinic soon, especially if symptoms persist, worsen, or affect normal activity.": "فكّر في التواصل مع طبيب أو عيادة قريباً، خصوصاً إذا استمرت الأعراض أو ساءت أو أثرت في النشاط الطبيعي.",
  "QuickER did not find enough reliable information to assign a low-risk result. Unmatched or unclear text is never treated as proof that the situation is safe.": "لم يجد QuickER معلومات موثوقة كافية لتصنيف الحالة منخفضة الخطورة. لا يُعتبر النص غير المطابق أو غير الواضح دليلاً على أن الحالة آمنة.",
  "Answer the critical checks and describe the symptoms, timing, age group, and whether the condition is worsening. Seek professional help whenever you are concerned.": "أجب عن فحوصات السلامة الأساسية وصف الأعراض وتوقيتها والفئة العمرية وما إذا كانت الحالة تتفاقم. اطلب مساعدة مختصة كلما شعرت بالقلق.",
  "QuickER moved from": "انتقل QuickER من",
  "The new choice is": "الخيار الجديد",
  "minute": "دقيقة",
  "minutes": "دقائق",
  "longer": "أطول",
  "faster": "أسرع",
  "by the current ETA, with the availability trade-off shown instead of hidden.": "بحسب وقت الوصول الحالي، مع إظهار مفاضلة التوفر بدلاً من إخفائها.",
  "becomes diverting": "يبدأ بتحويل الحالات",
  "updated": "تم التحديث",
  "Hospital search boundary": "حدود البحث عن المستشفيات",
  "Includes approximately": "يتضمن تقريباً",
  "min of live delay.": "دقيقة من التأخير المباشر.",
  "No matching specialty was found in OpenStreetMap tags, so general hospitals are shown for confirmation.": "لم يتم العثور على تخصص مطابق في وسوم OpenStreetMap، لذلك تُعرض المستشفيات العامة للتأكيد.",
};

const extraFr: ExtraTable = {
  "You're offline. Reconnect and try again.": "Vous êtes hors ligne. Reconnectez-vous et réessayez.",
  "You're offline. We'll retry when you're back.": "Vous êtes hors ligne. Nous réessaierons au retour de la connexion.",
  "No hospitals were found nearby. Expand the radius or contact local emergency services.": "Aucun hôpital n’a été trouvé à proximité. Augmentez le rayon ou contactez les services d’urgence locaux.",
  "Hospitals were found, but no usable route could be calculated. Try again or contact local emergency services.": "Des hôpitaux ont été trouvés, mais aucun itinéraire utilisable n’a pu être calculé. Réessayez ou contactez les services d’urgence locaux.",
  "The public hospital-data service is temporarily unavailable. Try again shortly or contact local emergency services.": "Le service public de données hospitalières est temporairement indisponible. Réessayez dans quelques instants ou contactez les services d’urgence locaux.",
  "Hospital data could not be loaded. Please try again.": "Les données hospitalières n’ont pas pu être chargées. Veuillez réessayer.",
  "Unable to rank hospitals": "Impossible de classer les hôpitaux",
  "Routing services are unavailable. Times are clearly labelled distance estimates.": "Les services d’itinéraire sont indisponibles. Les temps affichés sont clairement indiqués comme des estimations par distance.",
  "Live traffic compared the five fastest road candidates; remaining candidates use road-network ETAs to protect the free quota.": "Le trafic en direct a comparé les cinq candidats routiers les plus rapides ; les autres utilisent les temps du réseau routier afin de préserver le quota gratuit.",
  "Live traffic is unavailable or not configured; showing real road-network ETAs.": "Le trafic en direct est indisponible ou non configuré ; affichage des temps réels du réseau routier.",
  "Accepting (demo)": "Accepte les patients (démo)",
  "Limited (demo)": "Capacité limitée (démo)",
  "Diverting (demo)": "Redirection (démo)",
  "Availability unknown": "Disponibilité inconnue",
  "Hospital": "Hôpital",
  "Live traffic ETA": "Temps d’arrivée avec trafic en direct",
  "Road-network ETA": "Temps d’arrivée selon le réseau routier",
  "Selected start location": "Point de départ sélectionné",
  "Share or select a start location first.": "Partagez ou sélectionnez d’abord un point de départ.",
  "The public route service is unavailable. You can still open this hospital in your navigation app.": "Le service public d’itinéraire est indisponible. Vous pouvez toujours ouvrir cet hôpital dans votre application de navigation.",
  "Route to": "Itinéraire vers",
  "Close route": "Fermer l’itinéraire",
  "Ranked ETA": "Temps d’arrivée classé",
  "Loading road path…": "Chargement du trajet routier…",
  "Road distance": "Distance routière",
  "No-traffic path ETA": "Temps du trajet sans trafic",
  "Route preview": "Aperçu de l’itinéraire",
  "Open navigation": "Ouvrir la navigation",
  "QuickER is decision support, not an emergency service. Call local emergency services when needed.": "QuickER est un outil d’aide à la décision, pas un service d’urgence. Appelez les services d’urgence locaux si nécessaire.",
  "Verified brief ready • loading optional local AI…": "Résumé vérifié prêt • chargement de l’IA locale facultative…",
  "The closest routed-distance option is also the fastest suitable result in this comparison.": "L’option la plus proche selon la distance routière est également le résultat adapté le plus rapide de cette comparaison.",
  "availability remains unknown": "la disponibilité reste inconnue",
  "the simulated feed marks it accepting": "le flux simulé indique qu’il accepte les patients",
  "the simulated feed marks it limited": "le flux simulé indique une capacité limitée",
  "the simulated feed marks it diverting": "le flux simulé indique une redirection des patients",
  "specialty and current capability still need confirmation with the facility.": "la spécialité et la capacité actuelle doivent encore être confirmées auprès de l’établissement.",
  "The information includes one or more warning signs commonly used to identify a possible medical emergency. QuickER cannot confirm the cause or diagnosis.": "Les informations comprennent un ou plusieurs signes d’alerte couramment utilisés pour identifier une urgence médicale possible. QuickER ne peut pas confirmer la cause ni le diagnostic.",
  "Contact local emergency services now. Hospital search can help with navigation, but it must not delay emergency help.": "Contactez les services d’urgence locaux maintenant. La recherche d’hôpital peut aider à la navigation, mais ne doit pas retarder l’aide d’urgence.",
  "QuickER cannot safely interpret this phrase as low risk. It may be figurative, or it may mean that someone is unresponsive or not breathing.": "QuickER ne peut pas considérer cette phrase comme présentant un faible risque. Elle peut être figurative ou signifier qu’une personne ne répond pas ou ne respire pas.",
  "If anyone is unresponsive, not breathing normally, or in immediate danger, contact local emergency services now. Otherwise, rewrite the message with the actual symptoms.": "Si une personne ne répond pas, ne respire pas normalement ou se trouve en danger immédiat, contactez les services d’urgence locaux maintenant. Sinon, reformulez le message avec les symptômes réels.",
  "The information contains features that should be assessed promptly by a qualified healthcare professional.": "Les informations comportent des éléments qui doivent être évalués rapidement par un professionnel de santé qualifié.",
  "Arrange urgent in-person care today. Contact emergency services if breathing, consciousness, bleeding, or other symptoms suddenly worsen.": "Organisez aujourd’hui une prise en charge urgente en personne. Contactez les services d’urgence si la respiration, la conscience, le saignement ou d’autres symptômes s’aggravent soudainement.",
  "No emergency warning phrase was detected, but the description suggests persistent symptoms that may benefit from clinical review.": "Aucune phrase d’alerte urgente n’a été détectée, mais la description suggère des symptômes persistants pouvant nécessiter un avis clinique.",
  "Consider contacting a clinician or clinic soon, especially if symptoms persist, worsen, or affect normal activity.": "Envisagez de contacter prochainement un professionnel de santé ou une clinique, surtout si les symptômes persistent, s’aggravent ou affectent les activités normales.",
  "QuickER did not find enough reliable information to assign a low-risk result. Unmatched or unclear text is never treated as proof that the situation is safe.": "QuickER n’a pas trouvé suffisamment d’informations fiables pour attribuer un faible niveau de risque. Un texte imprécis ou non reconnu n’est jamais considéré comme une preuve que la situation est sûre.",
  "Answer the critical checks and describe the symptoms, timing, age group, and whether the condition is worsening. Seek professional help whenever you are concerned.": "Répondez aux contrôles essentiels et décrivez les symptômes, leur début, le groupe d’âge et leur évolution. Demandez l’aide d’un professionnel dès que vous êtes inquiet.",
  "QuickER moved from": "QuickER est passé de",
  "The new choice is": "Le nouveau choix est",
  "minute": "minute",
  "minutes": "minutes",
  "longer": "plus long",
  "faster": "plus rapide",
  "by the current ETA, with the availability trade-off shown instead of hidden.": "selon le temps d’arrivée actuel, avec le compromis de disponibilité affiché au lieu d’être masqué.",
  "becomes diverting": "commence à rediriger les patients",
  "updated": "mis à jour",
  "Hospital search boundary": "limite de recherche des hôpitaux",
  "Includes approximately": "Comprend environ",
  "min of live delay.": "min de retard lié au trafic.",
  "No matching specialty was found in OpenStreetMap tags, so general hospitals are shown for confirmation.": "Aucune spécialité correspondante n’a été trouvée dans les balises OpenStreetMap ; les hôpitaux généraux sont donc affichés pour confirmation.",
};

const extraTables: Record<Exclude<RuntimeLanguage, "en">, ExtraTable> = {
  ar: extraAr,
  fr: extraFr,
};

interface ExtraPattern {
  pattern: RegExp;
  ar: (match: RegExpMatchArray) => string;
  fr: (match: RegExpMatchArray) => string;
}

const extraPatterns: ExtraPattern[] = [
  {
    pattern: /^(\d+) km hospital search boundary$/,
    ar: (match) => `حدود البحث عن المستشفيات ضمن ${match[1]} كم`,
    fr: (match) => `limite de recherche des hôpitaux à ${match[1]} km`,
  },
  {
    pattern: /^Includes approximately (\d+) min of live delay\.$/,
    ar: (match) => `يتضمن تقريباً ${match[1]} دقيقة من التأخير المباشر.`,
    fr: (match) => `Comprend environ ${match[1]} min de retard lié au trafic.`,
  },
  {
    pattern: /^(Cardiac|Pediatric|Maternity) match$/,
    ar: (match) => `مطابقة ${translateAppText(match[1], "ar")}`,
    fr: (match) => `Correspondance ${translateAppText(match[1], "fr")}`,
  },
  {
    pattern: /^(\d+) min faster than the closest option$/,
    ar: (match) => `أسرع بـ ${match[1]} دقيقة من الخيار الأقرب`,
    fr: (match) => `${match[1]} min plus rapide que l’option la plus proche`,
  },
  {
    pattern: /^(.+) has the shortest returned route distance, but (.+) has the lower current ETA\.$/,
    ar: (match) => `${match[1]} لديه أقصر مسافة مسار معادة، لكن ${match[2]} لديه وقت وصول حالي أقل.`,
    fr: (match) => `${match[1]} présente la distance routière la plus courte, mais ${match[2]} a un temps d’arrivée actuel inférieur.`,
  },
  {
    pattern: /^(.+) has the raw fastest ETA, but the clearly labelled availability order moves (.+) ahead\.$/,
    ar: (match) => `${match[1]} لديه أسرع وقت وصول خام، لكن ترتيب التوفر المعلّم بوضوح يقدّم ${match[2]}.`,
    fr: (match) => `${match[1]} a le temps d’arrivée brut le plus rapide, mais l’ordre de disponibilité clairement indiqué place ${match[2]} devant.`,
  },
  {
    pattern: /^(.+) leads on both returned route distance and ETA, so QuickER does not force a different choice\.$/,
    ar: (match) => `${match[1]} يتصدر في مسافة المسار ووقت الوصول، لذلك لا يفرض QuickER خياراً مختلفاً.`,
    fr: (match) => `${match[1]} est en tête pour la distance routière et le temps d’arrivée ; QuickER n’impose donc pas un autre choix.`,
  },
  {
    pattern: /^No (.+) specialty was found in OpenStreetMap tags, so general hospitals are shown for confirmation\.$/,
    ar: (match) => `لم يتم العثور على تخصص ${translateAppText(match[1], "ar")} في وسوم OpenStreetMap، لذلك تُعرض المستشفيات العامة للتأكيد.`,
    fr: (match) => `Aucune spécialité ${translateAppText(match[1], "fr")} n’a été trouvée dans les balises OpenStreetMap ; les hôpitaux généraux sont affichés pour confirmation.`,
  },
];

const replacementKeys = Array.from(
  new Set([...Object.keys(extraAr), ...Object.keys(extraFr)]),
).sort((first, second) => second.length - first.length);

export function translateAppText(
  source: string,
  language: RuntimeLanguage,
): string {
  const normalized = source.trim();
  if (!normalized || language === "en") return normalized;

  const exact = extraTables[language][normalized];
  if (exact) return exact;

  for (const translator of extraPatterns) {
    translator.pattern.lastIndex = 0;
    const match = normalized.match(translator.pattern);
    if (match) return translator[language](match);
  }

  let translated = translateRuntimeText(normalized, language);
  for (const key of replacementKeys) {
    if (!translated.includes(key)) continue;
    const replacement = extraTables[language][key];
    if (replacement) translated = translated.split(key).join(replacement);
  }
  return translated;
}

export type { RuntimeLanguage };
