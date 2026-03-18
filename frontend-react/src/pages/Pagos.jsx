import { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { Search, DollarSign, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstatus, setFilterEstatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await Api.get('/pagos');
      setPagos(res);
    } catch (error) {
      console.error('Error fetching pagos', error);
    } finally {
      setLoading(false);
    }
  };

  const liquidarPago = async (id) => {
    if (!window.confirm('¿Confirmas que este pago ha sido transferido o entregado en efectivo?')) return;
    try {
      await Api.post(`/pagos/${id}/liquidar`);
      fetchData();
    } catch (error) {
      alert(error.message || 'Error al liquidar pago');
    }
  };

  const filtered = pagos.filter(p => {
    const matchSearch = p.colaborador_id?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstatus = filterEstatus ? p.estatus === filterEstatus : true;
    return matchSearch && matchEstatus;
  });

  const getEstatusBadge = (estatus) => {
    const badges = {
      'pendiente': 'badge-warning',
      'pagado': 'badge-success'
    };
    return <span className={`badge ${badges[estatus] || 'badge-neutral'}`}>{estatus}</span>;
  };

  const totalPendiente = filtered.filter(p => p.estatus === 'pendiente').reduce((acc, p) => acc + p.monto, 0);

  return (
    <div className="fade-in">
      <div className="table-toolbar">
        <div className="filter-row">
          <div className="search-wrap">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input w-250" 
              placeholder="Filtrar colaboradora..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="select-sm" value={filterEstatus} onChange={e => setFilterEstatus(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="pagado">Liquidados</option>
          </select>
        </div>
        <div className="toolbar-right">
          <div style={{ color: 'var(--amber-dark)', fontWeight: 600, background: 'var(--amber-light)', padding: '6px 12px', borderRadius: '8px' }}>
            Deuda Pendiente: ${totalPendiente.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Colaboradora</th>
                <th>Periodo</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha Pago</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Cargando datos...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>No se encontraron pagos registrados.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p._id}>
                    <td><div className="cell-primary">{p.colaborador_id?.nombre || '-'}</div></td>
                    <td>
                      <div className="cell-muted" style={{ fontSize: '13px' }}>
                        {p.periodo_inicio ? format(new Date(p.periodo_inicio), 'dd/MM/yy') : '-'} al {p.periodo_fin ? format(new Date(p.periodo_fin), 'dd/MM/yy') : '-'}
                      </div>
                    </td>
                    <td><div className="cell-primary" style={{ color: 'var(--rose-deep)' }}>${p.monto?.toFixed(2) || '0.00'}</div></td>
                    <td>{getEstatusBadge(p.estatus)}</td>
                    <td>{p.fecha_pago ? format(new Date(p.fecha_pago), 'dd/MM/yy HH:mm') : '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {p.estatus === 'pendiente' ? (
                        <button className="btn-sm-outline" style={{ color: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => liquidarPago(p._id)}>
                          <CheckCircle size={14} style={{ marginRight: '4px' }}/> Liquidar
                        </button>
                      ) : (
                        <span style={{ color: 'var(--success)', fontSize: '12px', fontWeight: 600 }}>Completado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
