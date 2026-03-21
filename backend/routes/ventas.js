const router   = require('express').Router();
const mongoose = require('mongoose');
const auth     = require('../middleware/auth');
const { Venta, VentaItem, Producto, MovimientoContable, Consignacion } = require('../models');

// GET /api/ventas
router.get('/', auth, async (req, res) => {
  const { desde, hasta, estatus, metodo_pago, limit = 50, page = 1 } = req.query;
  const filter = {};
  if (estatus)     filter.estatus     = estatus;
  if (metodo_pago) filter.metodo_pago = metodo_pago;
  if (desde || hasta) {
    filter.fecha = {};
    if (desde) filter.fecha.$gte = new Date(desde);
    if (hasta) filter.fecha.$lte = new Date(hasta);
  }

  const skip   = (page - 1) * limit;
  const [ventas, total] = await Promise.all([
    Venta.find(filter).populate('usuario_id', 'nombre').sort({ fecha: -1 }).skip(skip).limit(+limit),
    Venta.countDocuments(filter),
  ]);

  res.json({ success: true, data: ventas, total, page: +page, pages: Math.ceil(total / limit) });
});

// GET /api/ventas/:id — con items
router.get('/:id', auth, async (req, res) => {
  const venta = await Venta.findById(req.params.id).populate('usuario_id', 'nombre');
  if (!venta) return res.status(404).json({ success: false, message: 'No encontrada' });
  const items = await VentaItem.find({ venta_id: venta._id })
    .populate('producto_id', 'nombre precio_venta')
    .populate('colaborador_id', 'nombre');
  res.json({ success: true, data: { ...venta.toObject(), items } });
});

// POST /api/ventas — registrar venta completa (con transacción)
router.post('/', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, metodo_pago, descuento = 0, notas } = req.body;
    if (!items?.length) throw { status: 400, message: 'Se requiere al menos un artículo' };

    let subtotal = 0;
    const itemsData = [];

    for (const item of items) {
      const producto = await Producto.findById(item.producto_id).session(session);
      if (!producto)              throw { status: 404, message: `Producto ${item.producto_id} no encontrado` };
      if (producto.stock_actual < item.cantidad) throw { status: 400, message: `Stock insuficiente: ${producto.nombre}` };

      const itemSubtotal = +(producto.precio_venta * item.cantidad).toFixed(2);
      subtotal += itemSubtotal;

      itemsData.push({
        producto_id:         producto._id,
        colaborador_id:      producto.colaborador_id,
        cantidad:            item.cantidad,
        precio_unitario:     producto.precio_venta,
        subtotal:            itemSubtotal,
        porcentaje_comision: item.porcentaje_comision ?? 70,
        comision_colaborador: +(itemSubtotal * (item.porcentaje_comision ?? 70) / 100).toFixed(2),
        comision_tienda:      +(itemSubtotal * (1 - (item.porcentaje_comision ?? 70) / 100)).toFixed(2),
      });

      // Descontar stock general del producto
      await Producto.findByIdAndUpdate(
        producto._id,
        { $inc: { stock_actual: -item.cantidad } },
        { session }
      );

      // Descontar stock de consignaciones si aplica
      if (producto.colaborador_id) {
        let cantRestante = item.cantidad;
        const consignaciones = await Consignacion.find({
          producto_id: producto._id,
          estatus: 'abierta',
          cantidad_disponible: { $gt: 0 }
        }).sort({ fecha_ingreso: 1 }).session(session);

        for (let consig of consignaciones) {
          if (cantRestante <= 0) break;
          const aDescontar = Math.min(consig.cantidad_disponible, cantRestante);
          
          consig.cantidad_disponible -= aDescontar;
          consig.cantidad_vendida += aDescontar;
          
          if (consig.cantidad_disponible === 0) {
            consig.estatus = 'cerrada';
            consig.fecha_cierre = new Date();
          }
          await consig.save({ session });
          cantRestante -= aDescontar;
        }
      }
    }

    const total = +(subtotal - descuento).toFixed(2);

    const [venta] = await Venta.create([{
      usuario_id: req.usuario.id,
      subtotal,
      descuento,
      total,
      metodo_pago,
      notas,
      estatus: 'completada',
    }], { session });

    // Crear items (los hooks pre-save no funcionan en insertMany con validadores, usamos create en loop)
    for (const itemData of itemsData) {
      await VentaItem.create([{ ...itemData, venta_id: venta._id }], { session });
    }

    // Movimiento contable
    await MovimientoContable.create([{
      usuario_id:        req.usuario.id,
      referencia_id:     venta._id,
      referencia_modelo: 'Venta',
      tipo:              'ingreso',
      concepto:          `Venta ${venta.folio} — ${metodo_pago}`,
      categoria_contable:'venta',
      monto:             total,
      saldo_resultante:  total,
      fecha:             venta.fecha,
    }], { session });

    await session.commitTransaction();
    res.status(201).json({ success: true, data: venta, folio: venta.folio });
  } catch (err) {
    await session.abortTransaction();
    res.status(err.status || 500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
});

