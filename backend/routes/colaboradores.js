const router = require('express').Router();
const auth   = require('../middleware/auth');
const { Colaborador, VentaItem, PagoColaborador } = require('../models');

// GET /api/colaboradores
router.get('/', auth, async (req, res) => {
  const { estatus, q } = req.query;
  const filter = {};
  if (estatus) filter.estatus = estatus;
  if (q) filter.nombre = { $regex: q, $options: 'i' };

  const colaboradores = await Colaborador.find(filter).sort({ nombre: 1 });
  res.json({ success: true, data: colaboradores });
});

// GET /api/colaboradores/:id
router.get('/:id', auth, async (req, res) => {
  const c = await Colaborador.findById(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'No encontrado' });
  res.json({ success: true, data: c });
});

// GET /api/colaboradores/:id/resumen — ventas y comisiones del mes
router.get('/:id/resumen', auth, async (req, res) => {
  const { inicio, fin } = req.query;
  const fechaInicio = inicio ? new Date(inicio) : new Date(new Date().setDate(1));
  const fechaFin    = fin    ? new Date(fin)    : new Date();

  const items = await VentaItem.find({ colaborador_id: req.params.id })
    .populate({ path: 'venta_id', match: { fecha: { $gte: fechaInicio, $lte: fechaFin }, estatus: 'completada' } });

  const filtrados = items.filter(i => i.venta_id);
  const resumen   = filtrados.reduce((acc, i) => {
    acc.total_ventas       += i.subtotal;
    acc.comision_colaborador += i.comision_colaborador;
    acc.comision_tienda    += i.comision_tienda;
    acc.piezas_vendidas    += i.cantidad;
    return acc;
  }, { total_ventas: 0, comision_colaborador: 0, comision_tienda: 0, piezas_vendidas: 0 });

  const pagado = await PagoColaborador.aggregate([
    { $match: { colaborador_id: require('mongoose').Types.ObjectId.createFromHexString(req.params.id), estatus: 'pagado', fecha_pago: { $gte: fechaInicio, $lte: fechaFin } } },
    { $group: { _id: null, total: { $sum: '$monto' } } }
  ]);

  resumen.monto_pagado  = pagado[0]?.total || 0;
  resumen.saldo_pendiente = resumen.comision_colaborador - resumen.monto_pagado;

  res.json({ success: true, data: resumen });
});

// POST /api/colaboradores
router.post('/', auth, async (req, res) => {
  const c = await Colaborador.create(req.body);
  res.status(201).json({ success: true, data: c });
});

// PUT /api/colaboradores/:id
router.put('/:id', auth, async (req, res) => {
  const c = await Colaborador.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!c) return res.status(404).json({ success: false, message: 'No encontrado' });
  res.json({ success: true, data: c });
});

// DELETE /api/colaboradores/:id (soft delete)
router.delete('/:id', auth, async (req, res) => {
  await Colaborador.findByIdAndUpdate(req.params.id, { estatus: 'inactivo' });
  res.json({ success: true, message: 'Colaborador desactivado' });
});

module.exports = router;
