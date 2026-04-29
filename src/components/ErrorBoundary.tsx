import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';

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

  private handleClearCache = async () => {
    try {
      const DB_NAME = 'nammamap-cache';
      const databases = await window.indexedDB.databases();
      if (databases.some(db => db.name === DB_NAME)) {
        window.indexedDB.deleteDatabase(DB_NAME);
      }
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error('Failed to clear cache:', e);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const language = useMapStore.getState().language;
      return (
        this.props.fallback || (
          <div className="error-boundary-container glass">
            <div className="error-icon-wrapper">
              <AlertTriangle size={48} color="var(--danger)" />
            </div>
            <h2>{language === 'ta' ? 'ஏதோ தவறு நடந்துவிட்டது' : 'Something went wrong'}</h2>
            <p>{language === 'ta' ? 'வரைபட இயந்திரத்தில் எதிர்பாராத பிழை ஏற்பட்டது.' : 'The map engine encountered an unexpected error.'}</p>
            
            <div className="error-actions">
              <button
                onClick={this.handleReset}
                className="error-reset-btn primary"
              >
                <RefreshCcw size={18} />
                {language === 'ta' ? 'மீண்டும் ஏற்றவும்' : 'Reload Application'}
              </button>

              <button
                onClick={this.handleClearCache}
                className="error-reset-btn secondary"
                title="Use this if reloading doesn't fix the issue"
              >
                {language === 'ta' ? 'தற்காலிக சேமிப்பை அழி' : 'Clear Cache & Reset'}
              </button>
            </div>

            {this.state.error && (
              <details className="error-details">
                <summary>{language === 'ta' ? 'தொழில்நுட்ப விவரங்கள்' : 'Technical Details'}</summary>
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
