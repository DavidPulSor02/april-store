import React from 'react';
import { Settings, Save } from 'lucide-react';

export default function Configuracion() {
  return (
    <div className="fade-in">
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-sub">Ajustes generales del sistema y preferencias.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <Settings size={64} style={{ color: 'var(--ink-muted)', marginBottom: '16px' }} />
          <h3>Sección en Construcción</h3>
          <p style={{ color: 'var(--ink-muted)', maxWidth: '400px', margin: '8px auto' }}>
            Estamos trabajando para traer todas las configuraciones avanzadas del sistema a esta nueva interfaz muy pronto.
          </p>
        </div>
      </div>
    </div>
  );
}
