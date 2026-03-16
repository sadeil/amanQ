import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            padding: 24,
            maxWidth: 560,
            margin: "40px auto",
            background: "rgba(16, 22, 35, 0.95)",
            border: "1px solid #2a3344",
            borderRadius: 12,
            color: "#e6ebf2",
            fontFamily: "Inter, sans-serif"
          }}
        >
          <h2 style={{ margin: "0 0 12px 0", color: "#ff7b7b" }}>Something went wrong</h2>
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: "rgba(0,0,0,0.3)",
              borderRadius: 8,
              fontSize: 12,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}
          >
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              background: "#2f7bff",
              border: "none",
              borderRadius: 8,
              color: "#0b0f16",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
