import { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await Api.get('/categorias');
      setCategorias(res);
    } catch (error) {
      console.error('Error fetching categorias', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await Api.put(`/categorias/${formData._id}`, formData);
      } else {
        await Api.post('/categorias', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿ELIMINAR ESTA CATEGORÍA? Se borrarán todos los productos asociados.')) return;
    try {
      await Api.delete(`/categorias/${id}`);
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const openEdit = (cat) => {
    setIsEditing(true);
    setFormData(cat);
    setShowModal(true);
  };

  const openNew = () => {
    setIsEditing(false);
    setFormData({ nombre: '', descripcion: '' });
    setShowModal(true);
  };

  const filtered = categorias.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
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
              placeholder="Buscar categoría..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="count-label">{filtered.length} categorías</span>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" onClick={openNew}>
            <Plus size={16}/> Nueva Categoría
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Cargando datos...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>No se encontraron categorías.</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c._id}>
                    <td><div className="cell-primary">{c.nombre}</div></td>
                    <td><div className="cell-muted">{c.descripcion || '-'}</div></td>
                    <td><div className="badge badge-success">Sincronizado</div></td>
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
                <h3 className="modal-title">{isEditing ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                <p className="modal-sub">Información de la agrupación de productos.</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form id="catForm" onSubmit={handleSave}>
                <div className="form-grid-2">
                  <div className="form-field full-span">
                    <label>Nombre de Categoría *</label>
                    <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                  </div>
                  <div className="form-field full-span">
                    <label>Descripción</label>
                    <textarea rows="2" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}></textarea>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button form="catForm" type="submit" className="btn-primary">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
