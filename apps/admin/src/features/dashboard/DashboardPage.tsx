import React from 'react';

export function DashboardPage() {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Dashboard</h2>
      <p style={{ color: '#64748b' }}>Cluster health and resource overview.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
        }}
      >
        {[
          { label: 'Active VMs', value: '—', color: '#3b82f6' },
          { label: 'Active Users', value: '—', color: '#10b981' },
          { label: 'Nodes Online', value: '—', color: '#f59e0b' },
          { label: 'Monthly Revenue', value: '—', color: '#8b5cf6' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: '#fff',
              borderRadius: '0.5rem',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              borderTop: `3px solid ${color}`,
            }}
          >
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#64748b' }}>{label}</p>
            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
