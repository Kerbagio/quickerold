import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  translateRuntimeText,
  type RuntimeLanguage,
} from "@/i18n/runtimeTranslations";

const translatedAttributes = ["placeholder", "title", "aria-label", "alt"] as const;
const skippedTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"]);

function preserveOuterWhitespace(current: string, translated: string): string {
  const start = current.match(/^\s*/)?.[0] ?? "";
  const end = current.match(/\s*$/)?.[0] ?? "";
  return `${start}${translated}${end}`;
}

function canTranslate(source: string): boolean {
  const normalized = source.trim();
  if (!normalized) return false;
  return (
    translateRuntimeText(normalized, "ar") !== normalized ||
    translateRuntimeText(normalized, "fr") !== normalized
  );
}

function shouldSkipElement(element: Element | null): boolean {
  if (!element) return true;
  if (skippedTags.has(element.tagName)) return true;
  if (element.closest('[data-no-runtime-translate="true"]')) return true;
  if (element.closest('[contenteditable="true"]')) return true;
  return false;
}

const RuntimeTranslator = () => {
  const { language } = useLanguage();
  const textSources = useRef(new WeakMap<Text, string>());
  const attributeSources = useRef(
    new WeakMap<Element, Map<(typeof translatedAttributes)[number], string>>(),
  );

  useEffect(() => {
    const activeLanguage = language as RuntimeLanguage;

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
        const expected = translateRuntimeText(source, activeLanguage);
        if (normalized !== expected && canTranslate(normalized)) {
          source = normalized;
          textSources.current.set(node, source);
        }
      }

      const translated = translateRuntimeText(source, activeLanguage);
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
          const expected = translateRuntimeText(source, activeLanguage);
          if (current.trim() !== expected && canTranslate(current)) {
            source = current.trim();
            sources?.set(attribute, source);
          }
        }

        const translated = translateRuntimeText(source, activeLanguage);
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
