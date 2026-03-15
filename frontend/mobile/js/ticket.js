/**
 * ticket.js — Generación de ticket, impresión y envío por correo
 */

// ── Renderizar ticket preview (mini) ─────────────────────
function renderTicketPreview(cart, sub, desc, total, metodo, folio) {
  const rows = cart.map(i => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F5E8EB;font-size:12px">
      <span style="color:#1C1318;flex:1">${i.producto.nombre} <span style="color:#9C8490">×${i.qty}</span></span>
      <span style="font-weight:500;color:#A84D62;white-space:nowrap;margin-left:12px">${fmt(i.producto.precio_venta * i.qty)}</span>
    </div>`).join('');

  const discountRow = desc > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#4A8C6A">
      <span>Descuento</span><span>−${fmt(desc)}</span>
    </div>` : '';

  document.getElementById('ticket-preview').innerHTML = `
    <div style="padding:14px 16px;font-family:'DM Sans',sans-serif">
      <div style="text-align:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #F5E8EB">
        <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:600;color:#A84D62">April Store</div>
        <div style="font-size:11px;color:#9C8490;margin-top:2px">${folio} · ${new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'})}</div>
      </div>
      ${rows}
      ${discountRow}
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #EFC5CD;margin-top:6px">
        <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500">Total</span>
        <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:600;color:#C8637A">${fmt(total)}</span>
      </div>
      <div style="text-align:center;font-size:10px;color:#9C8490;margin-top:8px;text-transform:capitalize">Pago: ${metodo}</div>
    </div>`;
}

// ── Imprimir ticket completo ──────────────────────────────
function imprimirTicket() {
  const cart    = POS.cart;
  const {sub, desc, total} = recalcTotals();
  const folio   = POS.folio;
  const metodo  = POS.metodo;
  const fecha   = new Date();

  const rows = cart.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F5E8EB;font-size:14px;color:#1C1318">${i.producto.nombre}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F5E8EB;font-size:14px;color:#9C8490;text-align:center">${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F5E8EB;font-size:14px;color:#9C8490;text-align:right">${fmt(i.producto.precio_venta)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F5E8EB;font-size:14px;font-weight:500;text-align:right">${fmt(i.producto.precio_venta * i.qty)}</td>
    </tr>`).join('');

  const html = buildFullTicketHTML({ folio, fecha, metodo, sub, desc, total, rows });

  const win = window.open('', '_blank', 'width=420,height=700');
  if (!win) { iToast('Activa las ventanas emergentes para imprimir', 'error'); return; }

  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 300);
  };

  iToast('Abriendo diálogo de impresión…');
}

// ── Construir HTML del ticket completo ────────────────────
function buildFullTicketHTML({ folio, fecha, metodo, sub, desc, total, rows }) {
  const fmtDT = (d) => new Date(d).toLocaleString('es-MX', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Ticket ${folio}</title>
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
    <div class="brand">April Store</div>
    <div class="tagline">accesorios únicos con amor</div>
    <div class="folio">Folio: <strong>${folio}</strong></div>
    <div class="fecha">${fmtDT(fecha)}</div>
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
    ${desc > 0 ? `
    <div class="totales-row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
    <div class="totales-row" style="color:#4A8C6A"><span>Descuento</span><span>−${fmt(desc)}</span></div>` : ''}
    <div class="total-row">
      <span class="total-label">Total</span>
      <span class="total-val">${fmt(total)}</span>
    </div>
    <div class="metodo">Pago: ${metodo}</div>
  </div>

  <div class="footer">
    Gracias por tu compra<br/>
    Para cambios presenta este ticket<br/>
    <strong style="color:#A84D62">April Store</strong> — ¡Vuelve pronto!
  </div>
</body>
</html>`;
}

// ── Email modal ───────────────────────────────────────────
function openEmailModal() {
  document.getElementById('email-folio-ref').textContent = POS.folio;
  document.getElementById('email-nombre').value   = '';
  document.getElementById('email-destino').value  = '';
  document.getElementById('email-modal').classList.remove('hidden');
}

function closeEmailModal() {
  document.getElementById('email-modal').classList.add('hidden');
}

async function enviarTicketEmail() {
  const email  = document.getElementById('email-destino').value.trim();
  const nombre = document.getElementById('email-nombre').value.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    iToast('Ingresa un correo electrónico válido', 'error');
    return;
  }

  const btn = document.querySelector('#email-modal .cobro-confirm');
  btn.textContent = 'Enviando…';
  btn.disabled    = true;

  try {
    // Si tenemos el ID de venta real, usamos la API del backend
    if (POS.ventaId) {
      await fetch(`/api/tickets/${POS.ventaId}/email`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body:    JSON.stringify({ email, nombre }),
      });
    } else {
      // Modo demo — simular envío
      await new Promise(r => setTimeout(r, 1200));
    }

    closeEmailModal();
    iToast(`Ticket enviado a ${email}`, 'success');
  } catch (err) {
    iToast('Error al enviar el correo', 'error');
  }

  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Enviar ticket';
  btn.disabled  = false;
}
