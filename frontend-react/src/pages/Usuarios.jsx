import { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { ShieldAlert, Plus, Users, ShieldCheck, Mail, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'cajera'
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await Api.get('/auth/usuarios');
      setUsuarios(res);
    } catch (err) {
      alert("Error al cargar usuarios: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await Api.post('/auth/registro', formData);
      alert("Usuario registrado exitosamente");
      setShowModal(false);
      setFormData({ nombre: '', email: '', password: '', rol: 'cajera' });
      fetchUsuarios();
    } catch (err) {
      alert(err.message || 'Error al registrar al usuario');
    }
  };

  if (user?.rol !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
        <ShieldAlert size={48} style={{ margin: '0 auto 16px' }} />
        <h2>Acceso Denegado</h2>
        <p>No tienes permiso para ver esta sección.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="title" style={{ fontSize: '24px', fontWeight: 600, color: 'var(--ink)' }}>Gestión de Accesos</h2>
          <p style={{ color: 'var(--ink-mid)' }}>Agrega o administra los accesos de las cajeras y otras administradoras del sistema.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-muted)' }}>Cargando usuarios...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo Electrónico</th>
                <th>Rol en el Sistema</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 500 }}>{u.nombre}</td>
                  <td style={{ color: 'var(--ink-mid)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.rol === 'admin' ? 'badge-info' : 'badge-success'}`}>
                      {u.rol === 'admin' ? <ShieldCheck size={12} style={{ marginRight: '4px' }}/> : <Users size={12} style={{ marginRight: '4px' }}/>}
                      {u.rol.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {u.activo ? (
                      <span style={{ color: 'var(--success)', fontWeight: 500 }}>Activo</span>
                    ) : (
                      <span style={{ color: 'var(--danger)', fontWeight: 500 }}>Bloqueado</span>
                    )}
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color:'var(--ink-muted)' }}>No hay usuarios registrados.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay open" style={{ zIndex: 999 }}>
          <div className="modal open" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Crear Nuevo Acceso</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleRegister}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-field">
                  <label>Nombre del Empleado(a)</label>
                  <div className="input-with-icon">
                    <Users size={16} className="input-icon" />
                    <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Laura Gómez" style={{ paddingLeft: '40px' }} />
                  </div>
                </div>

                <div className="form-field">
                  <label>Correo Electrónico (Email de Ingreso)</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="laura@aprilstore.mx" style={{ paddingLeft: '40px' }} />
                  </div>
                </div>

                <div className="form-field">
                  <label>Contraseña Temporaria</label>
                  <div className="input-with-icon">
                    <Key size={16} className="input-icon" />
                    <input type="text" required minLength="6" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Más de 6 caracteres" style={{ paddingLeft: '40px' }} />
                  </div>
                  <small style={{ color: 'var(--ink-muted)' }}>La contraseña será encriptada en la base de datos automáticamente.</small>
                </div>

                <div className="form-field">
                  <label>Nivel de Permisos</label>
                  <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}>
                    <option value="cajera">Cajera (Solo Vista de Ventas POS)</option>
                    <option value="admin">Administradora (Acceso Total)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar Cuenta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
