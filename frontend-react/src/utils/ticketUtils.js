import { Api } from '../services/api';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount || 0);
};

export const formatDate = (dateString, includeTime = true) => {
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return new Date(dateString || new Date()).toLocaleDateString('es-MX', options);
};

export const printTicket = (ventaData) => {
  const { folio, fecha, metodo_pago, total, items = [], descuento = 0 } = ventaData;
  const subtotal = items.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);

  const rows = items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F5E8EB;font-size:14px;color:#1C1318">${item.producto_id?.nombre || 'Producto M.'}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F5E8EB;font-size:14px;color:#9C8490;text-align:center">${item.cantidad}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F5E8EB;font-size:14px;color:#9C8490;text-align:right">${formatCurrency(item.precio_unitario)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F5E8EB;font-size:14px;font-weight:500;text-align:right">${formatCurrency(item.precio_unitario * item.cantidad)}</td>
    </tr>
  `).join('');

  const storeName = localStorage.getItem('april_storeName') || 'April Store';
  const savedMsg = localStorage.getItem('april_ticketMessage') || 'Gracias por tu compra\\nPara cambios presenta este ticket\\n¡Vuelve pronto!';
  const footerMessageHtml = savedMsg.split('\\n').map((line, idx, arr) => {
    if (idx === arr.length - 1) return `<strong style="color:#A84D62">${storeName}</strong> — ${line}`;
    return line + '<br/>';
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Ticket ${folio || 'VTA-PROV'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', sans-serif;
      color: #1C1318;
      background: #fff;
      width: 80mm;
      min-width: 80mm;
      max-width: 80mm;
      padding: 6mm 5mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media screen {
      body { width: 380px; max-width: 380px; margin: 20px auto; box-shadow: 0 4px 20px rgba(0,0,0,.1); padding: 20px; }
    }
    .header { text-align: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed #EFC5CD; }
    .logo-circle { width: 40px; height: 40px; background: #C8637A; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; }
    .brand { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #A84D62; }
    .tagline { font-size: 10px; color: #9C8490; letter-spacing: .5px; margin-top: 2px; }
    .folio { font-size: 11px; color: #9C8490; margin-top: 8px; }
    .fecha { font-size: 10px; color: #9C8490; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th { font-size: 9px; color: #9C8490; text-transform: uppercase; letter-spacing: .5px; padding: 0 0 6px; text-align: left; border-bottom: 1px solid #F5E8EB; }
    th:last-child { text-align: right; }
    td { font-size: 12px; padding: 7px 0; border-bottom: 1px solid #F5E8EB; vertical-align: top; }
    td:nth-child(2), td:nth-child(3) { text-align: center; color: #9C8490; }
    td:last-child { text-align: right; font-weight: 500; }
    .totales { margin-top: 6px; }
    .totales-row { display: flex; justify-content: space-between; font-size: 12px; color: #5C4650; padding: 3px 0; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0 4px; border-top: 1px solid #EFC5CD; margin-top: 4px; }
    .total-label { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 500; }
    .total-val   { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: #C8637A; }
    .metodo { font-size: 10px; color: #9C8490; text-align: right; padding-top: 2px; text-transform: capitalize; }
    .footer { margin-top: 14px; padding-top: 10px; border-top: 1px dashed #EFC5CD; text-align: center; font-size: 10px; color: #9C8490; line-height: 1.7; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-circle">
      <svg width="18" height="18" viewBox="0 0 28 28" fill="none"><path d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2z" fill="white"/><path d="M9 14c0-2.761 2.239-5 5-5s5 2.239 5 5-2.239 5-5 5-5-2.239-5-5z" fill="#C8637A"/></svg>
    </div>
    <div class="brand">${storeName}</div>
    <div class="tagline">accesorios únicos con amor</div>
    <div class="folio">Folio: <strong>${folio || 'PENDIENTE'}</strong></div>
    <div class="fecha">${formatDate(fecha || new Date())}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Artículo</th>
        <th style="text-align:center">Cant.</th>
        <th style="text-align:center">P.U.</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totales">
    ${descuento > 0 ? `
    <div class="totales-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
    <div class="totales-row" style="color:#4A8C6A"><span>Descuento</span><span>−${formatCurrency(descuento)}</span></div>` : ''}
    <div class="total-row">
      <span class="total-label">Total</span>
      <span class="total-val">${formatCurrency(total)}</span>
    </div>
    <div class="metodo">Pago: ${metodo_pago || 'efectivo'}</div>
  </div>

  <div class="footer">
    ${footerMessageHtml}
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=420,height=700');
  if (!win) {
    alert('Activa las ventanas emergentes para imprimir');
    return;
  }

  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 300);
  };
};

export const sendTicketEmail = async (ventaId, email) => {
  if (!ventaId || !email) throw new Error("Datos inválidos para enviar el recibo.");
  
  return await Api.post(`/tickets/${ventaId}/email`, { email });
};
