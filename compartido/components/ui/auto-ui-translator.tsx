"use client";

import { useEffect, useRef } from "react";
import { useAppLanguage } from "@/hooks/use-app-language";
import {
  AUTO_UI_TRANSLATOR_SKIP_TAGS,
  translateText,
} from "@/components/ui/auto-ui-translator/translation-utils";
import { sanitizeVisibleText } from "@/lib/ui-visible-text";

export function AutoUiTranslator() {
  const { isEnglish } = useAppLanguage();
  const textOriginalRef = useRef(new WeakMap<Text, string>());
  const attrOriginalRef = useRef(new WeakMap<Element, Map<string, string>>());

  useEffect(() => {
    const ATTRIBUTE_SELECTORS = "input, textarea, button, a, select, option, [aria-label], [title]";

    const processElementAttributes = (element: Element, shouldTranslate: boolean) => {
      const attrs = ["placeholder", "aria-label", "title"];
      const cached = attrOriginalRef.current.get(element) ?? new Map<string, string>();

      attrs.forEach((attr) => {
        const value = element.getAttribute(attr);
        if (value == null) {
          return;
        }

        if (!cached.has(attr)) {
          cached.set(attr, value);
        }

        const base = sanitizeVisibleText(cached.get(attr) ?? value);
        element.setAttribute(attr, shouldTranslate ? translateText(base) : base);
      });

      if (cached.size > 0) {
        attrOriginalRef.current.set(element, cached);
      }
    };

    const processTextNode = (node: Text, shouldTranslate: boolean) => {
      const parent = node.parentElement;
      if (
        !parent ||
        AUTO_UI_TRANSLATOR_SKIP_TAGS.has(parent.tagName) ||
        parent.closest("[data-no-auto-translate='true']")
      ) {
        return;
      }

      if (!textOriginalRef.current.has(node)) {
        textOriginalRef.current.set(node, node.nodeValue ?? "");
      }

      const base = sanitizeVisibleText(textOriginalRef.current.get(node) ?? node.nodeValue ?? "");
      const next = shouldTranslate ? translateText(base) : base;

      if ((node.nodeValue ?? "") !== next) {
        node.nodeValue = next;
      }
    };

    const processSubtree = (root: Node, shouldTranslate: boolean) => {
      const textRoot = root.nodeType === Node.TEXT_NODE ? root.parentNode ?? document.body : root;
      const walker = document.createTreeWalker(textRoot, NodeFilter.SHOW_TEXT);
      let current = walker.nextNode();

      while (current) {
        processTextNode(current as Text, shouldTranslate);
        current = walker.nextNode();
      }

      if (root instanceof Element) {
        if (root.matches(ATTRIBUTE_SELECTORS)) {
          processElementAttributes(root, shouldTranslate);
        }

        root
          .querySelectorAll<HTMLElement>(ATTRIBUTE_SELECTORS)
          .forEach((element) => processElementAttributes(element, shouldTranslate));
      } else if (root === document.body || root === document.documentElement || root === document) {
        document
          .querySelectorAll<HTMLElement>(ATTRIBUTE_SELECTORS)
          .forEach((element) => processElementAttributes(element, shouldTranslate));
      }
    };

    const run = () => {
      processSubtree(document.body, isEnglish);
    };

    run();

    let rafId = 0;
    const pendingNodes = new Set<Node>();
    const queueRun = () => {
      if (rafId) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const shouldTranslate = isEnglish;
        const nodes = pendingNodes.size > 0 ? Array.from(pendingNodes) : [document.body];
        pendingNodes.clear();
        nodes.forEach((node) => processSubtree(node, shouldTranslate));
      });
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData" && mutation.target) {
          pendingNodes.add(mutation.target);
          return;
        }

        if (mutation.type === "attributes" && mutation.target) {
          pendingNodes.add(mutation.target);
        }

        mutation.addedNodes.forEach((node) => pendingNodes.add(node));
      });

      queueRun();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title"],
    });

    return () => {
      observer.disconnect();
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [isEnglish]);

  return null;
}
