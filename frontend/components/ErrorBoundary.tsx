'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service (Sentry, LogRocket, etc.)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-md w-full bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-8 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 p-4 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">
                Something went wrong
              </h1>

              <p className="text-slate-300 mb-6">
                {this.state.errorInfo ||
                  'An unexpected error occurred. Please try refreshing the page.'}
              </p>

              <div className="flex gap-3 w-full">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 w-full">
                  <summary className="text-sm text-slate-400 cursor-pointer hover:text-white transition-colors">
                    View Error Details
                  </summary>
                  <pre className="mt-4 p-4 bg-slate-950/50 rounded-lg text-xs text-red-300 overflow-auto max-h-40 text-left border border-red-900/50">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
