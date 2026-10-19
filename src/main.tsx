import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled runtime error in RootErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'Cairo, Tahoma, Arial, sans-serif',
            background: 'linear-gradient(135deg, #0d6067 0%, #19777a 100%)',
            color: '#ffffff',
            textAlign: 'center',
            direction: 'rtl'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#174c59',
              padding: '36px 28px',
              borderRadius: '28px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              border: '2px solid #a7f3d0'
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '10px' }}>🏇✨</div>
            <h2 style={{ margin: '0 0 10px', fontSize: '24px', fontWeight: 900, color: '#0d6067' }}>
              منصة فرسان لغتي الخالدة
            </h2>
            <p style={{ margin: '0 0 20px', color: '#4a6770', fontSize: '15px', lineHeight: 1.65 }}>
              مرحبًا بكم يا أبطالنا الفرسان. تم حفظ بياناتكم وتقدمكم بأمان. اضغط على الزر أدناه لإعادة تشغيل الصفحة فورًا.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #f7b832, #e59812)',
                color: '#143d47',
                border: 'none',
                borderRadius: '999px',
                padding: '13px 36px',
                fontSize: '17px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 8px 22px rgba(229, 152, 18, 0.4)'
              }}
            >
              🔄 إعادة تشغيل الصفحة الآن
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
