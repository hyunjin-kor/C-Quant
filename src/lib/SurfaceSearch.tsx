import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "./theme";
import { tt } from "./i18n";

/**
 * Browser-style Find-in-page overlay scoped to the workspace.
 *
 * Behavior:
 *   - Ctrl+F (or ⌘F) anywhere in the app opens the search bar.
 *   - We walk the live DOM under `.app-main` to find text matches —
 *     no global state, no per-surface opt-in. It just works against
 *     whatever React rendered.
 *   - Matches are wrapped in <mark.surface-search-hit> so CSS can
 *     restyle them. The `data-cquant-search="active"` attribute marks
 *     the currently selected hit.
 *   - Esc closes; F3 / Enter / ArrowDown go to next; Shift+variant goes
 *     to previous.
 */

const ROOT_SELECTOR = ".app-main";
const HIT_TAG = "mark";
const HIT_CLASS = "surface-search-hit";
const ACTIVE_ATTR = "data-cquant-search-active";

type Hit = HTMLElement;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

function clearHits(root: Element | null) {
  if (!root) return;
  root.querySelectorAll(`${HIT_TAG}.${HIT_CLASS}`).forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
    parent.normalize();
  });
}

function highlightMatches(root: Element, query: string): Hit[] {
  if (!query) return [];
  const lower = query.toLowerCase();
  const hits: Hit[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      // Skip script/style and our own marks (avoid recursion).
      const tag = parent.tagName;
      if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
      if (parent.classList.contains(HIT_CLASS)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || node.nodeValue.length === 0) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const targets: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    targets.push(current as Text);
    current = walker.nextNode();
  }

  for (const node of targets) {
    const text = node.nodeValue || "";
    if (!text.toLowerCase().includes(lower)) continue;

    const fragments = document.createDocumentFragment();
    let cursor = 0;
    while (cursor < text.length) {
      const matchAt = text.toLowerCase().indexOf(lower, cursor);
      if (matchAt === -1) {
        fragments.appendChild(document.createTextNode(text.slice(cursor)));
        break;
      }
      if (matchAt > cursor) {
        fragments.appendChild(document.createTextNode(text.slice(cursor, matchAt)));
      }
      const mark = document.createElement(HIT_TAG);
      mark.className = HIT_CLASS;
      mark.appendChild(document.createTextNode(text.slice(matchAt, matchAt + query.length)));
      hits.push(mark);
      fragments.appendChild(mark);
      cursor = matchAt + query.length;
    }
    node.parentNode?.replaceChild(fragments, node);
  }

  return hits;
}

function setActive(hits: Hit[], index: number) {
  hits.forEach((el, i) => {
    if (i === index) {
      el.setAttribute(ACTIVE_ATTR, "true");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      el.removeAttribute(ACTIVE_ATTR);
    }
  });
}

export function SurfaceSearch() {
  const { locale } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hitCount, setHitCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hitsRef = useRef<Hit[]>([]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    setHitCount(0);
    clearHits(document.querySelector(ROOT_SELECTOR));
    hitsRef.current = [];
  }, []);

  const refresh = useCallback((next: string) => {
    const root = document.querySelector(ROOT_SELECTOR);
    clearHits(root);
    if (!root || !next) {
      hitsRef.current = [];
      setHitCount(0);
      setActiveIndex(0);
      return;
    }
    const hits = highlightMatches(root, next);
    hitsRef.current = hits;
    setHitCount(hits.length);
    setActiveIndex(0);
    if (hits.length > 0) setActive(hits, 0);
  }, []);

  // Open on Ctrl/⌘ + F, close on Esc, navigate on Enter / Shift+Enter.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const isFind =
        (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "f";
      if (isFind && !isEditableTarget(event.target)) {
        event.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
        return;
      }
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    refresh(query);
  }, [query, open, refresh]);

  useEffect(() => {
    return () => clearHits(document.querySelector(ROOT_SELECTOR));
  }, []);

  function gotoNext(direction: 1 | -1) {
    if (hitsRef.current.length === 0) return;
    const next = (activeIndex + direction + hitsRef.current.length) % hitsRef.current.length;
    setActiveIndex(next);
    setActive(hitsRef.current, next);
  }

  if (!open) return null;

  return (
    <div className="surface-search" role="search">
      <span className="surface-search__icon" aria-hidden="true">
        ⌕
      </span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            gotoNext(event.shiftKey ? -1 : 1);
          }
        }}
        placeholder={tt(locale, "search.placeholder")}
        aria-label="Search the workspace"
      />
      <span className="surface-search__count" aria-live="polite">
        {hitCount === 0 ? "0" : `${activeIndex + 1} / ${hitCount}`}
      </span>
      <button
        type="button"
        className="surface-search__nav"
        aria-label="Previous match"
        onClick={() => gotoNext(-1)}
        disabled={hitCount === 0}
      >
        ↑
      </button>
      <button
        type="button"
        className="surface-search__nav"
        aria-label="Next match"
        onClick={() => gotoNext(1)}
        disabled={hitCount === 0}
      >
        ↓
      </button>
      <button
        type="button"
        className="surface-search__close"
        aria-label="Close search"
        onClick={close}
      >
        ×
      </button>
    </div>
  );
}
