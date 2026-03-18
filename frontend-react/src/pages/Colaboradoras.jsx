import { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { Plus, Search, MapPin, Phone, MoreVertical, Edit2, Trash2 } from 'lucide-react';

export default function Colaboradoras() {
  const [colaboradoras, setColaboradoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '', direccion: '', porcentajeDefault: 50 });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await Api.get('/colaboradores');
      setColaboradoras(res);
    } catch (error) {
      console.error('Error fetching colaboradoras', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await Api.put(`/colaboradores/${formData._id}`, formData);
      } else {
        await Api.post('/colaboradores', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta colaboradora?')) return;
    try {
      await Api.delete(`/colaboradores/${id}`);
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const openEdit = (col) => {
    setIsEditing(true);
    setFormData(col);
    setShowModal(true);
  };

  const openNew = () => {
    setIsEditing(false);
    setFormData({ nombre: '', email: '', telefono: '', direccion: '', porcentajeDefault: 50 });
    setShowModal(true);
  };

  const filtered = colaboradoras.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="table-toolbar">
        <div className="filter-row">
          <div className="search-wrap">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input w-250" 
              placeholder="Buscar colaboradora..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="count-label">{filtered.length} usuarias</span>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" onClick={openNew}>
            <Plus size={16}/> Nueva Colaboradora
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Colaboradora</th>
                <th>Contacto</th>
                <th>Ubicación</th>
                <th>Comisión</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Cargando datos...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>No se encontraron colaboradoras.</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="colab-card-av" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                          {c.nombre.charAt(0)}
                        </div>
                        <div>
                          <div className="cell-primary">{c.nombre}</div>
                          <div className="cell-muted">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={12}/> {c.telefono || 'Sin teléfono'}
                      </div>
                    </td>
                    <td>
                      <div className="cell-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={12}/> {c.direccion || 'Sin dirección'}
                      </div>
                    </td>
                    <td>
                      <div className="badge badge-rose">{c.porcentajeDefault}%</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button className="row-action-btn" onClick={() => openEdit(c)} title="Editar"><Edit2 size={14}/></button>
                        <button className="row-action-btn" onClick={() => handleDelete(c._id)} style={{ color: 'var(--danger)' }} title="Eliminar"><Trash2 size={14} color="currentColor"/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal modal-md open">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{isEditing ? 'Editar Colaboradora' : 'Nueva Colaboradora'}</h3>
                <p className="modal-sub">Ingresa la información para el perfil.</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form id="colabForm" onSubmit={handleSave}>
                <div className="form-grid-2">
                  <div className="form-field full-span">
                    <label>Nombre y Apellidos</label>
                    <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Teléfono</label>
                    <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Email (Opcional)</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="form-field full-span">
                    <label>Dirección</label>
                    <input type="text" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Plazo Consignación (días)</label>
                    <input type="number" defaultValue="30" />
                  </div>
                  <div className="form-field">
                    <label>Porcentaje Comisión (%)</label>
                    <input type="number" required min="1" max="100" value={formData.porcentajeDefault} onChange={e => setFormData({...formData, porcentajeDefault: e.target.value})} />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button form="colabForm" type="submit" className="btn-primary">Guardar Usuaria</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
