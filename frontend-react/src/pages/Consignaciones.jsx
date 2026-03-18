import { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { Plus, Search, Archive } from 'lucide-react';
import { format } from 'date-fns';

export default function Consignaciones() {
  const [consignaciones, setConsignaciones] = useState([]);
  const [colaboradoras, setColaboradoras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ colaborador_id: '', producto_id: '', cantidad_ingresada: '', fecha_ingreso: new Date().toISOString().split('T')[0] });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [consRes, colabRes, prodRes] = await Promise.all([
        Api.get('/consignaciones'),
        Api.get('/colaboradores'),
        Api.get('/productos')
      ]);
      setConsignaciones(consRes);
      setColaboradoras(colabRes);
      setProductos(prodRes);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleColaboradorChange = (colabId) => {
    setFormData({ ...formData, colaborador_id: colabId, producto_id: '' });
    setPreview(null);
  };

  const handleProductoChange = (prodId) => {
    setFormData({ ...formData, producto_id: prodId });
    if (!prodId) {
      setPreview(null);
      return;
    }
    const prod = productos.find(p => p._id === prodId);
    const colab = colaboradoras.find(c => c._id === formData.colaborador_id);
    if (prod && colab) {
      setPreview({
        precio: prod.precio_venta,
        comision: colab.porcentaje_comision,
        gananciaTienda: prod.precio_venta * (1 - colab.porcentaje_comision / 100)
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (!formData.colaborador_id || !formData.producto_id || !formData.cantidad_ingresada) {
        alert("Completa todos los campos"); return;
      }
      await Api.post('/consignaciones', {
        ...formData,
        cantidad_ingresada: parseInt(formData.cantidad_ingresada),
        fecha_ingreso: new Date(formData.fecha_ingreso)
      });
      setShowModal(false);
      setFormData({ colaborador_id: '', producto_id: '', cantidad_ingresada: '', fecha_ingreso: new Date().toISOString().split('T')[0] });
      setPreview(null);
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const filtered = consignaciones.filter(c => 
    c.producto_id?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.colaborador_id?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (estatus) => {
    const badges = {
      'activa': 'badge badge-success',
      'agotada': 'badge badge-danger',
      'devuelta': 'badge badge-neutral'
    };
    return <span className={badges[estatus] || 'badge badge-neutral'}>{estatus || 'activa'}</span>;
  };

  // Filtrar productos que pertenezcan a la colaboradora seleccionada (o que sean de consignación en general dependiendo del backend, asumimos que pertenecen a la colaboradora si la tiene)
  const availableProducts = formData.colaborador_id 
    ? productos.filter(p => p.colaborador_id?._id === formData.colaborador_id || p.colaborador_id === formData.colaborador_id)
    : [];

  return (
    <div className="fade-in">
      <div className="table-toolbar">
        <div className="filter-row">
          <div className="search-wrap">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input w-250" 
              placeholder="Buscar producto o colaboradora..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="count-label">{filtered.length} consignaciones</span>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Archive size={16}/> Entrada a Consignación
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Colaboradora</th>
                <th>Ingresado</th>
                <th>Disponible</th>
                <th>Vendido</th>
                <th>Estado</th>
                <th>Fecha Entrada</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Cargando datos...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>No se encontraron consignaciones.</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c._id}>
                    <td><div className="cell-primary" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace:'nowrap' }}>{c.producto_id?.nombre || '-'}</div></td>
                    <td><div className="cell-muted">{c.colaborador_id?.nombre || '-'}</div></td>
                    <td>{c.cantidad_ingresada}</td>
                    <td><strong>{c.stock_disponible ?? c.cantidad_disponible ?? 0}</strong></td>
                    <td>{c.cantidad_vendida ?? 0}</td>
                    <td>{getStatusBadge(c.estatus)}</td>
                    <td>{c.fecha_ingreso ? format(new Date(c.fecha_ingreso), 'dd/MM/yyyy') : '-'}</td>
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
                <h3 className="modal-title">Entrada a Consignación</h3>
                <p className="modal-sub">Registra el ingreso físico de productos de una colaboradora.</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form id="consigForm" onSubmit={handleSave}>
                <div className="form-grid-2">
                  <div className="form-field full-span">
                    <label>Colaboradora *</label>
                    <select required value={formData.colaborador_id} onChange={(e) => handleColaboradorChange(e.target.value)}>
                      <option value="">Selecciona colaboradora...</option>
                      {colaboradoras.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-field full-span">
                    <label>Producto *</label>
                    <select required value={formData.producto_id} onChange={(e) => handleProductoChange(e.target.value)} disabled={!formData.colaborador_id}>
                      <option value="">{formData.colaborador_id ? "Selecciona producto..." : "Primero selecciona colaboradora"}</option>
                      {availableProducts.map(p => <option key={p._id} value={p._id}>{p.nombre} — ${p.precio_venta}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Cantidad Ingresada *</label>
                    <input type="number" min="1" required value={formData.cantidad_ingresada} onChange={(e) => setFormData({...formData, cantidad_ingresada: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Fecha de Ingreso *</label>
                    <input type="date" required value={formData.fecha_ingreso} onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})} />
                  </div>
                </div>
                
                {preview && (
                  <div className="panel" style={{ marginTop: '16px', padding: '12px', background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '13px' }}>
                        <div>
                          <div style={{ color: 'var(--ink-muted)', marginBottom: '4px' }}>Precio Venta</div>
                          <div style={{ fontWeight: 600 }}>${preview.precio}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--ink-muted)', marginBottom: '4px' }}>Comisión</div>
                          <div style={{ fontWeight: 600, color: 'var(--blue)' }}>{preview.comision}% / pza</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--ink-muted)', marginBottom: '4px' }}>Ganancia Tienda</div>
                          <div style={{ fontWeight: 600, color: 'var(--success)' }}>${preview.gananciaTienda} / pza</div>
                        </div>
                     </div>
                  </div>
                )}
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button form="consigForm" type="submit" className="btn-primary">Registrar Consignación</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
