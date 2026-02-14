import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-surface-950">
          <h1 className="text-xl font-semibold text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-400 text-sm mb-4 max-w-md text-center">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
