/**
 * clean.js — Limpieza de base de datos para inicio real
 * Uso: node clean.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const {
  Usuario, Colaborador, Categoria, Producto,
  Consignacion, Venta, VentaItem, PagoColaborador, MovimientoContable
} = require('./models');

const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/april-store';

async function clean() {
  try {
    await mongoose.connect(MONGO);
    console.log('✅ Conectado a MongoDB');

    // Identificar al admin principal para no borrarlo
    const admin = await Usuario.findOne({ email: 'admin@aprilstore.mx' });
    
    // Lista de colecciones a vaciar completamente
    console.log('🗑 Limpiando datos de prueba...');
    await Promise.all([
      Colaborador.deleteMany({}),
      Producto.deleteMany({}),
      Consignacion.deleteMany({}),
      Venta.deleteMany({}),
      VentaItem.deleteMany({}),
      PagoColaborador.deleteMany({}),
      MovimientoContable.deleteMany({}),
      Categoria.deleteMany({}) // También limpiamos categorías para recrear solo las básicas
    ]);

    // Mantener o recrear usuarios básicos
    if (!admin) {
      await Usuario.create({
        nombre: 'Abril Vega',
        email: 'admin@aprilstore.mx',
        password_hash: 'admin123',
        rol: 'admin'
      });
      console.log('👤 Usuario admin@aprilstore.mx recreado.');
    } else {
      // Si el admin existe, nos aseguramos de que no haya otros usuarios de prueba
      await Usuario.deleteMany({ email: { $ne: 'admin@aprilstore.mx' } });
      console.log('👤 Usuarios de prueba eliminados, Admin conservado.');
    }

    // Recrear categorías básicas
    await Categoria.insertMany([
      { nombre: 'Joyería', descripcion: 'Aretes, collares, pulseras y anillos' },
      { nombre: 'Bolsos y carteras', descripcion: 'Bolsos de mano, carteras y monederos' },
      { nombre: 'Accesorios cabello', descripcion: 'Diademas, pinzas, ligas y turbantes' }
    ]);
    console.log('🏷 Categorías básicas recreadas.');

    console.log('\n✨ Sistema listo para uso real.');
    console.log('   Acceso Administradora: admin@aprilstore.mx / admin123');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error durante la limpieza:', err);
    process.exit(1);
  }
}

clean();
