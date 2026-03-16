const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { Schema, model } = mongoose;

// ── 1. USUARIO ────────────────────────────────────────────
const usuarioSchema = new Schema({
  nombre:        { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  rol:           { type: String, enum: ['admin','cajera','viewer'], default: 'cajera' },
  activo:        { type: Boolean, default: true },
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  this.password_hash = await bcrypt.hash(this.password_hash, 12);
  next();
});
usuarioSchema.methods.compararPassword = function (pwd) {
  return bcrypt.compare(pwd, this.password_hash);
};

// ── 2. COLABORADOR ────────────────────────────────────────
const colaboradorSchema = new Schema({
  nombre:              { type: String, required: true, trim: true },
  telefono:            { type: String, trim: true },
  email:               { type: String, lowercase: true, trim: true },
  especialidad:        { type: String, trim: true },
  porcentaje_comision: { type: Number, default: 70, min: 0, max: 100 },
  banco:               { type: String },
  cuenta_bancaria:     { type: String },
  notas:               { type: String },
  estatus:             { type: String, enum: ['activo','inactivo'], default: 'activo' },
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

// ── 3. CATEGORIA ──────────────────────────────────────────
const categoriaSchema = new Schema({
  nombre:      { type: String, required: true, trim: true, unique: true },
  descripcion: { type: String },
  activa:      { type: Boolean, default: true },
}, { timestamps: { createdAt: 'creado_en' } });

// ── 4. PRODUCTO ───────────────────────────────────────────
const productoSchema = new Schema({
  nombre:         { type: String, required: true, trim: true },
  descripcion:    { type: String },
  sku:            { type: String, unique: true, sparse: true },
  colaborador_id: { type: Schema.Types.ObjectId, ref: 'Colaborador', default: null },
  categoria_id:   { type: Schema.Types.ObjectId, ref: 'Categoria', required: true },
  tipo:           { type: String, enum: ['propio','consignacion'], default: 'consignacion' },
  precio_venta:   { type: Number, required: true, min: 0 },
  precio_costo:   { type: Number, default: 0 },
  stock_actual:   { type: Number, default: 0, min: 0 },
  stock_minimo:   { type: Number, default: 5 },
  estatus:        { type: String, enum: ['activo','inactivo','agotado'], default: 'activo' },
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

productoSchema.index({ colaborador_id: 1, estatus: 1 });
productoSchema.index({ categoria_id: 1 });

// ── 5. CONSIGNACION ───────────────────────────────────────
const consignacionSchema = new Schema({
  colaborador_id:      { type: Schema.Types.ObjectId, ref: 'Colaborador', required: true },
  producto_id:         { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  cantidad_ingresada:  { type: Number, required: true, min: 1 },
  cantidad_disponible: { type: Number, required: true },
  cantidad_vendida:    { type: Number, default: 0 },
  cantidad_devuelta:   { type: Number, default: 0 },
  fecha_ingreso:       { type: Date, default: Date.now },
  fecha_cierre:        { type: Date },
  estatus:             { type: String, enum: ['abierta','cerrada','devuelta'], default: 'abierta' },
  notas:               { type: String },
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

// ── 6. VENTA ─────────────────────────────────────────────
const ventaSchema = new Schema({
  folio:       { type: String, unique: true },
  usuario_id:  { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  subtotal:    { type: Number, required: true },
  descuento:   { type: Number, default: 0 },
  total:       { type: Number, required: true },
  metodo_pago: { type: String, enum: ['efectivo','transferencia','tarjeta','mixto'], required: true },
  estatus:     { type: String, enum: ['completada','cancelada','pendiente'], default: 'completada' },
  fecha:       { type: Date, default: Date.now },
  notas:       { type: String },
}, { timestamps: { createdAt: 'creado_en' } });

ventaSchema.pre('save', async function (next) {
  if (!this.folio) {
    const count = await mongoose.model('Venta').countDocuments();
    this.folio  = `VTA-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});
ventaSchema.index({ fecha: -1 });

// ── 7. VENTA ITEM ─────────────────────────────────────────
const ventaItemSchema = new Schema({
  venta_id:             { type: Schema.Types.ObjectId, ref: 'Venta', required: true },
  producto_id:          { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  colaborador_id:       { type: Schema.Types.ObjectId, ref: 'Colaborador', default: null },
  cantidad:             { type: Number, required: true, min: 1 },
  precio_unitario:      { type: Number, required: true },
  subtotal:             { type: Number, required: true },
  porcentaje_comision:  { type: Number, default: 70 },
  comision_colaborador: { type: Number, default: 0 },
  comision_tienda:      { type: Number, default: 0 },
});

ventaItemSchema.pre('save', function (next) {
  this.subtotal             = +(this.cantidad * this.precio_unitario).toFixed(2);
  this.comision_colaborador = +(this.subtotal * this.porcentaje_comision / 100).toFixed(2);
  this.comision_tienda      = +(this.subtotal - this.comision_colaborador).toFixed(2);
  next();
});
ventaItemSchema.index({ venta_id: 1 });
ventaItemSchema.index({ colaborador_id: 1 });

// ── 8. PAGO COLABORADOR ───────────────────────────────────
const pagoColaboradorSchema = new Schema({
  colaborador_id:  { type: Schema.Types.ObjectId, ref: 'Colaborador', required: true },
  usuario_id:      { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  monto:           { type: Number, required: true, min: 0 },
  periodo_inicio:  { type: Date, required: true },
  periodo_fin:     { type: Date, required: true },
  metodo_pago:     { type: String, enum: ['efectivo','transferencia','otro'], required: true },
  referencia:      { type: String },
  estatus:         { type: String, enum: ['pendiente','pagado','cancelado'], default: 'pendiente' },
  fecha_pago:      { type: Date },
  notas:           { type: String },
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

pagoColaboradorSchema.index({ colaborador_id: 1, estatus: 1 });

// ── 9. MOVIMIENTO CONTABLE ────────────────────────────────
const movimientoContableSchema = new Schema({
  usuario_id:         { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  referencia_id:      { type: Schema.Types.ObjectId },
  referencia_modelo:  { type: String },
  tipo:               { type: String, enum: ['ingreso','egreso'], required: true },
  concepto:           { type: String, required: true },
  categoria_contable: {
    type: String,
    enum: ['venta','pago_colaborador','gasto_operativo','renta','salario','otro'],
    required: true,
  },
  monto:              { type: Number, required: true, min: 0 },
  saldo_resultante:   { type: Number, required: true },
  fecha:              { type: Date, default: Date.now },
  notas:              { type: String },
}, { timestamps: { createdAt: 'creado_en' } });

movimientoContableSchema.index({ fecha: -1 });
movimientoContableSchema.index({ tipo: 1, fecha: -1 });

// ── 10. CAJA (SESIONES) ───────────────────────────────────
const cajaSchema = new Schema({
  usuario_id:      { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  monto_apertura:  { type: Number, required: true },
  monto_cierre:    { type: Number },
  ventas_totales:  { type: Number, default: 0 },
  fecha_apertura:  { type: Date, default: Date.now },
  fecha_cierre:    { type: Date },
  estatus:         { type: String, enum: ['abierta', 'cerrada'], default: 'abierta' },
  notas:           { type: String },
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

cajaSchema.index({ usuario_id: 1, estatus: 1 });

// ── Exports ───────────────────────────────────────────────
module.exports = {
  Usuario:             model('Usuario',             usuarioSchema),
  Colaborador:         model('Colaborador',         colaboradorSchema),
  Categoria:           model('Categoria',           categoriaSchema),
  Producto:            model('Producto',            productoSchema),
  Consignacion:        model('Consignacion',        consignacionSchema),
  Venta:               model('Venta',               ventaSchema),
  VentaItem:           model('VentaItem',           ventaItemSchema),
  PagoColaborador:     model('PagoColaborador',     pagoColaboradorSchema),
  MovimientoContable:  model('MovimientoContable',  movimientoContableSchema),
  Caja:                model('Caja',                cajaSchema),
};
