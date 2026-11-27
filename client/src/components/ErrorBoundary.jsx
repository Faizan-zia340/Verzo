import React from 'react';

// Root error boundary: catches render crashes anywhere in the app and
// shows a recoverable screen instead of a blank white page. Class
// component on purpose — function components cannot be error boundaries.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log for diagnostics; the user only ever sees the fallback UI.
    // eslint-disable-next-line no-console
    console.error('Penlix crashed:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          backgroundColor: '#020617',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: 16,
            padding: 40,
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: '#8B6F47',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 800,
              margin: '0 auto 16px',
            }}
          >
            P
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 24px', lineHeight: 1.5 }}>
            Penlix hit an unexpected error. Reloading usually fixes it — your content is saved in History.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              backgroundColor: '#8B6F47',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 32px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload Penlix
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
