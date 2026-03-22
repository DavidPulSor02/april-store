import { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { Search, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
  const [reportData, setReportData] = useState(null);
  const printRef = useRef(null);

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
      if (res && res.whatsappText) {
        setReportWhatsappText(res.whatsappText);
        setReportData(res);
      } else {
        alert('Respuesta inválida o sin datos al generar reporte');
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

  const metodosUnicos = [...new Set(ventas.map(v => v.metodo_pago))].filter(Boolean);

  const MetodoBadge = ({ m }) => {
    const map = { efectivo: 'badge-success', transferencia: 'badge-info', tarjeta: 'badge-rose', mixto: 'badge-warning' };
    return <span className={`badge ${map[m] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>{m}</span>;
  };

  const EstatusBadge = ({ e }) => {
    const map = { completada: 'badge-success', cancelada: 'badge-danger', pendiente: 'badge-warning' };
    return <span className={`badge ${map[e] || 'badge-neutral'}`}>{e || 'completada'}</span>;
  };

  const handleDownloadPDF = async () => {
    setTimeout(async () => {
      const element = printRef.current;
      if (!element) return;
      try {
        const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const canvasWidth = canvas.width / 3;
        const canvasHeight = canvas.height / 3;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvasWidth + 40, canvasHeight + 40] });
        pdf.addImage(imgData, 'JPEG', 20, 20, canvasWidth, canvasHeight);
        pdf.save(`Reporte_Ventas_AprilStore_${format(new Date(), 'ddMMyy')}.pdf`);
      } catch (err) {
        console.error("Error generando PDF: ", err);
        alert("Hubo un problema al generar el PDF.");
      }
    }, 500);
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
            {metodosUnicos.map(m => (
              <option key={m} value={m} style={{ textTransform: 'capitalize' }}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
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

              <h4 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                Artículos Vendidos
                <span style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 400 }}>Transparencia Contable</span>
              </h4>
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ background: 'var(--surface-2)' }}>
                    <tr>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-dark)' }}>Producto</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--ink-muted)' }}>Precio</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-muted)' }}>Pago Colab.</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>Utilidad Neta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventaActual.items && ventaActual.items.length > 0 ? (
                      ventaActual.items.map((it, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 500 }}>{it.producto_id?.nombre || 'Producto eliminado'}</div>
                            {it.colaborador_id ? (
                              <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>👤 {it.colaborador_id.nombre} ({it.porcentaje_comision}%)</div>
                            ) : (
                              <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>🏢 Propiedad Tienda (100%)</div>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--ink-mid)' }}>
                            {it.cantidad}x ${it.precio_unitario}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--ink-mid)' }}>
                            ${it.comision_colaborador?.toFixed(2) || '0.00'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--success-dark)', fontWeight: 600 }}>
                            ${it.comision_tienda?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      ))
                    ) : (
                       <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: 'var(--ink-muted)' }}>Sin detalles de artículos</td></tr>
                    )}
                  </tbody>
                  {ventaActual.items && ventaActual.items.length > 0 && (
                    <tfoot style={{ background: 'var(--surface-1)', borderTop: '2px dotted var(--border)' }}>
                      <tr>
                        <td colSpan="2" style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-muted)' }}>Gran Total Ingresos:</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-dark)' }}>
                          ${ventaActual.items.reduce((sum, i) => sum + (i.comision_colaborador || 0), 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: 'var(--success-dark)' }}>
                          ${ventaActual.items.reduce((sum, i) => sum + (i.comision_tienda || 0), 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
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
                    ¡Reporte Listo!<br/><span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--ink-muted)' }}>Elige cómo quieres enviarlo:</span>
                  </p>
                  
                  <button onClick={handleDownloadPDF} className="btn-primary" style={{ textAlign: 'center', background: '#e11d48', color: '#fff', border: 'none', padding: '12px', fontSize: '15px' }}>
                    <Download size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}/> Descargar como PDF Elegante
                  </button>

                  <a href={`https://wa.me/?text=${encodeURIComponent(reportWhatsappText)}`} target="_blank" rel="noreferrer" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none', background: '#25D366', color: '#fff', border: 'none', display: 'block', padding: '12px', fontSize: '15px' }}>
                    📲 Enviar Texto por WhatsApp
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
                  {sendingReport ? 'Generando...' : '📊 Generar Reporte'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recibo Oculto para Generación de PDF */}
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -9999, opacity: 0, pointerEvents: 'none' }}>
        {reportData && (
          <div ref={printRef} style={{ width: '380px', padding: '30px', background: '#ffffff', fontFamily: 'sans-serif', color: '#333' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ marginBottom: '10px' }}>
                 <svg width="40" height="40" viewBox="0 0 28 28" fill="none" style={{ margin: '0 auto' }}>
                    <path d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2z" fill="#E11D48"/>
                    <path d="M9 14c0-2.761 2.239-5 5-5s5 2.239 5-5-2.239 5-5 5-5-2.239-5-5z" fill="white"/>
                  </svg>
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', color: '#111' }}>April Store</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Resumen Contable de Ventas</p>
            </div>

            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Período Reportado</span>
              <div style={{ fontWeight: 600, fontSize: '15px', color: '#111', marginTop: '4px' }}>{reportData.etiquetaPeriodo}</div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Ingresos Brutos en Sistema</p>
              <h1 style={{ margin: 0, fontSize: '38px', color: '#E11D48' }}>${reportData.totalVentas?.toFixed(2)}</h1>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>{reportData.totalTransacciones} Transacciones procesadas</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', color: '#111', borderBottom: '1px solid #eee', paddingBottom: '8px', margin: '0 0 12px 0' }}>Desglose por Flujo</h3>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <tbody>
                  {Object.entries(reportData.desglose).map(([metodo, monto]) => (
                    <tr key={metodo}>
                      <td style={{ padding: '6px 0', color: '#666', textTransform: 'capitalize' }}>💳 {metodo}:</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>${monto?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '11px', color: '#999' }}>
               <p style={{ margin: '0 0 4px' }}>Emitido el {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
               <p style={{ margin: 0 }}>Documento Financiero Interno</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
