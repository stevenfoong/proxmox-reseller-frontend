import React, { useState } from 'react';

export interface LoginPageProps {
  title: string;
  subtitle?: string;
  onLogin: () => void;
  error?: Error;
}

/** Branded login page with a "Sign in with SSO" button. */
export function LoginPage({ title, subtitle, onLogin, error }: LoginPageProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          background: '#1e293b',
          borderRadius: '0.75rem',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '22rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#60a5fa',
            margin: '0 0 0.25rem',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0 0 1.5rem' }}>
            {subtitle}
          </p>
        )}
        {!subtitle && <div style={{ marginBottom: '1.5rem' }} />}
        {error && (
          <p
            role="alert"
            style={{
              fontSize: '0.8125rem',
              color: '#f87171',
              background: '#450a0a',
              border: '1px solid #7f1d1d',
              borderRadius: '0.375rem',
              padding: '0.625rem 0.75rem',
              marginBottom: '1rem',
            }}
          >
            {error.message?.trim() || 'Unable to connect to authentication server.'}
          </p>
        )}
        <button
          onClick={onLogin}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: '100%',
            padding: '0.625rem 1rem',
            background: hovered ? '#1d4ed8' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          Sign in with SSO
        </button>
      </div>
    </div>
  );
}
