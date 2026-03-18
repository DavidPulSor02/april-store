import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function CajeraLayout() {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {/* Topbar Minimalista */}
      <header style={{ 
        height: '60px', 
        background: 'var(--surface-1)', 
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
              <path d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2z" fill="white"/>
              <path d="M9 14c0-2.761 2.239-5 5-5s5 2.239 5 5-2.239 5-5 5-5-2.239-5-5z" fill="var(--rose)"/>
            </svg>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 600, color: 'var(--rose-deep)' }}>
            April Store <span style={{ fontSize: '14px', color: 'var(--ink-muted)', fontFamily: 'system-ui', marginLeft: '8px' }}>| Caja</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{user.nombre}</span>
            <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Cajera en Turno</span>
          </div>
          <button 
            onClick={logout}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              padding: '8px 16px', borderRadius: '8px', 
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--danger)', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--danger)'; }}
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      {/* Todo el espacio restante es para el POS */}
      <main style={{ flex: 1, overflow: 'hidden', padding: '24px' }}>
        <Outlet />
      </main>
    </div>
  );
}
