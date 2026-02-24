import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@proxmox-reseller/auth';

interface UserLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { to: '/dashboard', label: '🏠 Dashboard' },
  { to: '/instances', label: '🖥️ Instances' },
  { to: '/storage', label: '💾 Storage' },
  { to: '/network', label: '🌐 Network' },
  { to: '/billing', label: '💳 Billing' },
];

export function UserLayout({ children }: UserLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: '#0f172a',
          color: '#f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem 0',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid #1e293b' }}>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#60a5fa' }}>
            ☁️ Proxmox Cloud
          </h1>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'block',
                padding: '0.625rem 1.5rem',
                color: isActive ? '#60a5fa' : '#cbd5e1',
                textDecoration: 'none',
                background: isActive ? '#1e293b' : 'transparent',
                borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #1e293b' }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.5rem' }}>
            {user?.name}
          </p>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94a3b8',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '2rem', background: '#f8fafc', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
