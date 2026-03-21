const Venta = {
  find: async () => {
    return [
      { total: 100, metodo_pago: 'efectivo' },
      { total: 50, metodo_pago: 'tarjeta' }
    ];
  }
};

async function test(mesAnno, tipo, numQuincena) {
  try {
    if (!tipo || !mesAnno) throw new Error('Parametros requeridos incompletos');

    const [year, month] = mesAnno.split('-').map(Number);
    let fechaInicio, fechaFin, etiquetaPeriodo;
    
    const Smonth = String(month).padStart(2, '0');

    if (tipo === 'mes') {
      const endDay = new Date(year, month, 0).getDate();
      fechaInicio = new Date(`${year}-${Smonth}-01T00:00:00.000-06:00`);
      fechaFin    = new Date(`${year}-${Smonth}-${endDay}T23:59:59.999-06:00`);
      etiquetaPeriodo = `Mes de ${fechaInicio.toLocaleString('es-MX', { month: 'long' })} ${year}`;
    } else if (tipo === 'quincena') {
      if (numQuincena === 1) {
        fechaInicio = new Date(`${year}-${Smonth}-01T00:00:00.000-06:00`);
        fechaFin    = new Date(`${year}-${Smonth}-15T23:59:59.999-06:00`);
        etiquetaPeriodo = `1ra Quincena de ${fechaInicio.toLocaleString('es-MX', { month: 'long' })} ${year}`;
      } else {
        const endDay = new Date(year, month, 0).getDate();
        fechaInicio = new Date(`${year}-${Smonth}-16T00:00:00.000-06:00`);
        fechaFin    = new Date(`${year}-${Smonth}-${endDay}T23:59:59.999-06:00`);
        etiquetaPeriodo = `2da Quincena de ${fechaInicio.toLocaleString('es-MX', { month: 'long' })} ${year}`;
      }
    } else {
       throw new Error('Tipo no valido');
    }

    const ventas = await Venta.find();

    let totalVentas = 0, totalEfectivo = 0, totalTarjeta = 0, totalTransferencia = 0;

    ventas.forEach(v => {
      totalVentas += v.total;
      if (v.metodo_pago === 'efectivo') totalEfectivo += v.total;
      else if (v.metodo_pago === 'tarjeta') totalTarjeta += v.total;
      else if (v.metodo_pago === 'transferencia') totalTransferencia += v.total;
      else totalEfectivo += v.total; 
    });

    const whatsappText = `📊 *Reporte* `;
    console.log("ÉXITO!");

  } catch (error) {
    console.error('Error generando reporte', error);
  }
}

test('2026-03', 'quincena', 2);
test('2026-03', 'mes', null);
