import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

export type Command = {
  id: string;
  title: string;
  group?: string;
  keywords?: string;
  shortcut?: string;
  run: () => void | Promise<void>;
};

type CommandPaletteContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  register: (commands: ReadonlyArray<Command>) => () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

function isMacLike() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/i.test(navigator.platform || "");
}

function isPaletteHotkey(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== "k") return false;
  return event.metaKey || event.ctrlKey;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [commands, setCommands] = useState<ReadonlyArray<Command>>([]);
  const counterRef = useRef(0);

  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  const register = useCallback((toAdd: ReadonlyArray<Command>) => {
    const ids = toAdd.map((c) => c.id);
    counterRef.current += 1;
    setCommands((current) => {
      const merged = [...current.filter((c) => !ids.includes(c.id)), ...toAdd];
      return merged;
    });
    return () => {
      setCommands((current) => current.filter((c) => !ids.includes(c.id)));
    };
  }, []);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (isPaletteHotkey(event)) {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({ isOpen, open, close, register }),
    [isOpen, open, close, register]
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {isOpen ? <CommandPaletteOverlay commands={commands} onClose={close} /> : null}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>.");
  }
  return ctx;
}

/**
 * Convenience hook for registering a static set of commands tied to the
 * lifetime of the calling component.
 */
export function useRegisterCommands(commands: ReadonlyArray<Command>) {
  const { register } = useCommandPalette();
  useEffect(() => register(commands), [register, commands]);
}

function fuzzyScore(haystack: string, needle: string): number {
  if (!needle) return 1;
  const normalizedHay = haystack.toLowerCase();
  const normalizedNeedle = needle.toLowerCase();
  if (normalizedHay.includes(normalizedNeedle)) {
    // exact substring beats subsequence
    return 0.7 + Math.min(0.3, normalizedNeedle.length / normalizedHay.length);
  }
  let hayIdx = 0;
  let matches = 0;
  for (const char of normalizedNeedle) {
    const found = normalizedHay.indexOf(char, hayIdx);
    if (found === -1) return 0;
    matches += 1;
    hayIdx = found + 1;
  }
  return matches / Math.max(normalizedHay.length, 1);
}

function CommandPaletteOverlay({
  commands,
  onClose
}: {
  commands: ReadonlyArray<Command>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const macLike = isMacLike();

  const ranked = useMemo(() => {
    const filtered = commands
      .map((command) => ({
        command,
        score: Math.max(
          fuzzyScore(command.title, query),
          fuzzyScore(command.group ?? "", query) * 0.5,
          fuzzyScore(command.keywords ?? "", query) * 0.6
        )
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.command);
    return filtered;
  }, [commands, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const command of ranked) {
      const group = command.group ?? "Actions";
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(command);
    }
    return Array.from(map.entries());
  }, [ranked]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runActive = useCallback(async () => {
    const command = ranked[activeIndex];
    if (!command) return;
    onClose();
    await command.run();
  }, [ranked, activeIndex, onClose]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => Math.min(ranked.length - 1, i + 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        void runActive();
      }
    },
    [ranked.length, runActive]
  );

  return (
    <div
      className="cmdk-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={onKeyDown}
    >
      <div className="cmdk-panel">
        <div className="cmdk-search">
          <span className="cmdk-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Command search"
          />
          <span className="cmdk-shortcut" aria-hidden="true">
            <kbd>esc</kbd>
          </span>
        </div>
        {ranked.length === 0 ? (
          <div className="cmdk-empty">No commands match "{query}"</div>
        ) : (
          <ul className="cmdk-list" ref={listRef}>
            {grouped.map(([group, items]) => (
              <li key={group} aria-label={group}>
                <div className="cmdk-group">{group}</div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {items.map((command) => {
                    const overallIndex = ranked.indexOf(command);
                    return (
                      <li key={command.id}>
                        <button
                          type="button"
                          className="cmdk-item"
                          data-active={overallIndex === activeIndex}
                          onMouseEnter={() => setActiveIndex(overallIndex)}
                          onClick={async () => {
                            onClose();
                            await command.run();
                          }}
                        >
                          <span>{command.title}</span>
                          {command.shortcut ? (
                            <span className="cmdk-item-meta">{command.shortcut}</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
        <div className="cmdk-footer">
          <span className="cmdk-shortcut">
            <kbd>↑</kbd>
            <kbd>↓</kbd> to navigate
          </span>
          <span className="cmdk-shortcut">
            <kbd>↵</kbd> to run · <kbd>{macLike ? "⌘" : "Ctrl"}</kbd> <kbd>K</kbd> to toggle
          </span>
        </div>
      </div>
    </div>
  );
}
