import React from 'react';

/**
 * Error Boundary Component for catching React errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#e4e6eb', background: '#0a0e1a', minHeight: '100vh' }}>
          <h1 style={{ color: '#ff6b6b' }}>Something went wrong</h1>
          <p>Error: {this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#6b8aff',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Reload Page
          </button>
          <pre style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#1a1f35',
            borderRadius: '6px',
            overflow: 'auto'
          }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
