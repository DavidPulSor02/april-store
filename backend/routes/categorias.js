// ── CATEGORIAS ────────────────────────────────────────────
const router = require('express').Router();
module.exports = router;
const auth = require('../middleware/auth');
const { Categoria } = require('../models');

router.get('/',    auth, async (req, res) => {
  const cats = await Categoria.find({ activa: true }).sort({ nombre: 1 });
  res.json({ success: true, data: cats });
});
router.post('/',   auth, async (req, res) => {
  const c = await Categoria.create(req.body);
  res.status(201).json({ success: true, data: c });
});
router.put('/:id', auth, async (req, res) => {
  const c = await Categoria.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: c });
});
router.delete('/:id', auth, async (req, res) => {
  await Categoria.findByIdAndUpdate(req.params.id, { activa: false });
  res.json({ success: true, message: 'Categoría desactivada' });
});
