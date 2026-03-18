const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Usuario } = require('../models');
const auth    = require('../middleware/auth');

const sign = (u) => jwt.sign(
  { id: u._id, rol: u.rol, nombre: u.nombre },
  process.env.JWT_SECRET || 'april_secret_2024',
  { expiresIn: '12h' }
);

// POST /api/auth/login
router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const { email, password } = req.body;
      const usuario = await Usuario.findOne({ email, activo: true });
      
      if (!usuario || !(await usuario.compararPassword(password)))
        return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });

      res.json({ 
        success: true, 
        token: sign(usuario), 
        usuario: { id: usuario._id, nombre: usuario.nombre, rol: usuario.rol } 
      });
    } catch (err) {
      console.error('Error en /api/auth/login:', err);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

// POST /api/auth/registro (solo admin puede crear usuarios)
router.post('/registro', auth,
  body('nombre').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    if (req.usuario.rol !== 'admin')
      return res.status(403).json({ success: false, message: 'Sin permisos' });

    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const { nombre, email, password, rol } = req.body;
    const existe = await Usuario.findOne({ email });
    if (existe)
      return res.status(409).json({ success: false, message: 'Email ya registrado' });

    const u = await Usuario.create({ nombre, email, password_hash: password, rol });
    res.status(201).json({ success: true, usuario: { id: u._id, nombre: u.nombre, rol: u.rol } });
  }
);

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  const u = await Usuario.findById(req.usuario.id).select('-password_hash');
  res.json({ success: true, usuario: u });
});

// GET /api/auth/usuarios (solo admin)
router.get('/usuarios', auth, async (req, res) => {
  if (req.usuario.rol !== 'admin')
    return res.status(403).json({ success: false, message: 'Sin permisos' });
  const usuarios = await Usuario.find({}).select('-password_hash').sort({ creado_en: -1 });
  res.json({ success: true, data: usuarios });
});

module.exports = router;
