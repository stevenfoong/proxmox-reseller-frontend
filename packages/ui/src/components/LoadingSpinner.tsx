import React from 'react';

export interface LoadingSpinnerProps {
  size?: number;
  label?: string;
}

/** Simple CSS-based loading spinner with an optional accessible label. */
export function LoadingSpinner({ size = 32, label = 'Loading…' }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ animation: 'spin 1s linear infinite' }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{label}</span>
    </div>
  );
}
