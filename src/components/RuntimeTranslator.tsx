import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  translateUiText,
  type RuntimeLanguage,
} from "@/i18n/translateUiText";

const translatedAttributes = ["placeholder", "title", "aria-label", "alt"] as const;
const skippedTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"]);

const localizedMetadata: Record<
  RuntimeLanguage,
  {
    title: string;
    description: string;
    socialTitle: string;
    socialDescription: string;
  }
> = {
  en: {
    title: "QuickER - Get to the right hospital, faster",
    description:
      "Compare nearby hospitals by suitable emergency care and fastest available road ETA, with every source clearly labelled.",
    socialTitle: "QuickER - Get to the right hospital, faster",
    socialDescription:
      "Compare nearby hospitals by suitability and fastest available road ETA.",
  },
  ar: {
    title: "QuickER - الوصول إلى المستشفى المناسب بشكل أسرع",
    description:
      "قارن المستشفيات القريبة بحسب الرعاية الطارئة المناسبة وأسرع وقت وصول متاح عبر الطرق، مع توضيح مصدر كل نتيجة.",
    socialTitle: "QuickER - الوصول إلى المستشفى المناسب بشكل أسرع",
    socialDescription:
      "قارن المستشفيات القريبة بحسب الملاءمة وأسرع وقت وصول متاح عبر الطرق.",
  },
  fr: {
    title: "QuickER - Rejoignez plus vite l’hôpital adapté",
    description:
      "Comparez les hôpitaux proches selon les soins d’urgence adaptés et le temps de trajet routier disponible le plus rapide, avec chaque source clairement indiquée.",
    socialTitle: "QuickER - Rejoignez plus vite l’hôpital adapté",
    socialDescription:
      "Comparez les hôpitaux proches selon leur adéquation et le temps de trajet routier disponible le plus rapide.",
  },
};

function preserveOuterWhitespace(current: string, translated: string): string {
  const start = current.match(/^\s*/)?.[0] ?? "";
  const end = current.match(/\s*$/)?.[0] ?? "";
  return `${start}${translated}${end}`;
}

function canTranslate(source: string): boolean {
  const normalized = source.trim();
  if (!normalized) return false;
  return (
    translateUiText(normalized, "ar") !== normalized ||
    translateUiText(normalized, "fr") !== normalized
  );
}

function shouldSkipElement(element: Element | null): boolean {
  if (!element) return true;
  if (skippedTags.has(element.tagName)) return true;
  if (element.closest('[data-no-runtime-translate="true"]')) return true;
  if (element.closest('[contenteditable="true"]')) return true;
  return false;
}

function updateMetadata(language: RuntimeLanguage): void {
  const metadata = localizedMetadata[language];
  document.documentElement.lang = language;
  document.title = metadata.title;

  const description = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  );
  const ogTitle = document.querySelector<HTMLMetaElement>(
    'meta[property="og:title"]',
  );
  const ogDescription = document.querySelector<HTMLMetaElement>(
    'meta[property="og:description"]',
  );

  description?.setAttribute("content", metadata.description);
  ogTitle?.setAttribute("content", metadata.socialTitle);
  ogDescription?.setAttribute("content", metadata.socialDescription);
}

const RuntimeTranslator = () => {
  const { language } = useLanguage();
  const textSources = useRef(new WeakMap<Text, string>());
  const attributeSources = useRef(
    new WeakMap<Element, Map<(typeof translatedAttributes)[number], string>>(),
  );

  useEffect(() => {
    const activeLanguage = language as RuntimeLanguage;
    updateMetadata(activeLanguage);

    const translateTextNode = (node: Text) => {
      const parent = node.parentElement;
      if (shouldSkipElement(parent)) return;

      const current = node.nodeValue ?? "";
      const normalized = current.trim();
      if (!normalized) return;

      let source = textSources.current.get(node);
      if (!source) {
        if (!canTranslate(normalized)) return;
        source = normalized;
        textSources.current.set(node, source);
      } else {
        const expected = translateUiText(source, activeLanguage);
        if (normalized !== expected && canTranslate(normalized)) {
          source = normalized;
          textSources.current.set(node, source);
        }
      }

      const translated = translateUiText(source, activeLanguage);
      const nextValue = preserveOuterWhitespace(current, translated);
      if (nextValue !== current) node.nodeValue = nextValue;
    };

    const translateAttributes = (element: Element) => {
      if (shouldSkipElement(element)) return;

      let sources = attributeSources.current.get(element);
      if (!sources) {
        sources = new Map();
        attributeSources.current.set(element, sources);
      }

      translatedAttributes.forEach((attribute) => {
        const current = element.getAttribute(attribute);
        if (!current?.trim()) return;

        let source = sources?.get(attribute);
        if (!source) {
          if (!canTranslate(current)) return;
          source = current.trim();
          sources?.set(attribute, source);
        } else {
          const expected = translateUiText(source, activeLanguage);
          if (current.trim() !== expected && canTranslate(current)) {
            source = current.trim();
            sources?.set(attribute, source);
          }
        }

        const translated = translateUiText(source, activeLanguage);
        if (translated !== current) element.setAttribute(attribute, translated);
      });
    };

    const translateTree = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root as Text);
        return;
      }

      if (root.nodeType !== Node.ELEMENT_NODE && root !== document.body) return;
      if (root instanceof Element) translateAttributes(root);

      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      );
      let current = walker.nextNode();
      while (current) {
        if (current.nodeType === Node.TEXT_NODE) {
          translateTextNode(current as Text);
        } else if (current instanceof Element) {
          translateAttributes(current);
        }
        current = walker.nextNode();
      }
    };

    translateTree(document.body);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          translateTextNode(mutation.target as Text);
          return;
        }

        if (mutation.type === "attributes" && mutation.target instanceof Element) {
          translateAttributes(mutation.target);
          return;
        }

        mutation.addedNodes.forEach(translateTree);
      });
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...translatedAttributes],
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
};

export default RuntimeTranslator;
