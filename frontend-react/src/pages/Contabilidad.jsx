import { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { Plus, Search, TrendingUp, TrendingDown, Activity, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export default function Contabilidad() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ concepto: '', tipo: 'ingreso', monto: '', categoria_contable: 'otro', metodo_pago: 'efectivo', fecha: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await Api.get('/contabilidad');
      // Sorting desc por fecha para tener los más recientes arriba
      const sorted = res.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
      setMovimientos(sorted);
    } catch (error) {
      console.error('Error fetching contabilidad', error);
      alert('Error cargando los movimientos contables');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await Api.post('/contabilidad', {
        ...formData,
        monto: parseFloat(formData.monto),
        fecha: new Date(formData.fecha)
      });
      setShowModal(false);
      setFormData({ concepto: '', tipo: 'ingreso', monto: '', categoria_contable: 'otro', metodo_pago: 'efectivo', fecha: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error) {
      alert(error.message || 'Error al registrar el movimiento');
    }
  };

  const filtered = movimientos.filter(m => {
    const matchSearch = m.concepto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo ? m.tipo === filterTipo : true;
    return matchSearch && matchTipo;
  });

  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((acc, m) => acc + m.monto, 0);
  const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((acc, m) => acc + m.monto, 0);
  const balance = ingresos - egresos;

  const KpiCard = ({ icon: Icon, color, title, value, subtitle }) => (
    <div className="panel kpi-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `var(--${color}-light)`, color: `var(--${color}-deep)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} strokeWidth={2.5}/>
        </div>
      </div>
      <div style={{ color: 'var(--ink-muted)', fontSize: '13px', fontWeight: 500, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink-dark)', marginBottom: '8px' }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {subtitle}
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      
      {/* KPIs */}
      <div className="form-grid-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <KpiCard icon={TrendingUp} color="success" title="Ingresos Totales" value={`$${ingresos.toFixed(2)}`} subtitle="Suma de ventas y entradas" />
        <KpiCard icon={TrendingDown} color="rose" title="Egresos Totales" value={`$${egresos.toFixed(2)}`} subtitle="Pagos y gastos" />
        <KpiCard icon={Activity} color="amber" title="Balance Neto" value={`$${balance.toFixed(2)}`} subtitle={balance >= 0 ? 'Flujo positivo' : 'Déficit operativo'} />
        <KpiCard icon={CreditCard} color="blue" title="Movimientos" value={movimientos.length} subtitle="Registros en sistema" />
      </div>

      <div className="table-toolbar">
        <div className="filter-row">
          <div className="search-wrap">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input w-250" 
              placeholder="Buscar concepto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="select-sm" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
            <option value="">Ingresos y Egresos</option>
            <option value="ingreso">Solo Ingresos</option>
            <option value="egreso">Solo Egresos</option>
          </select>
          <span className="count-label">{filtered.length} movimientos</span>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16}/> Registrar Movimiento
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Cargando datos...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>No se encontraron movimientos registrados.</td></tr>
              ) : (
                filtered.map(m => (
                  <tr key={m._id}>
                    <td>{format(new Date(m.fecha), 'dd/MM/yy HH:mm')}</td>
                    <td><div className="cell-primary">{m.concepto}</div></td>
                    <td><span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{m.categoria_contable?.replace('_', ' ') || 'General'}</span></td>
                    <td>
                      {m.tipo === 'ingreso' ? (
                        <span className="badge badge-success">Ingreso</span>
                      ) : (
                        <span className="badge badge-danger">Egreso</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="cell-primary" style={{ color: m.tipo === 'ingreso' ? 'var(--success)' : 'var(--danger)' }}>
                        {m.tipo === 'ingreso' ? '+' : '−'}${m.monto?.toFixed(2)}
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
                <h3 className="modal-title">Registrar Movimiento</h3>
                <p className="modal-sub">Ingresa un movimiento financiero manual o ajuste de caja.</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form id="movForm" onSubmit={handleSave}>
                <div className="form-grid-2">
                  <div className="form-field full-span">
                    <label>Concepto *</label>
                    <input type="text" required value={formData.concepto} onChange={e => setFormData({...formData, concepto: e.target.value})} placeholder="Ej. Pago servicio internet" />
                  </div>
                  <div className="form-field">
                    <label>Tipo de Movimiento *</label>
                    <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                      <option value="ingreso">Ingreso (+)</option>
                      <option value="egreso">Egreso (−)</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Monto *</label>
                    <div className="input-prefix-wrap">
                      <span className="input-prefix">$</span>
                      <input type="number" step="0.01" min="0.01" required value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-field">
                    <label>Categoría Contable</label>
                    <select value={formData.categoria_contable} onChange={e => setFormData({...formData, categoria_contable: e.target.value})}>
                      <option value="otro">General / Otro</option>
                      <option value="proveedores">Pago a proveedores</option>
                      <option value="servicios">Servicios y operaciones</option>
                      <option value="salarios">Nómina y comisiones</option>
                      <option value="ajuste_caja">Ajuste de caja</option>
                      <option value="ventas">Ventas no automáticas</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Método</label>
                    <select value={formData.metodo_pago} onChange={e => setFormData({...formData, metodo_pago: e.target.value})}>
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                    </select>
                  </div>
                  <div className="form-field full-span">
                    <label>Fecha del Movimiento</label>
                    <input type="date" required value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button form="movForm" type="submit" className="btn-primary">Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
