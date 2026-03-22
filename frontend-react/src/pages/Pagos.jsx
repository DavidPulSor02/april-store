import { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { Search, DollarSign, CheckCircle, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstatus, setFilterEstatus] = useState('');
  const [selectedPago, setSelectedPago] = useState(null);
  const printRef = useRef(null);

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

  const liquidarPago = async (pagoId) => {
    if (!(await window.appConfirm('¿Confirmas que este pago ha sido transferido o entregado en efectivo?'))) return;
    try {
      await Api.post(`/pagos/${pagoId}/liquidar`);
      fetchData();
    } catch (error) {
      alert(error.message || 'Error al liquidar pago');
    }
  };

  const handleDownloadPDF = async (pago) => {
    setSelectedPago(pago);
    
    // Dar un momento para que React renderice el comprobante
    setTimeout(async () => {
      const element = printRef.current;
      if (!element) return;

      try {
        const canvas = await html2canvas(element, {
          scale: 3, // Muy alta resolución
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        
        // Pesar menos con JPEG
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Crear PDF ajustado exactamente al tamaño del comprobante
        const canvasWidth = canvas.width / 3;
        const canvasHeight = canvas.height / 3;

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvasWidth + 40, canvasHeight + 40] // +40px de padding visual en el PDF
        });

        // Centrar imagen en el PDF
        pdf.addImage(imgData, 'JPEG', 20, 20, canvasWidth, canvasHeight);
        
        const fileName = `Comprobante_AprilStore_${pago.colaborador_id?.nombre.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyy')}.pdf`;
        pdf.save(fileName);
      } catch (err) {
        console.error("Error generando PDF: ", err);
        alert("Hubo un problema al generar el recibo.");
      } finally {
        setSelectedPago(null); 
      }
    }, 500); // 500ms asegura que las fuentes e iconos SVG carguen bien
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
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: 'var(--success)', fontSize: '12px', fontWeight: 600 }}>Completado</span>
                          <button className="btn-ghost" style={{ fontSize: '11px', padding: '4px 8px', color: 'var(--ink)' }} onClick={() => handleDownloadPDF(p)}>
                            <Download size={12} style={{ marginRight: '4px' }} /> PDF
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recibo Oculto para Generación de PDF */}
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -9999, opacity: 0, pointerEvents: 'none' }}>
        {selectedPago && (
          <div ref={printRef} style={{ width: '380px', padding: '30px', background: '#ffffff', fontFamily: 'sans-serif', color: '#333' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ marginBottom: '10px' }}>
                 <svg width="40" height="40" viewBox="0 0 28 28" fill="none" style={{ margin: '0 auto' }}>
                    <path d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2z" fill="#E11D48"/>
                    <path d="M9 14c0-2.761 2.239-5 5-5s5 2.239 5-5-2.239 5-5 5-5-2.239-5-5z" fill="white"/>
                  </svg>
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', color: '#111' }}>April Store</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Comprobante de Pago a Colaboradora</p>
            </div>

            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#666' }}>Fecha de Emisión:</td>
                    <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 500 }}>{format(new Date(), 'dd/MM/yyyy HH:mm')}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#666' }}>Estado:</td>
                    <td style={{ padding: '4px 0', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>LIQUIDADO</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', color: '#111', borderBottom: '1px solid #eee', paddingBottom: '8px', margin: '0 0 12px 0' }}>Detalles del Pago</h3>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 0', color: '#666' }}>Colaboradora:</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>{selectedPago.colaborador_id?.nombre}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: '#666' }}>Periodo de Venta:</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontSize: '13px' }}>
                      {selectedPago.periodo_inicio ? format(new Date(selectedPago.periodo_inicio), 'dd/MM/yy') : '-'} al {selectedPago.periodo_fin ? format(new Date(selectedPago.periodo_fin), 'dd/MM/yy') : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '2px dashed #eee' }}>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Monto Total Transferido</p>
              <h1 style={{ margin: 0, fontSize: '32px', color: '#E11D48' }}>${selectedPago.monto?.toFixed(2)}</h1>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '11px', color: '#999' }}>
               <p style={{ margin: '0 0 4px' }}>Este documento es un comprobante de liquidación interna.</p>
               <p style={{ margin: 0 }}>¡Gracias por colaborar con April Store!</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
