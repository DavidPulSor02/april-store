const router = require('express').Router();
const auth   = require('../middleware/auth');
const { Caja, Usuario } = require('../models');
const { enviarReporteCaja } = require('../services/emailService');

// GET /api/caja/estado - Ver si hay caja abierta para el usuario actual
router.get('/estado', auth, async (req, res) => {
  try {
    const caja = await Caja.findOne({ usuario_id: req.usuario.id, estatus: 'abierta' });
    res.json({ success: true, caja });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/caja/abrir - Abrir nueva sesión de caja
router.post('/abrir', auth, async (req, res) => {
  try {
    const existe = await Caja.findOne({ usuario_id: req.usuario.id, estatus: 'abierta' });
    if (existe) return res.status(400).json({ success: false, message: 'Ya tienes una caja abierta' });

    const { monto_apertura, notas } = req.body;
    const caja = await Caja.create({
      usuario_id: req.usuario.id,
      monto_apertura,
      notas
    });

    res.status(201).json({ success: true, caja });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/caja/cerrar - Cerrar sesión de caja
router.post('/cerrar', auth, async (req, res) => {
  try {
    const caja = await Caja.findOne({ usuario_id: req.usuario.id, estatus: 'abierta' });
    if (!caja) return res.status(400).json({ success: false, message: 'No hay caja abierta para cerrar' });

    const { monto_cierre, ventas_totales, notas } = req.body;
    
    caja.monto_cierre = monto_cierre;
    caja.ventas_totales = ventas_totales;
    caja.notas = (caja.notas ? caja.notas + ' | ' : '') + (notas || '');
    caja.fecha_cierre = new Date();
    caja.estatus = 'cerrada';
    
    await caja.save();

    // Enviar reporte por correo (sin bloquear la respuesta)
    const user = await Usuario.findById(req.usuario.id);
    enviarReporteCaja({
      usuario: user?.nombre || 'Desconocido',
      ...caja.toObject()
    }).catch(e => console.error('Error enviando reporte:', e));

    res.json({ success: true, caja });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
