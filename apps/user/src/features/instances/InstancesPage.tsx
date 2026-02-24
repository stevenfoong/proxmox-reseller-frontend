import React from 'react';
import { StatusBadge } from '@proxmox-reseller/ui';

export function InstancesPage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Instances</h2>
        <button
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          + New Instance
        </button>
      </div>
      <p style={{ color: '#64748b' }}>Manage your virtual machines and containers.</p>

      {/* Placeholder table */}
      <div
        style={{
          background: '#fff',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          marginTop: '1rem',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead style={{ background: '#f1f5f9' }}>
            <tr>
              {['Name', 'Type', 'Status', 'IP Address', 'vCPUs', 'RAM', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#475569',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={7}
                style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}
              >
                No instances yet. Create your first instance to get started.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* StatusBadge demo */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <StatusBadge status="running" />
        <StatusBadge status="stopped" />
        <StatusBadge status="paused" />
        <StatusBadge status="error" />
      </div>
    </div>
  );
}
