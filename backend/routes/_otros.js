// ── CONSIGNACIONES ────────────────────────────────────────
const cRouter = require('express').Router();
const auth    = require('../middleware/auth');
const { Consignacion, Producto } = require('../models');

cRouter.get('/', auth, async (req, res) => {
  const { colaborador_id, estatus } = req.query;
  const filter = {};
  if (colaborador_id) filter.colaborador_id = colaborador_id;
  if (estatus)        filter.estatus        = estatus;
  const data = await Consignacion.find(filter)
    .populate('colaborador_id', 'nombre')
    .populate('producto_id', 'nombre precio_venta stock_actual')
    .sort({ fecha_ingreso: -1 });
  res.json({ success: true, data });
});

cRouter.post('/', auth, async (req, res) => {
  const c = await Consignacion.create({ ...req.body, cantidad_disponible: req.body.cantidad_ingresada });
  // Incrementar stock del producto
  await Producto.findByIdAndUpdate(req.body.producto_id, { $inc: { stock_actual: req.body.cantidad_ingresada } });
  res.status(201).json({ success: true, data: c });
});

cRouter.put('/:id', auth, async (req, res) => {
  const c = await Consignacion.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: c });
});

module.exports.consignaciones = cRouter;

// ── PAGOS A COLABORADORES ─────────────────────────────────
const pRouter = require('express').Router();
const { PagoColaborador, MovimientoContable } = require('../models');

pRouter.get('/', auth, async (req, res) => {
  const { filterEstatus } = req.query; // Puede ser que reciba filterEstatus o estatus

  // Función para obtener deuda pendiente de todos los colaboradores
  const { Colaborador, VentaItem, PagoColaborador } = require('../models');
  
  const colaboradores = await Colaborador.find({ estatus: 'activo' });
  const pagosReales = await PagoColaborador.find()
    .populate('colaborador_id', 'nombre')
    .populate('usuario_id', 'nombre')
    .sort({ creado_en: -1 });

  const virtuales = [];
  
  // Calcular deuda dinámica por colaborador
  for (let c of colaboradores) {
    const items = await VentaItem.find({ colaborador_id: c._id }).populate({ path: 'venta_id', match: { estatus: 'completada' } });
    const filtrados = items.filter(i => i.venta_id);
    
    let comisionesTotales = 0;
    filtrados.forEach(i => comisionesTotales += i.comision_colaborador);
    
    let pagosPreviosTotales = 0;
    const historialPagos = pagosReales.filter(p => p.colaborador_id?._id?.toString() === c._id.toString() && p.estatus === 'pagado');
    historialPagos.forEach(p => pagosPreviosTotales += p.monto);
    
    let saldoPendiente = +(comisionesTotales - pagosPreviosTotales).toFixed(2);
    
    if (saldoPendiente > 0) {
      virtuales.push({
        _id: `v_${c._id}_${saldoPendiente}`, // Virtual ID string
        colaborador_id: { _id: c._id, nombre: c.nombre },
        monto: saldoPendiente,
        estatus: 'pendiente',
        periodo_inicio: Date.now(), // Podría ser el inicio del registro, pero se enviará así por UX
        periodo_fin: Date.now()
      });
    }
  }

  // Combinar reales (pagados históricos) y virtuales (pendientes actuales)
  const realesPagados = pagosReales.filter(p => p.estatus === 'pagado');
  const todos = [...virtuales, ...realesPagados];

  res.json({ success: true, data: todos });
});

pRouter.post('/', auth, async (req, res) => {
  const pago = await PagoColaborador.create({ ...req.body, usuario_id: req.usuario.id });
  await MovimientoContable.create({
    usuario_id:        req.usuario.id,
    referencia_id:     pago._id,
    referencia_modelo: 'PagoColaborador',
    tipo:              'egreso',
    concepto:          `Pago a colaborador`,
    categoria_contable:'pago_colaborador',
    monto:             pago.monto,
    saldo_resultante:  0,
    fecha:             new Date(),
  });
  res.status(201).json({ success: true, data: pago });
});

pRouter.post('/:id/liquidar', auth, async (req, res) => {
  // Soporte para Liquidar un recibo virtual "v_colabId_monto"
  if (req.params.id.startsWith('v_')) {
    const partes = req.params.id.split('_');
    const colabId = partes[1];
    const monto = parseFloat(partes[2]);
    
    // Generar el recibo real pagado
    const p = await PagoColaborador.create({
      colaborador_id: colabId,
      usuario_id: req.usuario.id,
      monto: monto,
      periodo_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Por defecto inicio de mes actual
      periodo_fin: new Date(),
      metodo_pago: 'efectivo',
      estatus: 'pagado',
      fecha_pago: new Date()
    });

    // Registrar egreso en contabilidad de la tienda
    await MovimientoContable.create({
      usuario_id: req.usuario.id,
      referencia_id: p._id,
      referencia_modelo: 'PagoColaborador',
      tipo: 'egreso',
      concepto: 'Liquidación a colaboradora',
      categoria_contable: 'pago_colaborador',
      monto: monto,
      saldo_resultante: 0,
      fecha: new Date(),
    });

    const populated = await PagoColaborador.findById(p._id).populate('colaborador_id', 'nombre');
    return res.json({ success: true, data: populated });
  }

  // Comportamiento normal de liquidación y para backwards compatibility
  const p = await PagoColaborador.findByIdAndUpdate(
    req.params.id,
    { estatus: 'pagado', fecha_pago: new Date(), ...req.body },
    { new: true }
  ).populate('colaborador_id', 'nombre');
  res.json({ success: true, data: p });
});

