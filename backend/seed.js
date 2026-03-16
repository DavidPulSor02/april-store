/**
 * seed.js — Datos iniciales para April Store
 * Uso: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const {
  Usuario, Colaborador, Categoria, Producto,
  Consignacion, Venta, VentaItem, PagoColaborador, MovimientoContable
} = require('./models');

const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/april-store';

async function seed() {
  await mongoose.connect(MONGO);
  console.log('✅  Conectado a MongoDB');

  // Limpiar colecciones
  await Promise.all([
    Usuario.deleteMany({}), Colaborador.deleteMany({}), Categoria.deleteMany({}),
    Producto.deleteMany({}), Consignacion.deleteMany({}), Venta.deleteMany({}),
    VentaItem.deleteMany({}), PagoColaborador.deleteMany({}), MovimientoContable.deleteMany({})
  ]);
  console.log('🗑   Colecciones limpiadas');

  // ── Usuarios ────────────────────────────────────────────
  const [admin] = await Usuario.create([
    { nombre: 'Abril Vega', email: 'admin@aprilstore.mx', password_hash: 'admin123', rol: 'admin' },
    { nombre: 'Cajera Tienda', email: 'cajera@aprilstore.mx', password_hash: 'cajera123', rol: 'cajera' },
  ]);
  console.log('👤  Usuarios creados');

  // ── Categorías ──────────────────────────────────────────
  const cats = await Categoria.insertMany([
    { nombre: 'Joyería', descripcion: 'Aretes, collares, pulseras y anillos' },
    { nombre: 'Bolsos y carteras', descripcion: 'Bolsos de mano, carteras y monederos' },
    { nombre: 'Accesorios cabello', descripcion: 'Diademas, pinzas, ligas y turbantes' },
    { nombre: 'Bisutería fina', descripcion: 'Bisutería con acabados premium' },
    { nombre: 'Ropa y blusas', descripcion: 'Prendas bordadas y artesanales' },
    { nombre: 'Accesorios varios', descripcion: 'Cinturones, lentes, billeteras' },
  ]);
  console.log('🏷   Categorías creadas');

  // ── Colaboradores ───────────────────────────────────────
  const colabs = await Colaborador.insertMany([
    { nombre: 'Lucía Martínez', especialidad: 'Joyería artesanal', porcentaje_comision: 70, telefono: '2281234567', email: 'lucia@mail.com', banco: 'BBVA', cuenta_bancaria: '012345678901234567' },
    { nombre: 'Sofía Reyes', especialidad: 'Bolsos artesanales', porcentaje_comision: 70, telefono: '2289876543', email: 'sofia@mail.com', banco: 'Banamex', cuenta_bancaria: '002345678901234567' },
    { nombre: 'María Carrillo', especialidad: 'Accesorios de cabello', porcentaje_comision: 70, telefono: '2281122334', email: 'maria@mail.com', banco: 'HSBC', cuenta_bancaria: '021345678901234567' },
    { nombre: 'Daniela Torres', especialidad: 'Bisutería fina', porcentaje_comision: 70, telefono: '2285544332', email: 'daniela@mail.com', banco: 'Santander', cuenta_bancaria: '014345678901234567' },
    { nombre: 'Carmen Vega', especialidad: 'Ropa bordada', porcentaje_comision: 65, telefono: '2280011223', email: 'carmen@mail.com', banco: 'BBVA', cuenta_bancaria: '012645678901234567' },
  ]);
  console.log('🤝  Colaboradoras creadas');

  const [lucia, sofia, maria, daniela, carmen] = colabs;
  const [catJoy, catBol, catCab, catBis, catRop, catAcc] = cats;

  // ── Productos ───────────────────────────────────────────
  const prods = await Producto.insertMany([
    { nombre: 'Aretes Dorados Luna', sku: 'ARE-001', colaborador_id: lucia._id, categoria_id: catJoy._id, tipo: 'consignacion', precio_venta: 190, precio_costo: 60, stock_actual: 18, stock_minimo: 5, imagen_url: 'https://images.unsplash.com/photo-1515562141207-7a18b5ce3d8e?q=80&w=600&auto=format&fit=crop' },
    { nombre: 'Aretes Turquesa Boho', sku: 'ARE-002', colaborador_id: lucia._id, categoria_id: catJoy._id, tipo: 'consignacion', precio_venta: 150, precio_costo: 50, stock_actual: 14, stock_minimo: 5, imagen_url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=600&auto=format&fit=crop' },
    { nombre: 'Collar Perlas Rojas', sku: 'COL-003', colaborador_id: null, categoria_id: catJoy._id, tipo: 'propio', precio_venta: 280, precio_costo: 90, stock_actual: 11, stock_minimo: 5, imagen_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop' },
    { nombre: 'Pulsera Oro Tejida', sku: 'PUL-004', colaborador_id: lucia._id, categoria_id: catJoy._id, tipo: 'consignacion', precio_venta: 220, precio_costo: 70, stock_actual: 8, stock_minimo: 5, imagen_url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop' },
    { nombre: 'Bolso Tejido Boho', sku: 'BOL-005', colaborador_id: sofia._id, categoria_id: catBol._id, tipo: 'consignacion', precio_venta: 450, precio_costo: 150, stock_actual: 7, stock_minimo: 8, imagen_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop' },
    { nombre: 'Cartera Bordada Floral', sku: 'BOL-006', colaborador_id: sofia._id, categoria_id: catBol._id, tipo: 'consignacion', precio_venta: 320, precio_costo: 100, stock_actual: 5, stock_minimo: 5, imagen_url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=600&auto=format&fit=crop' },
    { nombre: 'Diadema Flores Secas', sku: 'DIA-007', colaborador_id: maria._id, categoria_id: catCab._id, tipo: 'consignacion', precio_venta: 120, precio_costo: 40, stock_actual: 9, stock_minimo: 5, imagen_url: 'https://images.unsplash.com/photo-1527799822367-a05eb5702377?q=80&w=600&auto=format&fit=crop' },
    { nombre: 'Turbante Estampado', sku: 'TUR-008', colaborador_id: maria._id, categoria_id: catCab._id, tipo: 'consignacion', precio_venta: 95, precio_costo: 30, stock_actual: 12, stock_minimo: 5, imagen_url: 'https://images.unsplash.com/photo-1589708092241-1191836c2a63?q=80&w=600&auto=format&fit=crop' },
    { nombre: 'Cinturón Trenzado Rosa', sku: 'CIN-009', colaborador_id: null, categoria_id: catAcc._id, tipo: 'propio', precio_venta: 320, precio_costo: 100, stock_actual: 22, stock_minimo: 5, imagen_url: 'https://images.unsplash.com/photo-1624222247344-550fb8ec5022?q=80&w=600&auto=format&fit=crop' },
    { nombre: 'Pulseras Macramé', sku: 'PUL-010', colaborador_id: daniela._id, categoria_id: catBis._id, tipo: 'consignacion', precio_venta: 95, precio_costo: 30, stock_actual: 3, stock_minimo: 8, imagen_url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop' },
    { nombre: 'Aretes Macramé Largos', sku: 'ARE-011', colaborador_id: daniela._id, categoria_id: catBis._id, tipo: 'consignacion', precio_venta: 110, precio_costo: 35, stock_actual: 6, stock_minimo: 5, imagen_url: 'https://images.unsplash.com/photo-1606060108341-38fb505439ad?q=80&w=600&auto=format&fit=crop' },
    { nombre: 'Blusa Bordada Floral', sku: 'BLU-012', colaborador_id: carmen._id, categoria_id: catRop._id, tipo: 'consignacion', precio_venta: 580, precio_costo: 200, stock_actual: 4, stock_minimo: 5, imagen_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=600&auto=format&fit=crop' },
    { nombre: 'Vestido Artesanal Boho', sku: 'VES-013', colaborador_id: carmen._id, categoria_id: catRop._id, tipo: 'consignacion', precio_venta: 780, precio_costo: 280, stock_actual: 2, stock_minimo: 3, imagen_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=600&auto=format&fit=crop' },
    { nombre: 'Lentes Cat Eye Rosa', sku: 'LEN-014', colaborador_id: null, categoria_id: catAcc._id, tipo: 'propio', precio_venta: 180, precio_costo: 60, stock_actual: 15, stock_minimo: 5, imagen_url: 'https://images.unsplash.com/photo-1511499767350-a1590fdb7351?q=80&w=600&auto=format&fit=crop' },
  ]);
  console.log('👜  Productos creados');

  const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14] = prods;

  // ── Consignaciones ──────────────────────────────────────
  await Consignacion.insertMany([
    { colaborador_id: lucia._id, producto_id: p1._id, cantidad_ingresada: 24, cantidad_disponible: 18, cantidad_vendida: 6, fecha_ingreso: new Date('2026-03-01') },
    { colaborador_id: lucia._id, producto_id: p2._id, cantidad_ingresada: 18, cantidad_disponible: 14, cantidad_vendida: 4, fecha_ingreso: new Date('2026-03-01') },
    { colaborador_id: lucia._id, producto_id: p4._id, cantidad_ingresada: 12, cantidad_disponible: 8, cantidad_vendida: 4, fecha_ingreso: new Date('2026-03-05') },
    { colaborador_id: sofia._id, producto_id: p5._id, cantidad_ingresada: 10, cantidad_disponible: 7, cantidad_vendida: 3, fecha_ingreso: new Date('2026-03-05') },
    { colaborador_id: sofia._id, producto_id: p6._id, cantidad_ingresada: 8, cantidad_disponible: 5, cantidad_vendida: 3, fecha_ingreso: new Date('2026-03-08') },
    { colaborador_id: maria._id, producto_id: p7._id, cantidad_ingresada: 12, cantidad_disponible: 9, cantidad_vendida: 3, fecha_ingreso: new Date('2026-03-10') },
    { colaborador_id: maria._id, producto_id: p8._id, cantidad_ingresada: 15, cantidad_disponible: 12, cantidad_vendida: 3, fecha_ingreso: new Date('2026-03-10') },
    { colaborador_id: daniela._id, producto_id: p10._id, cantidad_ingresada: 20, cantidad_disponible: 3, cantidad_vendida: 17, fecha_ingreso: new Date('2026-02-15') },
    { colaborador_id: daniela._id, producto_id: p11._id, cantidad_ingresada: 12, cantidad_disponible: 6, cantidad_vendida: 6, fecha_ingreso: new Date('2026-03-01') },
    { colaborador_id: carmen._id, producto_id: p12._id, cantidad_ingresada: 6, cantidad_disponible: 4, cantidad_vendida: 2, fecha_ingreso: new Date('2026-03-12') },
    { colaborador_id: carmen._id, producto_id: p13._id, cantidad_ingresada: 4, cantidad_disponible: 2, cantidad_vendida: 2, fecha_ingreso: new Date('2026-03-12') },
  ]);
  console.log('📦  Consignaciones creadas');

  // ── Ventas (últimos 15 días) ─────────────────────────────
  const ventasData = [
    { fecha: '2026-03-01', items: [{ p: p1, qty: 2 }, { p: p7, qty: 1 }], metodo: 'efectivo' },
    { fecha: '2026-03-02', items: [{ p: p5, qty: 1 }, { p: p2, qty: 1 }], metodo: 'transferencia' },
    { fecha: '2026-03-03', items: [{ p: p3, qty: 1 }], metodo: 'tarjeta' },
    { fecha: '2026-03-04', items: [{ p: p8, qty: 2 }, { p: p10, qty: 3 }], metodo: 'efectivo' },
    { fecha: '2026-03-05', items: [{ p: p1, qty: 1 }, { p: p4, qty: 1 }], metodo: 'efectivo' },
    { fecha: '2026-03-06', items: [{ p: p12, qty: 1 }], metodo: 'transferencia' },
    { fecha: '2026-03-07', items: [{ p: p2, qty: 2 }, { p: p14, qty: 1 }], metodo: 'tarjeta' },
    { fecha: '2026-03-08', items: [{ p: p9, qty: 1 }, { p: p7, qty: 2 }], metodo: 'efectivo' },
    { fecha: '2026-03-09', items: [{ p: p5, qty: 1 }, { p: p11, qty: 2 }], metodo: 'transferencia' },
    { fecha: '2026-03-10', items: [{ p: p3, qty: 1 }, { p: p1, qty: 1 }], metodo: 'efectivo' },
    { fecha: '2026-03-11', items: [{ p: p6, qty: 1 }, { p: p10, qty: 4 }], metodo: 'tarjeta' },
    { fecha: '2026-03-12', items: [{ p: p13, qty: 1 }, { p: p8, qty: 1 }], metodo: 'efectivo' },
    { fecha: '2026-03-13', items: [{ p: p1, qty: 2 }, { p: p4, qty: 2 }], metodo: 'transferencia' },
    { fecha: '2026-03-14', items: [{ p: p5, qty: 1 }, { p: p2, qty: 1 }, { p: p3, qty: 1 }], metodo: 'tarjeta' },
    { fecha: '2026-03-15', items: [{ p: p1, qty: 2 }, { p: p7, qty: 1 }], metodo: 'efectivo' },
  ];

  let saldo = 0;
  for (const vd of ventasData) {
    const subtotal = vd.items.reduce((a, i) => a + i.p.precio_venta * i.qty, 0);
    const venta = await Venta.create({
      usuario_id: admin._id, subtotal, total: subtotal,
      metodo_pago: vd.metodo, estatus: 'completada',
      fecha: new Date(vd.fecha),
    });

    for (const { p, qty } of vd.items) {
      const colab = colabs.find(c => c._id.equals(p.colaborador_id));
      const pct = colab ? colab.porcentaje_comision : 0;
      const sub = +(p.precio_venta * qty).toFixed(2);
      await VentaItem.create({
        venta_id: venta._id, producto_id: p._id,
        colaborador_id: p.colaborador_id || null,
        cantidad: qty, precio_unitario: p.precio_venta,
        subtotal: sub, porcentaje_comision: pct,
        comision_colaborador: +(sub * pct / 100).toFixed(2),
        comision_tienda: +(sub * (1 - pct / 100)).toFixed(2),
      });
    }

    saldo += subtotal;
    await MovimientoContable.create({
      usuario_id: admin._id, referencia_id: venta._id, referencia_modelo: 'Venta',
      tipo: 'ingreso', concepto: `Venta ${venta.folio}`,
      categoria_contable: 'venta', monto: subtotal, saldo_resultante: saldo,
      fecha: new Date(vd.fecha),
    });
  }
  console.log('💰  Ventas y movimientos creados');

  // ── Pagos colaboradoras (mes anterior) ──────────────────
  const periodoInicio = new Date('2026-02-01');
  const periodoFin = new Date('2026-02-28');

  const pagosData = [
    { colab: lucia, monto: 2870, metodo: 'transferencia', estatus: 'pagado', fecha: new Date('2026-03-01') },
    { colab: sofia, monto: 1960, metodo: 'transferencia', estatus: 'pagado', fecha: new Date('2026-03-01') },
    { colab: maria, monto: 980, metodo: 'efectivo', estatus: 'pagado', fecha: new Date('2026-03-02') },
    { colab: daniela, monto: 1610, metodo: 'transferencia', estatus: 'pagado', fecha: new Date('2026-03-02') },
    { colab: carmen, monto: 520, metodo: 'efectivo', estatus: 'pagado', fecha: new Date('2026-03-03') },
  ];

  for (const pd of pagosData) {
    const pago = await PagoColaborador.create({
      colaborador_id: pd.colab._id, usuario_id: admin._id,
      monto: pd.monto, periodo_inicio: periodoInicio, periodo_fin: periodoFin,
      metodo_pago: pd.metodo, estatus: pd.estatus, fecha_pago: pd.fecha,
    });
    saldo -= pd.monto;
    await MovimientoContable.create({
      usuario_id: admin._id, referencia_id: pago._id, referencia_modelo: 'PagoColaborador',
      tipo: 'egreso', concepto: `Pago a ${pd.colab.nombre} — Feb 2026`,
      categoria_contable: 'pago_colaborador', monto: pd.monto, saldo_resultante: saldo,
      fecha: pd.fecha,
    });
  }

  // Pago de renta
  saldo -= 5000;
  await MovimientoContable.create({
    usuario_id: admin._id, tipo: 'egreso', concepto: 'Renta local — Marzo 2026',
    categoria_contable: 'renta', monto: 5000, saldo_resultante: saldo,
    fecha: new Date('2026-03-01'),
  });
  console.log('💳  Pagos y egresos creados');

  console.log('\n🎉  Seed completado exitosamente');
  console.log('   Admin:  admin@aprilstore.mx  / admin123');
  console.log('   Cajera: cajera@aprilstore.mx / cajera123');
  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌', err); process.exit(1); });
