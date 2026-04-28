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

type ToastTone = "info" | "success" | "warning" | "error";

type Toast = {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  durationMs?: number;
};

type ToastContextValue = {
  toasts: ReadonlyArray<Toast>;
  push: (toast: Omit<Toast, "id"> & { id?: string }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 4500;
const MAX_TOASTS = 4;
const TONE_GLYPHS: Record<ToastTone, string> = {
  info: "✦",
  success: "✓",
  warning: "!",
  error: "×"
};
const TONE_LABEL: Record<ToastTone, string> = {
  info: "Notice",
  success: "Success",
  warning: "Warning",
  error: "Error"
};

function makeId() {
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ReadonlyArray<Toast>>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (input: Omit<Toast, "id"> & { id?: string }) => {
      const id = input.id ?? makeId();
      const toast: Toast = {
        id,
        tone: input.tone,
        title: input.title,
        description: input.description,
        durationMs: input.durationMs
      };
      setToasts((current) => {
        const next = [...current.filter((t) => t.id !== id), toast];
        return next.slice(-MAX_TOASTS);
      });
      const duration = toast.durationMs ?? DEFAULT_DURATION_MS;
      if (duration > 0 && Number.isFinite(duration)) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const clear = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    setToasts([]);
  }, []);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, push, dismiss, clear }),
    [toasts, push, dismiss, clear]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>.");
  }
  return ctx;
}

function ToastViewport({
  toasts,
  dismiss
}: {
  toasts: ReadonlyArray<Toast>;
  dismiss: (id: string) => void;
}) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-stack" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.tone}`} role="status">
          <span aria-hidden="true" className="toast-glyph">
            {TONE_GLYPHS[toast.tone]}
          </span>
          <div>
            <strong>{toast.title || TONE_LABEL[toast.tone]}</strong>
            {toast.description ? <p>{toast.description}</p> : null}
          </div>
          <button
            className="toast-close"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            type="button"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
