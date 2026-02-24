import React from 'react';

export interface StatusBadgeProps {
  status: 'running' | 'stopped' | 'paused' | 'error';
}

const COLOR_MAP: Record<StatusBadgeProps['status'], string> = {
  running: '#16a34a',
  stopped: '#6b7280',
  paused: '#ca8a04',
  error: '#dc2626',
};

const LABEL_MAP: Record<StatusBadgeProps['status'], string> = {
  running: 'Running',
  stopped: 'Stopped',
  paused: 'Paused',
  error: 'Error',
};

/** Displays a coloured pill indicating a VM / container status. */
export function StatusBadge({ status }: StatusBadgeProps) {
  const color = COLOR_MAP[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.125rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      {LABEL_MAP[status]}
    </span>
  );
}
