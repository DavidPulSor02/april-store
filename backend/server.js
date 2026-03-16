require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const morgan    = require('morgan');
const path      = require('path');

const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Servir frontend estático ──────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Rutas API ─────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/colaboradores',  require('./routes/colaboradores'));
app.use('/api/categorias',     require('./routes/categorias'));
app.use('/api/productos',      require('./routes/productos'));
app.use('/api/consignaciones', require('./routes/consignaciones'));
app.use('/api/ventas',         require('./routes/ventas'));
app.use('/api/pagos',          require('./routes/pagos'));
app.use('/api/contabilidad',   require('./routes/contabilidad'));
app.use('/api/dashboard',      require('./routes/dashboard'));
app.use('/api/tickets',        require('./routes/tickets'));
app.use('/api/caja',           require('./routes/caja'));

// ── SPA routes ────────────────────────────────────────────
app.get('/mobile',   (req, res) => res.sendFile(path.join(__dirname, '../frontend/mobile/index.html')));
app.get('/mobile/*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/mobile/index.html')));
app.get('*',         (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

// ── Error handler global ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
});

// ── Conexión a MongoDB ────────────────────────────────────
const PORT    = process.env.PORT    || 3000;
const MONGODB = process.env.MONGODB_URI;

if (!MONGODB && process.env.NODE_ENV === 'production') {
  console.error('❌  ERROR: MONGODB_URI no está definida en el entorno de producción.');
  process.exit(1);
}

const mongoUri = MONGODB || 'mongodb://localhost:27017/april-store';

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('✅  MongoDB conectado');
  })
  .catch(err => {
    console.error('❌  Error al conectar MongoDB:', err.message);
  });

// Solo iniciar el servidor si se ejecuta este archivo directamente (no en Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀  Servidor corriendo en el puerto ${PORT}`);
    console.log(`🏠  Local: http://localhost:${PORT}`);
  });
}

module.exports = app;
