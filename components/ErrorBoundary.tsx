import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-[#0f172a] text-white h-screen flex flex-col items-center justify-center">
          <h1 className="text-xl font-bold mb-4 text-red-500">Something went wrong.</h1>
          <p className="text-slate-400 mb-4">The application encountered an unexpected error.</p>
          <pre className="bg-slate-900 p-4 rounded text-xs text-red-300 mb-4 max-w-2xl overflow-auto">
            {this.state.error?.toString()}
          </pre>
          <button 
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