// PATCH /api/ventas/:id/cancelar
router.patch('/:id/cancelar', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const venta = await Venta.findById(req.params.id).session(session);
    if (!venta || venta.estatus !== 'completada')
      throw { status: 400, message: 'Venta no cancelable' };

    venta.estatus = 'cancelada';
    await venta.save({ session });

    // Revertir stock
    const items = await VentaItem.find({ venta_id: venta._id }).session(session);
    for (const item of items) {
      await Producto.findByIdAndUpdate(item.producto_id, { $inc: { stock_actual: item.cantidad } }, { session });

      if (item.colaborador_id) {
        let cantAReintegrar = item.cantidad;
        // Reintegrar a consignaciones recientes que tengan algo vendido
        const consignaciones = await Consignacion.find({
          producto_id: item.producto_id
        }).sort({ fecha_ingreso: -1 }).session(session); // del más reciente al más antiguo

        for (let consig of consignaciones) {
          if (cantAReintegrar <= 0) break;
          const espacio = consig.cantidad_vendida; 
          if (espacio > 0) {
            const aRestaurar = Math.min(espacio, cantAReintegrar);
            consig.cantidad_vendida -= aRestaurar;
            consig.cantidad_disponible += aRestaurar;
            
            if (consig.estatus === 'cerrada' && consig.cantidad_disponible > 0) {
              consig.estatus = 'abierta';
              consig.fecha_cierre = null;
            }
            
            await consig.save({ session });
            cantAReintegrar -= aRestaurar;
          }
        }
      }
    }

    await session.commitTransaction();
    res.json({ success: true, message: 'Venta cancelada' });
  } catch (err) {
    await session.abortTransaction();
    res.status(err.status || 500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
});

// POST /api/ventas/reporte-email
router.post('/reporte-email', auth, async (req, res) => {
  try {
    const { tipo, mesAnno, numQuincena } = req.body;
    if (!tipo || !mesAnno) return res.status(400).json({ success: false, message: 'Parametros requeridos incompletos' });

    const [year, month] = mesAnno.split('-').map(Number);
    let fechaInicio, fechaFin, etiquetaPeriodo;

    if (tipo === 'mes') {
      fechaInicio = new Date(year, month - 1, 1);
      fechaFin = new Date(year, month, 0, 23, 59, 59, 999);
      etiquetaPeriodo = `Mes de ${fechaInicio.toLocaleString('es-MX', { month: 'long' })} ${year}`;
    } else if (tipo === 'quincena') {
      if (numQuincena === 1) {
        fechaInicio = new Date(year, month - 1, 1);
        fechaFin = new Date(year, month - 1, 15, 23, 59, 59, 999);
        etiquetaPeriodo = `1ra Quincena de ${fechaInicio.toLocaleString('es-MX', { month: 'long' })} ${year}`;
      } else {
        fechaInicio = new Date(year, month - 1, 16);
        fechaFin = new Date(year, month, 0, 23, 59, 59, 999);
        etiquetaPeriodo = `2da Quincena de ${fechaInicio.toLocaleString('es-MX', { month: 'long' })} ${year}`;
      }
    } else {
      return res.status(400).json({ success: false, message: 'Tipo no valido' });
    }

    const ventas = await Venta.find({
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      estatus: 'completada'
    });

    const datos = {
      total_ventas: 0,
      num_ventas: ventas.length,
      total_efectivo: 0,
      total_tarjeta: 0,
      total_transferencia: 0
    };

    ventas.forEach(v => {
      datos.total_ventas += v.total;
      if (v.metodo_pago === 'efectivo') datos.total_efectivo += v.total;
      else if (v.metodo_pago === 'tarjeta') datos.total_tarjeta += v.total;
      else if (v.metodo_pago === 'transferencia') datos.total_transferencia += v.total;
      else datos.total_efectivo += v.total; // Default to efectivo for mixed/etc to not break math easily
    });

    const { enviarReporteVentas } = require('../services/emailService');
    await enviarReporteVentas(datos, etiquetaPeriodo);

    res.json({ success: true, message: 'Reporte enviado por correo a los administradores.' });
  } catch (error) {
    console.error('Error generando reporte de ventas', error);
    res.status(500).json({ success: false, message: 'Error interno al generar reporte' });
  }
});

module.exports = router;
