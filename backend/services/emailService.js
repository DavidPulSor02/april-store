const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Enviar reporte de cierre de caja por correo
 */
async function enviarReporteCaja(datosCaja, destinatario = 'vichopulidosorcia433@gmail.com') {
  const { usuario, monto_apertura, monto_cierre, ventas_totales, fecha_apertura, fecha_cierre, notas } = datosCaja;
  
  const diferencia = (monto_cierre - (monto_apertura + ventas_totales)).toFixed(2);
  const statusDiferencia = diferencia == 0 ? 'Balanceado' : diferencia > 0 ? 'Sobrante' : 'Faltante';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #4A8C6A; border-bottom: 2px solid #4A8C6A; padding-bottom: 10px;">Reporte de Cierre de Caja - April Store</h2>
      <p>Se ha registrado un nuevo cierre de caja con los siguientes detalles:</p>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Colaboradora:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${usuario}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Fecha Apertura:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(fecha_apertura).toLocaleString('es-MX')}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Fecha Cierre:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(fecha_cierre).toLocaleString('es-MX')}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Monto Inicial:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">$${monto_apertura.toLocaleString('es-MX')}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Ventas Registradas:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">$${ventas_totales.toLocaleString('es-MX')}</td></tr>
        <tr style="background: #f9f9f9;"><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Efectivo en Caja:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">$${monto_cierre.toLocaleString('es-MX')}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Diferencia:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${diferencia < 0 ? '#B84545' : '#4A8C6A'}"><strong>$${diferencia} (${statusDiferencia})</strong></td></tr>
      </table>

      ${notas ? `<p style="margin-top: 20px; font-style: italic; color: #666;"><strong>Notas:</strong> ${notas}</p>` : ''}

      <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
        Este es un correo automático generado por el sistema April Store.
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"April Store Bot" <${process.env.SMTP_USER}>`,
      to: destinatario,
      subject: `Cierre de Caja - ${usuario} - ${new Date().toLocaleDateString('es-MX')}`,
      html: html,
    });
    console.log(`✅ Reporte de caja enviado a ${destinatario}`);
  } catch (error) {
    console.error('❌ Error enviando correo de cierre:', error);
  }
}

/**
 * Enviar reporte de ventas por correo
 */
async function enviarReporteVentas(datosReporte, etiquetaPeriodo, destinatario = 'davidpulsor2002@icloud.com') {
  const { total_ventas, num_ventas, total_efectivo, total_tarjeta, total_transferencia } = datosReporte;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #9F1239; margin: 0;">Reporte de Ventas</h2>
        <p style="color: #666; margin: 5px 0 0 0;">April Store</p>
      </div>
      
      <p>A continuación se detalla el resumen de ventas correspondiente al periodo: <strong>${etiquetaPeriodo}</strong></p>
      
      <div style="background: #FDF2F8; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; border: 1px solid #FCE7F3;">
        <p style="margin: 0 0 5px 0; color: #be185d; font-size: 14px; text-transform: uppercase; font-weight: bold;">Ingresos Totales</p>
        <h3 style="margin: 0; color: #881337; font-size: 32px;">$${Number(total_ventas || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</h3>
        <p style="margin: 8px 0 0 0; color: #9F1239; font-size: 13px;">Total de transacciones procesadas: <strong>${num_ventas}</strong></p>
      </div>

      <h4 style="color: #475569; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Desglose por Método de Pago</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr><td style="padding: 10px 8px; border-bottom: 1px solid #eee;">💵 <strong>Efectivo:</strong></td><td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(total_efectivo || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</td></tr>
        <tr><td style="padding: 10px 8px; border-bottom: 1px solid #eee;">💳 <strong>Tarjeta:</strong></td><td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(total_tarjeta || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</td></tr>
        <tr><td style="padding: 10px 8px; border-bottom: 1px solid #eee;">🏦 <strong>Transferencia:</strong></td><td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(total_transferencia || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</td></tr>
      </table>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #94A3B8; text-align: center;">
        Este es un reporte oficial automatizado del sistema de gestión April Store.
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"April Store Bot" <${process.env.SMTP_USER}>`,
      to: destinatario,
      subject: `📊 Reporte de Ventas - ${etiquetaPeriodo}`,
      html: html,
    });
    console.log(`✅ Reporte de ventas enviado a ${destinatario}`);
  } catch (error) {
    console.error('❌ Error enviando correo de reporte de ventas:', error);
    throw error;
  }
}

module.exports = { enviarReporteCaja, enviarReporteVentas };
