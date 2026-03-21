import { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { Search, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetodo, setFilterMetodo] = useState('');

  const [showDetalle, setShowDetalle] = useState(false);
  const [ventaActual, setVentaActual] = useState(null);

  // Estados para el reporte de email
  const [showReportParams, setShowReportParams] = useState(false);
  const [reportTipo, setReportTipo] = useState('mes');
  const [reportMesAnno, setReportMesAnno] = useState('');
  const [reportQuincena, setReportQuincena] = useState(1);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportWhatsappText, setReportWhatsappText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await Api.get('/ventas');
      setVentas(res);
    } catch (error) {
      console.error('Error fetching ventas', error);
      alert('Error cargando el historial de ventas');
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (v) => {
    try {
      const res = await Api.get(`/ventas/${v._id}`);
      setVentaActual(res);
      setShowDetalle(true);
    } catch (err) {
      alert("Error cargando detalles de la venta");
    }
  };

  const handleSendReport = async () => {
    if (!reportMesAnno) return alert('Por favor, selecciona un mes y año.');
    try {
      setSendingReport(true);
      const res = await Api.post('/ventas/generar-reporte', {
        tipo: reportTipo,
        mesAnno: reportMesAnno,
        numQuincena: reportQuincena
      });
      if (res.success && res.whatsappText) {
        setReportWhatsappText(res.whatsappText);
      } else {
        alert(res.message || 'Error al generar reporte');
      }
    } catch (e) {
      alert(e.message || 'Error de conexión');
    } finally {
      setSendingReport(false);
    }
  };

  const filtered = ventas.filter(v => {
    const matchSearch = v.folio.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (v.usuario_id?.nombre && v.usuario_id.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchMetodo = filterMetodo ? v.metodo_pago === filterMetodo : true;
    return matchSearch && matchMetodo;
  });

  const MetodoBadge = ({ m }) => {
    const map = { efectivo: 'badge-success', transferencia: 'badge-info', tarjeta: 'badge-rose', mixto: 'badge-warning' };
    return <span className={`badge ${map[m] || 'badge-neutral'}`}>{m}</span>;
  };

  const EstatusBadge = ({ e }) => {
    const map = { completada: 'badge-success', cancelada: 'badge-danger', pendiente: 'badge-warning' };
    return <span className={`badge ${map[e] || 'badge-neutral'}`}>{e || 'completada'}</span>;
  };

  return (
    <div className="fade-in">
      <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="filter-row">
          <div className="search-wrap">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input w-250" 
              placeholder="Buscar por folio o usuario..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="select-sm" value={filterMetodo} onChange={e => setFilterMetodo(e.target.value)}>
            <option value="">Todos los métodos</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>
          <span className="count-label">{filtered.length} ventas</span>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" onClick={() => setShowReportParams(true)}>
            📊 Generar Reporte
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Usuario (Caja)</th>
                <th>Total</th>
                <th>Método</th>
                <th>Estado</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Cargando datos...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>No se encontraron ventas registradas.</td></tr>
              ) : (
                filtered.map(v => (
                  <tr key={v._id}>
                    <td><div className="cell-primary">{v.folio}</div></td>
                    <td>{v.fecha ? format(new Date(v.fecha), 'dd/MM/yyyy HH:mm') : '-'}</td>
                    <td>{v.usuario_id?.nombre || 'Administrador'}</td>
                    <td><div className="cell-primary" style={{ color: 'var(--rose-deep)' }}>${v.total?.toFixed(2) || '0.00'}</div></td>
                    <td><MetodoBadge m={v.metodo_pago} /></td>
                    <td><EstatusBadge e={v.estatus} /></td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button className="row-action-btn" onClick={() => verDetalle(v)} title="Ver Detalle"><Eye size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetalle && ventaActual && (
        <div className="modal-overlay open">
          <div className="modal modal-md open">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Detalle de Venta</h3>
                <p className="modal-sub">Folio: {ventaActual.folio}</p>
              </div>
              <button className="modal-close" onClick={() => setShowDetalle(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', padding: '16px', background: 'var(--surface-2)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Total Cobrado</div>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--ink-dark)' }}>${ventaActual.total?.toFixed(2) || '0.00'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Método de Pago</div>
                  <div style={{ marginTop: '4px' }}><MetodoBadge m={ventaActual.metodo_pago} /></div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Fecha</div>
                  <div style={{ fontWeight: 500 }}>{ventaActual.fecha ? format(new Date(ventaActual.fecha), 'dd/MM/yyyy HH:mm') : '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Cajero</div>
                  <div style={{ fontWeight: 500 }}>{ventaActual.usuario_id?.nombre || 'Administrador'}</div>
                </div>
              </div>

              <h4 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 600 }}>Artículos Vendidos</h4>
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ background: 'var(--surface-2)' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--ink-muted)' }}>Producto</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500, color: 'var(--ink-muted)' }}>Cantidad</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500, color: 'var(--ink-muted)' }}>Precio U.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventaActual.items && ventaActual.items.length > 0 ? (
                      ventaActual.items.map((it, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 12px' }}>{it.producto_id?.nombre || 'Producto eliminado'}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>{it.cantidad}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>${it.precio_unitario?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))
                    ) : (
                       <tr><td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: 'var(--ink-muted)' }}>Sin detalles de artículos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowDetalle(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showReportParams && (
        <div className="modal-overlay open">
          <div className="modal modal-md open">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Reporte de Ventas al Administrador</h3>
                <p className="modal-sub">El resumen se enviará por correo automáticamente.</p>
              </div>
              <button className="modal-close" onClick={() => setShowReportParams(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {reportWhatsappText ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 500, color: 'var(--ink-dark)' }}>
                    ¡Reporte Listo!<br/><span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--ink-muted)' }}>Elige a quién enviarlo mágicamente:</span>
                  </p>
                  <a href={`https://wa.me/522711272780?text=${encodeURIComponent(reportWhatsappText)}`} target="_blank" rel="noreferrer" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none', background: '#25D366', color: '#fff', border: 'none', display: 'block', padding: '12px', fontSize: '15px' }}>
                    📲 WhatsApp a 2711272780
                  </a>
                  <a href={`https://wa.me/522711077208?text=${encodeURIComponent(reportWhatsappText)}`} target="_blank" rel="noreferrer" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none', background: '#25D366', color: '#fff', border: 'none', display: 'block', padding: '12px', fontSize: '15px' }}>
                    📲 WhatsApp a 2711077208
                  </a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-field">
                    <label>Organizar por:</label>
                    <select value={reportTipo} onChange={e => setReportTipo(e.target.value)}>
                      <option value="mes">Mensual</option>
                      <option value="quincena">Quincenal</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Mes y Año de la consulta</label>
                    <input type="month" value={reportMesAnno} onChange={e => setReportMesAnno(e.target.value)} />
                  </div>
                  {reportTipo === 'quincena' && (
                    <div className="form-field">
                      <label>Quincena Específica</label>
                      <select value={reportQuincena} onChange={e => setReportQuincena(Number(e.target.value))}>
                        <option value={1}>1ra Quincena (Días 1 al 15)</option>
                        <option value={2}>2da Quincena (Del 16 a Fin de mes)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => { setShowReportParams(false); setReportWhatsappText(''); }}>
                {reportWhatsappText ? 'Cerrar' : 'Cancelar'}
              </button>
              {!reportWhatsappText && (
                <button className="btn-primary" onClick={handleSendReport} disabled={sendingReport}>
                  {sendingReport ? 'Generando...' : '📊 Generar Reporte Whatsapp'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
