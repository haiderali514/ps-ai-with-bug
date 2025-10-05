import React, { Component, ErrorInfo, ReactNode } from 'react';
import Icon from './ui/Icon';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-gray-900 text-gray-300" role="alert">
          <Icon type="logo" className="w-24 h-24 text-red-500 opacity-50 mb-6"/>
          <h1 className="text-3xl font-bold text-red-400 mb-2">Something went wrong.</h1>
          <p className="text-lg mb-6 max-w-md text-center">We're sorry, but the application encountered an unexpected error. Please try reloading the page.</p>
          <button
            onClick={this.handleReload}
            className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-indigo-500 transition-colors"
          >
            Reload Page
          </button>
          {this.state.error && (
             <details className="mt-8 text-left bg-gray-800 p-4 rounded-lg max-w-2xl w-full">
                <summary className="cursor-pointer font-medium text-gray-400">Error Details</summary>
                <pre className="mt-2 text-sm text-red-300 whitespace-pre-wrap break-all">
                    {this.state.error.toString()}
                </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;