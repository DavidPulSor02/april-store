import React, { useState, useEffect } from 'react';
import { Settings, Save, Printer, Store, ReceiptText, AlertCircle } from 'lucide-react';
import { Api } from '../services/api';

export default function Configuracion() {
  const [storeName, setStoreName] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Load local settings
    const savedName = localStorage.getItem('april_storeName') || 'April Store';
    const savedMsg = localStorage.getItem('april_ticketMessage') || 'Gracias por tu compra\nPara cambios presenta este ticket\n¡Vuelve pronto!';
    setStoreName(savedName);
    setTicketMessage(savedMsg);
  }, []);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem('april_storeName', storeName);
    localStorage.setItem('april_ticketMessage', ticketMessage);
    setTimeout(() => {
      setSaving(false);
      setSuccessMsg('Configuración guardada correctamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 600);
  };

  const printAllBarcodes = async () => {
    try {
      setLoading(true);
      const res = await Api.get('/productos');
      const productos = res.data?.data || [];
      const productosConSku = productos.filter(p => p.sku && p.estatus !== 'inactivo');

      if (!productosConSku.length) {
        alert('No hay productos activos con SKU para generar códigos.');
        setLoading(false);
        return;
      }

      const win = window.open('', '_blank');
      win.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Catálogo de Códigos de Barras</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'DM Sans', sans-serif; text-align: center; background: #fff; padding: 20px; color: #1C1318; }
            .header-print { margin-bottom: 30px; }
            .header-print h1 { font-size: 24px; color: #A84D62; margin: 0; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; }
            .card { border: 1px dashed #EFC5CD; padding: 16px 10px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; page-break-inside: avoid; }
            .title { font-size: 12px; font-weight: 500; margin-bottom: 8px; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #5C4650; }
            .price { font-size: 16px; font-weight: 600; margin-top: 8px; color: #1C1318; }
            svg { max-width: 100%; height: auto; }
            .btn-print { padding: 12px 24px; background: #9F1239; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
            .btn-print:hover { background: #881337; }
            @media print {
              .no-print { display: none !important; }
              .card { border: 1px solid #ccc; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print header-print">
            <button class="btn-print" onclick="window.print()">🖨️ Imprimir Códigos</button>
            <p style="color: #9C8490; font-size: 13px; margin-top: 10px;">Asegúrate de configurar los márgenes correctos en la ventana de impresión.</p>
          </div>
          <div class="header-print">
            <h1>Catálogo de Códigos de Barras</h1>
            <p style="font-size: 12px; color: #9C8490; margin-top: 4px;">Total de productos: ${productosConSku.length}</p>
          </div>
          <div class="grid">
            ${productosConSku.map(p => `
              <div class="card">
                <div class="title" title="${p.nombre}">${p.nombre}</div>
                <svg id="barcode-${p.sku}"></svg>
                <div class="price">$${p.precio_venta}</div>
              </div>
            `).join('')}
          </div>
          <script>
            ${productosConSku.map(p => `
              JsBarcode("#barcode-${p.sku}", "${p.sku}", {
                format: "CODE128",
                width: 1.8,
                height: 50,
                displayValue: true,
                fontSize: 14,
                font: "DM Sans",
                lineColor: "#1C1318",
                margin: 0
              });
            `).join('')}
            setTimeout(() => { window.print(); }, 1200);
          </script>
        </body>
        </html>
      `);
      win.document.close();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al obtener los productos para los códigos de barras.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-sub" style={{ marginTop: '4px' }}>Ajustes generales del sistema e impresión de reportes.</p>
        </div>
      </div>

      <div className="dash-grid-3">
        {/* Columna Izquierda: Ajustes Generales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tarjeta: Datos de la Tienda */}
          <div className="panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Store size={22} style={{ color: 'var(--rose)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)' }}>Identidad de la Tienda</h3>
            </div>
            
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--ink-mid)', marginBottom: '8px' }}>
                Nombre de la Tienda
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={storeName} 
                onChange={e => setStoreName(e.target.value)} 
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--ink-faint)' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--ink-mid)', marginBottom: '8px' }}>
                Mensaje al final del Ticket
              </label>
              <textarea 
                className="form-input" 
                rows="4"
                value={ticketMessage} 
                onChange={e => setTicketMessage(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--ink-faint)', resize: 'vertical' }}
              />
            </div>

            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Ajustes'}
            </button>
            {successMsg && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--success)', textAlign: 'center', fontWeight: '500' }}>
                {successMsg}
              </div>
            )}
          </div>

        </div>

        {/* Columna Derecha: Herramientas adicionales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Printer size={22} style={{ color: 'var(--rose)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)' }}>Impresión Masiva</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
              Genera un documento listo para imprimir con los códigos de barras de todos los productos activos en el inventario. Ideal para etiquetar físicamente los productos.
            </p>
            <button className="btn-ghost" onClick={printAllBarcodes} disabled={loading} style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--rose-light)', color: 'var(--rose-deep)' }}>
              <Printer size={16} /> {loading ? 'Cargando Productos...' : 'Generar PDF de Códigos'}
            </button>
          </div>

          <div className="panel" style={{ padding: '24px', background: 'var(--surface-2)', borderStyle: 'dashed' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertCircle size={20} style={{ color: 'var(--ink-muted)' }} />
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink-mid)' }}>Próximamente</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
              Se añadirán opciones para gestionar impuestos y métodos de pago personalizados en futuras actualizaciones.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