// Alias PATCH por precaución
pRouter.patch('/:id/liquidar', auth, async (req, res) => {
  const p = await PagoColaborador.findByIdAndUpdate(req.params.id, { estatus: 'pagado', fecha_pago: new Date() });
  res.json({ success: true, data: p });
});

module.exports.pagos = pRouter;

// ── CONTABILIDAD ──────────────────────────────────────────
const ctRouter = require('express').Router();

ctRouter.get('/', auth, async (req, res) => {
  const { desde, hasta, tipo, categoria } = req.query;
  const filter = {};
  if (tipo)      filter.tipo              = tipo;
  if (categoria) filter.categoria_contable = categoria;
  if (desde || hasta) {
    filter.fecha = {};
    if (desde) filter.fecha.$gte = new Date(desde);
    if (hasta) filter.fecha.$lte = new Date(hasta);
  }
  const data = await MovimientoContable.find(filter)
    .populate('usuario_id', 'nombre')
    .sort({ fecha: -1 })
    .limit(200);
  res.json({ success: true, data });
});

ctRouter.post('/', auth, async (req, res) => {
  const data = { ...req.body, usuario_id: req.usuario.id };
  if (data.saldo_resultante === undefined) data.saldo_resultante = 0;
  const m = await MovimientoContable.create(data);
  res.status(201).json({ success: true, data: m });
});

ctRouter.get('/resumen', auth, async (req, res) => {
  const inicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const fin    = new Date();

  const [ingresos, egresos] = await Promise.all([
    MovimientoContable.aggregate([
      { $match: { tipo: 'ingreso', fecha: { $gte: inicio, $lte: fin } } },
      { $group: { _id: null, total: { $sum: '$monto' } } }
    ]),
    MovimientoContable.aggregate([
      { $match: { tipo: 'egreso', fecha: { $gte: inicio, $lte: fin } } },
      { $group: { _id: null, total: { $sum: '$monto' } } }
    ]),
  ]);

  const totalIngresos = ingresos[0]?.total || 0;
  const totalEgresos  = egresos[0]?.total  || 0;

  res.json({ success: true, data: {
    ingresos: totalIngresos,
    egresos:  totalEgresos,
    balance:  totalIngresos - totalEgresos,
    periodo:  { inicio, fin },
  }});
});

module.exports.contabilidad = ctRouter;

// ── DASHBOARD ─────────────────────────────────────────────
const dRouter = require('express').Router();
const { Venta, VentaItem, Colaborador, Producto: Prod } = require('../models');

dRouter.get('/resumen', auth, async (req, res) => {
  const hoy    = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const ayer   = new Date(hoy); ayer.setDate(ayer.getDate() - 1);

  const [ventasMes, ventasHoy, productosActivos, colaboradoresActivos, stockBajo] = await Promise.all([
    Venta.aggregate([
      { $match: { estatus: 'completada', fecha: { $gte: inicio } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]),
    Venta.aggregate([
      { $match: { estatus: 'completada', fecha: { $gte: new Date(hoy.toDateString()) } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]),
    Prod.countDocuments({ estatus: 'activo' }),
    Colaborador.countDocuments({ estatus: 'activo' }),
    Prod.countDocuments({ estatus: 'activo', $expr: { $lte: ['$stock_actual', '$stock_minimo'] } }),
  ]);

  // Ventas por día (últimos 8 días)
  const ultimos8 = await Venta.aggregate([
    { $match: { estatus: 'completada', fecha: { $gte: new Date(Date.now() - 7*24*3600000) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$fecha' } }, total: { $sum: '$total' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  // Top colaboradores del mes
  const topColabs = await VentaItem.aggregate([
    { $lookup: { from: 'ventas', localField: 'venta_id', foreignField: '_id', as: 'venta' } },
    { $unwind: '$venta' },
    { $match: { 'venta.estatus': 'completada', 'venta.fecha': { $gte: inicio }, colaborador_id: { $ne: null } } },
    { $group: { _id: '$colaborador_id', total: { $sum: '$subtotal' }, piezas: { $sum: '$cantidad' }, comision: { $sum: '$comision_colaborador' } } },
    { $sort: { total: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'colaboradors', localField: '_id', foreignField: '_id', as: 'colaborador' } },
    { $unwind: '$colaborador' },
  ]);

  res.json({ success: true, data: {
    ventas_mes:   { total: ventasMes[0]?.total || 0, count: ventasMes[0]?.count || 0 },
    ventas_hoy:   { total: ventasHoy[0]?.total || 0, count: ventasHoy[0]?.count || 0 },
    productos_activos:    productosActivos,
    colaboradores_activos:colaboradoresActivos,
    alertas_stock:         stockBajo,
    grafica_dias:         ultimos8,
    top_colaboradores:    topColabs,
  }});
});

module.exports.dashboard = dRouter;
