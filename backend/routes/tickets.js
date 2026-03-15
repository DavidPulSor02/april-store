/**
 * tickets.js — Envío de tickets por correo
 * Usa nodemailer. Instalar: npm install nodemailer
 * Para producción usar: SendGrid, Resend, o Mailgun
 */
const router     = require('express').Router();
const auth       = require('../middleware/auth');
const { Venta, VentaItem } = require('../models');

// POST /api/tickets/:ventaId/email
router.post('/:ventaId/email', auth, async (req, res) => {
  const { email, nombre } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email requerido' });

  try {
    const venta = await Venta.findById(req.params.ventaId).populate('usuario_id', 'nombre');
    if (!venta) return res.status(404).json({ success: false, message: 'Venta no encontrada' });

    const items = await VentaItem.find({ venta_id: venta._id })
      .populate('producto_id', 'nombre precio_venta')
      .populate('colaborador_id', 'nombre');

    const html = buildTicketHTML(venta, items, nombre);

    // ── Nodemailer (configurar SMTP en .env) ──────────────
    let nodemailer;
    try { nodemailer = require('nodemailer'); } catch {
      // Si no está instalado, retornar el HTML para preview
      return res.json({ success: true, preview: true, html, message: 'Instala nodemailer para envío real' });
    }

    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
      port:   process.env.SMTP_PORT   || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

    await transporter.sendMail({
      from:    `"April Store" <${process.env.SMTP_USER || 'noreply@aprilstore.mx'}>`,
      to:      email,
      subject: `Tu ticket de compra — ${venta.folio}`,
      html,
    });

    res.json({ success: true, message: `Ticket enviado a ${email}` });
  } catch (err) {
    console.error('Error enviando ticket:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tickets/:ventaId/html — preview del ticket
router.get('/:ventaId/html', auth, async (req, res) => {
  const venta = await Venta.findById(req.params.ventaId).populate('usuario_id', 'nombre');
  if (!venta) return res.status(404).json({ success: false, message: 'No encontrada' });
  const items = await VentaItem.find({ venta_id: venta._id })
    .populate('producto_id', 'nombre precio_venta')
    .populate('colaborador_id', 'nombre');
  res.json({ success: true, html: buildTicketHTML(venta, items, '') });
});

function buildTicketHTML(venta, items, clienteNombre) {
  const fmt   = (n) => '$' + Number(n||0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
  const fmtDT = (d) => new Date(d).toLocaleString('es-MX', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const rows = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F5E8EB;font-size:14px;color:#1C1318">${i.producto_id?.nombre || '—'}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F5E8EB;font-size:14px;color:#9C8490;text-align:center">${i.cantidad}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F5E8EB;font-size:14px;color:#9C8490;text-align:right">${fmt(i.precio_unitario)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F5E8EB;font-size:14px;font-weight:500;text-align:right">${fmt(i.subtotal)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Ticket ${venta.folio} — April Store</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#FBF2F4;font-family:'DM Sans',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF2F4;padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #EFC5CD">

        <!-- Header -->
        <tr>
          <td style="background:#C8637A;padding:32px 40px;text-align:center">
            <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.25);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2z" fill="white"/><path d="M9 14c0-2.761 2.239-5 5-5s5 2.239 5 5-2.239 5-5 5-5-2.239-5-5z" fill="#C8637A"/></svg>
            </div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:600;color:#FFFFFF;letter-spacing:.5px">April Store</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:4px;letter-spacing:1px;text-transform:uppercase">Comprobante de compra</div>
          </td>
        </tr>

        <!-- Folio -->
        <tr>
          <td style="padding:28px 40px 0;text-align:center">
            <div style="font-size:12px;color:#9C8490;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Folio</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;color:#A84D62">${venta.folio}</div>
            <div style="font-size:13px;color:#9C8490;margin-top:4px">${fmtDT(venta.fecha)}</div>
          </td>
        </tr>

        ${clienteNombre ? `
        <tr>
          <td style="padding:12px 40px 0;text-align:center">
            <div style="font-size:14px;color:#5C4650">Gracias por tu compra, <strong>${clienteNombre}</strong></div>
          </td>
        </tr>` : ''}

        <!-- Items -->
        <tr>
          <td style="padding:24px 40px 0">
            <table width="100%" cellpadding="0" cellspacing="0">
              <thead>
                <tr style="border-bottom:2px solid #F5E8EB">
                  <th style="font-size:11px;color:#9C8490;font-weight:500;text-transform:uppercase;letter-spacing:.6px;padding-bottom:10px;text-align:left">Artículo</th>
                  <th style="font-size:11px;color:#9C8490;font-weight:500;text-transform:uppercase;letter-spacing:.6px;padding-bottom:10px;text-align:center">Cant.</th>
                  <th style="font-size:11px;color:#9C8490;font-weight:500;text-transform:uppercase;letter-spacing:.6px;padding-bottom:10px;text-align:right">Precio</th>
                  <th style="font-size:11px;color:#9C8490;font-weight:500;text-transform:uppercase;letter-spacing:.6px;padding-bottom:10px;text-align:right">Total</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </td>
        </tr>

        <!-- Totales -->
        <tr>
          <td style="padding:20px 40px">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${venta.descuento > 0 ? `
              <tr>
                <td style="font-size:13px;color:#9C8490;padding:4px 0">Subtotal</td>
                <td style="font-size:13px;color:#9C8490;text-align:right;padding:4px 0">$${Number(venta.subtotal).toLocaleString('es-MX',{minimumFractionDigits:2})}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4A8C6A;padding:4px 0">Descuento</td>
                <td style="font-size:13px;color:#4A8C6A;text-align:right;padding:4px 0">−$${Number(venta.descuento).toLocaleString('es-MX',{minimumFractionDigits:2})}</td>
              </tr>` : ''}
              <tr>
                <td colspan="2" style="padding:4px 0"><div style="height:1px;background:#F5E8EB"></div></td>
              </tr>
              <tr>
                <td style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:#1C1318;padding:8px 0">Total</td>
                <td style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:#C8637A;text-align:right;padding:8px 0">${fmt(venta.total)}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#9C8490;padding-bottom:4px">Método de pago</td>
                <td style="font-size:12px;color:#9C8490;text-align:right;padding-bottom:4px;text-transform:capitalize">${venta.metodo_pago}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#FBF2F4;padding:24px 40px;text-align:center;border-top:1px solid #EFC5CD">
            <div style="font-size:12px;color:#9C8490;line-height:1.7">
              Gracias por visitar <strong style="color:#A84D62">April Store</strong><br/>
              Para cambios o devoluciones presenta este comprobante<br/>
              <span style="color:#D4C8CC">·</span> accesorios únicos con amor <span style="color:#D4C8CC">·</span>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = router;
