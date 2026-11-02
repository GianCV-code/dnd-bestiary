import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0a0c10',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: '#161922',
            border: '1px solid #dc2626',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ color: '#ef4444', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Error inesperado al cargar la aplicación
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              {this.state.error?.message || 'Ha ocurrido un error en la renderización.'}
            </p>
            <pre style={{
              backgroundColor: '#0a0c10',
              padding: '12px',
              borderRadius: '6px',
              overflowX: 'auto',
              fontSize: '0.8rem',
              color: '#fca5a5'
            }}>
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                padding: '10px 18px',
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

