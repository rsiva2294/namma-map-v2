import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
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

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary-container glass">
            <AlertTriangle size={48} color="var(--danger)" />
            <h2>Something went wrong</h2>
            <p>The map engine encountered an unexpected error.</p>
            <button
              onClick={this.handleReset}
              className="error-reset-btn"
            >
              <RefreshCcw size={18} />
              Reload Application
            </button>
            {this.state.error && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <pre>{this.state.error.message}</pre>
              </details>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
