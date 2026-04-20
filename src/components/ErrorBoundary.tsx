import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Human-readable context, e.g. "price chart" or "AI chat" */
  context?: string;
  /** Optional compact mode for inline components */
  compact?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.context ? `: ${this.props.context}` : ""}]`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { context, compact } = this.props;
    const label = context ? `the ${context}` : "this section";

    if (compact) {
      return (
        <div
          className="flex items-center gap-2 border border-[#fecaca] bg-[#fef2f2] rounded-lg p-2.5"
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5 text-[#dc2626] shrink-0" aria-hidden="true" />
          <p className="text-xs text-[#0f172a] flex-1">
            Unable to load {label}
          </p>
          <button
            onClick={this.handleRetry}
            className="text-xs font-semibold text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
            aria-label={`Retry loading ${label}`}
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div
        className="flex flex-col items-center justify-center gap-3 border border-[#fecaca] bg-[#fef2f2] rounded-xl p-6"
        role="alert"
      >
        <AlertCircle className="h-5 w-5 text-[#dc2626]" aria-hidden="true" />
        <div className="text-center">
          <p className="text-sm font-medium text-[#0f172a] mb-0.5">
            Something went wrong
          </p>
          <p className="text-xs text-[#64748b]">
            We couldn't load {label}. This is usually temporary.
          </p>
        </div>
        <button
          onClick={this.handleRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e2e5ea] bg-white rounded-lg text-xs font-medium text-[#0f172a] hover:border-[#2563eb] transition-colors"
          aria-label={`Retry loading ${label}`}
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }
}
