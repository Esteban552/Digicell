import React, { ReactNode } from 'react';
import { log } from '../lib/logging-client';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    log.error(error.message, {
      componentStack: info.componentStack,
      name: error.name,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
          <h2 className="text-xl font-bold font-sans text-on-surface">Algo salió mal</h2>
          <p className="text-sm font-sans text-on-surface-variant text-center max-w-md">
            Ocurrió un error inesperado en esta sección. Si el problema persiste, contactá al administrador.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-6 h-10 bg-primary hover:bg-primary-container text-white rounded-md text-sm font-bold font-sans shadow-sm outline-none cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
