'use client';

import React, { type ReactNode } from 'react';

interface ClientErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** When this value changes, the boundary resets (e.g. lecture id). */
  resetKey?: string;
}

interface ClientErrorBoundaryState {
  hasError: boolean;
}

export class ClientErrorBoundary extends React.Component<
  ClientErrorBoundaryProps,
  ClientErrorBoundaryState
> {
  state: ClientErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ClientErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ClientErrorBoundary caught:', error, info);
  }

  componentDidUpdate(prevProps: ClientErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-6 text-center text-destructive">
            حدث خطأ غير متوقع
          </div>
        )
      );
    }

    return this.props.children;
  }
}
