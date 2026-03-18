const router = require('express').Router();
const auth   = require('../middleware/auth');
const { Producto } = require('../models');

// GET /api/productos?tipo=&estatus=&colaborador_id=&q=&stock_bajo=true
router.get('/', auth, async (req, res) => {
  const { tipo, estatus, colaborador_id, q, stock_bajo, categoria_id } = req.query;
  const filter = {};
  if (tipo)           filter.tipo           = tipo;
  if (estatus)        filter.estatus        = estatus;
  if (colaborador_id) filter.colaborador_id = colaborador_id;
  if (categoria_id)   filter.categoria_id   = categoria_id;
  if (q)              filter.nombre         = { $regex: q, $options: 'i' };
  if (stock_bajo === 'true') filter.$expr  = { $lte: ['$stock_actual', '$stock_minimo'] };

  const productos = await Producto.find(filter)
    .populate('colaborador_id', 'nombre')
    .populate('categoria_id', 'nombre')
    .sort({ creado_en: -1 });

  res.json({ success: true, data: productos, total: productos.length });
});

// GET /api/productos/alertas
router.get('/alertas', auth, async (req, res) => {
  const alertas = await Producto.find({
    estatus: 'activo',
    $expr: { $lte: ['$stock_actual', '$stock_minimo'] }
  }).populate('colaborador_id', 'nombre').populate('categoria_id', 'nombre');
  res.json({ success: true, data: alertas });
});

// GET /api/productos/:id
router.get('/:id', auth, async (req, res) => {
  const p = await Producto.findById(req.params.id)
    .populate('colaborador_id', 'nombre porcentaje_comision')
    .populate('categoria_id', 'nombre');
  if (!p) return res.status(404).json({ success: false, message: 'No encontrado' });
  res.json({ success: true, data: p });
});

// POST /api/productos
router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    
    // Generar SKU si no viene uno
    if (!data.sku || data.sku.trim() === '') {
      let prefix = 'PRO'; // Default
      if (data.tipo === 'propio') {
        prefix = 'APR'; // April Own
      } else if (data.colaborador_id) {
        const { Colaborador } = require('../models');
        const colab = await Colaborador.findById(data.colaborador_id);
        if (colab) {
          prefix = colab.nombre.substring(0, 3).toUpperCase();
        }
      }
      
      // Generar sufijo único (Timestamp o Random)
      const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      data.sku = `${prefix}-${suffix}`;
    }

    const p = await Producto.create(data);
    res.status(201).json({ success: true, data: p });
  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/productos/:id
router.put('/:id', auth, async (req, res) => {
  const p = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('colaborador_id', 'nombre')
    .populate('categoria_id', 'nombre');
  if (!p) return res.status(404).json({ success: false, message: 'No encontrado' });
  res.json({ success: true, data: p });
});

// PATCH /api/productos/:id/stock — ajuste manual de stock
router.patch('/:id/stock', auth, async (req, res) => {
  const { cantidad, operacion } = req.body; // operacion: 'sumar' | 'restar' | 'establecer'
  const p = await Producto.findById(req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'No encontrado' });

  if (operacion === 'sumar')       p.stock_actual += cantidad;
  else if (operacion === 'restar') p.stock_actual  = Math.max(0, p.stock_actual - cantidad);
  else                             p.stock_actual  = cantidad;

  if (p.stock_actual === 0) p.estatus = 'agotado';
  else if (p.estatus === 'agotado') p.estatus = 'activo';

  await p.save();
  res.json({ success: true, data: p });
});

// DELETE /api/productos/:id
router.delete('/:id', auth, async (req, res) => {
  await Producto.findByIdAndUpdate(req.params.id, { estatus: 'inactivo' });
  res.json({ success: true, message: 'Producto desactivado' });
});

module.exports = router;
