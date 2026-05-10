'use client';
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, background: '#1e293b', minHeight: '100vh', color: 'white', fontFamily: 'monospace' }}>
          <h2 style={{ color: '#ef4444' }}>❌ Ошибка</h2>
          <p style={{ color: '#fbbf24' }}>{this.state.error.message}</p>
          <pre style={{ color: '#94a3b8', fontSize: 11, whiteSpace: 'pre-wrap', marginTop: 16 }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
