import React, { Component, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/pretendard/400.css";
import "@fontsource/pretendard/500.css";
import "@fontsource/pretendard/600.css";
import "@fontsource/pretendard/700.css";
import "@fontsource/pretendard/800.css";
import "@fontsource-variable/inter/index.css";
import App from "./App";
import { ThemeProvider } from "./lib/theme";
import { ToastProvider } from "./lib/toast";
import { CommandPaletteProvider } from "./lib/commandPalette";
import { AppShellExtensions } from "./lib/AppShellExtensions";
import { RuntimeErrorBoundary } from "./lib/RuntimeErrorBoundary";
import "./styles.css";
import "./styles.claude.css";
import "./styles.shell.css";

type RendererStartupFailurePayload = {
  phase: string;
  message: string;
  stack?: string;
};

type DesktopBridgeDiagnostics = {
  notifyRendererReady?: () => void;
  reportRendererStartupFailure?: (payload: RendererStartupFailurePayload) => void;
};

type StartupErrorBoundaryProps = {
  children: React.ReactNode;
};

type StartupErrorBoundaryState = {
  error: Error | null;
};

let rendererReadyNotified = false;
let startupFailureReported = false;

function getDesktopBridge() {
  return (window as typeof window & { desktopBridge?: DesktopBridgeDiagnostics }).desktopBridge;
}

function describeUnknownError(reason: unknown) {
  if (reason instanceof Error) {
    return {
      message: reason.message || "Unknown renderer error.",
      stack: reason.stack || ""
    };
  }

  if (typeof reason === "string") {
    return {
      message: reason,
      stack: ""
    };
  }

  try {
    return {
      message: JSON.stringify(reason),
      stack: ""
    };
  } catch {
    return {
      message: String(reason),
      stack: ""
    };
  }
}

function reportRendererStartupFailure(payload: RendererStartupFailurePayload) {
  if (startupFailureReported) {
    return;
  }

  startupFailureReported = true;

  try {
    getDesktopBridge()?.reportRendererStartupFailure?.(payload);
  } catch {}
}

function notifyRendererReady() {
  if (rendererReadyNotified) {
    return;
  }

  rendererReadyNotified = true;

  try {
    getDesktopBridge()?.notifyRendererReady?.();
  } catch {}
}

class StartupErrorBoundary extends Component<StartupErrorBoundaryProps, StartupErrorBoundaryState> {
  constructor(props: StartupErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportRendererStartupFailure({
      phase: "react-render",
      message: error.message || "React render failed during startup.",
      stack: [error.stack || "", info.componentStack || ""].filter(Boolean).join("\n\n")
    });
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "32px",
          background: "#ffffff",
          color: "#191f28",
          fontFamily: '"Pretendard", "Inter", "Segoe UI", "Noto Sans KR", system-ui, sans-serif'
        }}
      >
        <section
          role="alert"
          style={{
            width: "min(760px, 100%)",
            background: "#ffffff",
            border: "1px solid #e5e8eb",
            borderRadius: "22px",
            boxShadow: "0 8px 24px rgba(25, 31, 40, 0.06)",
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
              color: "#0064ff"
            }}
          >
            C-Quant Startup
          </p>
          <h1
            style={{
              margin: "12px 0 8px",
              fontSize: "30px",
              letterSpacing: "-0.025em",
              fontWeight: 700,
              color: "#191f28"
            }}
          >
            Renderer startup failed
          </h1>
          <p style={{ margin: 0, lineHeight: 1.6, color: "#4e5968" }}>
            The desktop shell loaded, but the React renderer stopped during startup. Restart the
            app. If the problem repeats, use the error detail below.
          </p>
          <pre
            style={{
              margin: "18px 0 0",
              padding: "16px",
              borderRadius: "14px",
              background: "#f9fafb",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              border: "1px solid #e5e8eb",
              color: "#4e5968"
            }}
          >
            {this.state.error.stack || this.state.error.message}
          </pre>
        </section>
      </div>
    );
  }
}

function RendererBootstrap() {
  useEffect(() => {
    notifyRendererReady();
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <CommandPaletteProvider>
          <AppShellExtensions />
          <RuntimeErrorBoundary>
            <App />
          </RuntimeErrorBoundary>
        </CommandPaletteProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

window.addEventListener("error", (event) => {
  const details = describeUnknownError(event.error || event.message || "Unknown window error.");
  reportRendererStartupFailure({
    phase: "window-error",
    message: details.message,
    stack: details.stack
  });
});

window.addEventListener("unhandledrejection", (event) => {
  const details = describeUnknownError(event.reason);
  reportRendererStartupFailure({
    phase: "unhandledrejection",
    message: details.message,
    stack: details.stack
  });
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  reportRendererStartupFailure({
    phase: "dom-bootstrap",
    message: "Root element #root was not found during renderer startup."
  });
  throw new Error("Root element #root was not found during renderer startup.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <StartupErrorBoundary>
      <RendererBootstrap />
    </StartupErrorBoundary>
  </React.StrictMode>
);
