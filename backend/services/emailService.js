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

module.exports = { enviarReporteCaja };
