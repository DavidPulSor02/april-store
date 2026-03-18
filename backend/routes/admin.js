const router = require('express').Router();
const auth   = require('../middleware/auth');
const {
  Usuario, Colaborador, Categoria, Producto,
  Consignacion, Venta, VentaItem, PagoColaborador, MovimientoContable
} = require('../models');

/**
 * POST /api/admin/reset-db
 * Limpia TODA la base de datos conectada al servidor actualmente.
 * Solo accesible para rol 'admin'.
 * NO borra la cuenta admin@aprilstore.mx.
 */
router.post('/reset-db', auth, async (req, res) => {
  try {
    // Solo admin puede hacer esto
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ success: false, message: 'Sin permisos de administrador' });
    }

    // Borrar todo menos el usuario admin actual
    await Promise.all([
      Colaborador.deleteMany({}),
      Producto.deleteMany({}),
      Consignacion.deleteMany({}),
      Venta.deleteMany({}),
      VentaItem.deleteMany({}),
      PagoColaborador.deleteMany({}),
      MovimientoContable.deleteMany({}),
      Categoria.deleteMany({}),
    ]);

    // Eliminar otros usuarios (no el admin actual)
    await Usuario.deleteMany({ _id: { $ne: req.usuario.id } });

    // Recrear categorías básicas
    await Categoria.insertMany([
      { nombre: 'Joyería',           descripcion: 'Aretes, collares, pulseras y anillos' },
      { nombre: 'Bolsos y carteras', descripcion: 'Bolsos de mano, carteras y monederos' },
      { nombre: 'Accesorios cabello',descripcion: 'Diademas, pinzas, ligas y turbantes' },
      { nombre: 'Bisutería fina',    descripcion: 'Bisutería con acabados premium' },
      { nombre: 'Ropa y blusas',     descripcion: 'Prendas bordadas y artesanales' },
      { nombre: 'Accesorios varios', descripcion: 'Cinturones, lentes, billeteras' },
    ]);

    console.log(`🗑 Reset de BD ejecutado por ${req.usuario.nombre}`);
    res.json({ success: true, message: 'Base de datos limpiada correctamente. Categorías básicas restauradas.' });
  } catch (err) {
    console.error('Error en reset-db:', err);
    res.status(500).json({ success: false, message: 'Error al limpiar la base de datos' });
  }
});

module.exports = router;
