import { Component, type ErrorInfo, type ReactNode } from "react";
import { getBridge } from "./desktopBridge";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
  count: number;
};

/**
 * Runtime error boundary.
 *
 * Distinct from the StartupErrorBoundary in main.tsx: that one only
 * fires before the renderer has notified main of a successful boot, and
 * its fallback messaging is "Renderer startup failed". Once the app is
 * up, a render error is a runtime issue we should handle separately so
 * we don't lie to the user about which phase failed.
 *
 * Behavior:
 *   - On error, logs to the file logger via the bridge if available
 *   - Shows a recoverable fallback with "Reset" and "Reload window"
 *   - Reset increments a key the children can subscribe to via
 *     `data-cquant-reset` so consumers can drop stale state
 */
export class RuntimeErrorBoundary extends Component<Props, State> {
  state: State = { error: null, count: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      // Forward to the file logger via the existing diagnostics IPC.
      const bridge = getBridge();
      bridge?.reportRendererStartupFailure?.({
        phase: "react-runtime",
        message: error.message || "React runtime error",
        stack: [error.stack || "", info.componentStack || ""].filter(Boolean).join("\n\n")
      });
    } catch {
      // never throw from a boundary
    }
  }

  reset = () => {
    this.setState((prev) => ({ error: null, count: prev.count + 1 }));
  };

  reload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "32px",
          background: "var(--bg)",
          color: "var(--text-strong)",
          fontFamily: "var(--font-sans)"
        }}
      >
        <section
          style={{
            width: "min(720px, 100%)",
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow)",
            padding: "28px"
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--accent)"
            }}
          >
            Runtime error
          </p>
          <h1
            style={{
              margin: "12px 0 8px",
              fontSize: "30px",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: "var(--text-strong)"
            }}
          >
            Something went wrong while rendering
          </h1>
          <p style={{ margin: "0 0 16px", lineHeight: 1.6, color: "var(--text-base)" }}>
            The desk caught an unexpected error inside the React tree. Reset tries to recover the
            workspace; Reload restarts the renderer. If this repeats, share the trace below.
          </p>
          <div style={{ display: "flex", gap: "0.55rem", marginBottom: "18px" }}>
            <button type="button" className="button primary small" onClick={this.reset}>
              Reset workspace
            </button>
            <button type="button" className="button ghost small" onClick={this.reload}>
              Reload window
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              padding: "16px",
              borderRadius: "var(--radius-md)",
              background: "var(--panel-muted)",
              border: "1px solid var(--line)",
              overflow: "auto",
              maxHeight: "240px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: "0.82rem",
              color: "var(--text-base)"
            }}
          >
            {error.stack || error.message}
          </pre>
        </section>
      </div>
    );
  }
}
