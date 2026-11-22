import React from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(readable);
      if (parsed && typeof parsed.error === 'string') {
        readable = `${parsed.error} (${parsed.operationType || 'operation'} on ${parsed.path || 'database'})`;
      }
    } catch {
      // Keep original message
    }
    return { hasError: true, errorMessage: readable };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F4] text-[#242321] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#DED4C7] p-8 space-y-6">
            <div className="flex items-center gap-3 text-[#713D43]">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h1 className="font-editorial text-2xl text-[#242321]">
                Service Interrupted
              </h1>
            </div>
            <p className="text-sm font-body text-[#242321]/80 leading-relaxed">
              We encountered an access or synchronization issue while connecting to the live TRACE database.
            </p>
            <div className="p-3 bg-[#F3EFE8] border border-[#DED4C7] font-mono text-xs text-[#242321]/80 break-words">
              {this.state.errorMessage}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#242321] text-[#FAF8F4] text-xs font-mono uppercase tracking-wider hover:bg-[#713D43] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/');
                  window.location.reload();
                }}
                className="px-5 py-2.5 border border-[#DED4C7] text-[#242321] text-xs font-mono uppercase tracking-wider hover:bg-[#F3EFE8] transition-colors cursor-pointer"
              >
                Return to Storefront
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
