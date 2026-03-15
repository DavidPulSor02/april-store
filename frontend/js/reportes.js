/**
 * reportes.js — Módulo de reportes con Chart.js + exportación
 * Se incluye como <script src="js/reportes.js"> al final del index.html
 */

// ── Sección de Reportes ───────────────────────────────────
// Inyecta la página de reportes al navegar
function loadReportes() {
  const section = document.getElementById('page-reportes');
  if (!section) return;

  section.innerHTML = `
    <!-- KPI resumen -->
    <div class="kpi-row" id="rep-kpis"></div>

    <!-- Gráficas -->
    <div class="dash-grid" style="margin-bottom:16px">
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Ventas por mes</span>
          <div style="display:flex;gap:8px;align-items:center">
            <select class="select-sm" id="rep-anio" onchange="renderVentasMes()">
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>
        <div style="padding:20px;position:relative;height:220px">
          <canvas id="chart-ventas-mes"></canvas>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Ingresos vs egresos</span>
          <span class="panel-tag">Este mes</span>
        </div>
        <div style="padding:20px;position:relative;height:220px">
          <canvas id="chart-balance"></canvas>
        </div>
      </div>
    </div>

    <div class="dash-grid" style="margin-bottom:16px">
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Ventas por colaboradora</span>
        </div>
        <div style="padding:20px;position:relative;height:220px">
          <canvas id="chart-colabs"></canvas>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Distribución por categoría</span>
        </div>
        <div style="padding:20px;position:relative;height:220px">
          <canvas id="chart-cats"></canvas>
        </div>
      </div>
    </div>

    <!-- Exportar -->
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Exportar reportes</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;padding:20px">
        ${exportCard('Ventas del período','Detalle de todas las ventas con artículos y métodos de pago','rep-ventas-csv')}
        ${exportCard('Comisiones colaboradoras','Resumen de ventas y comisiones por colaboradora','rep-comisiones-csv')}
        ${exportCard('Movimientos contables','Libro de ingresos y egresos del mes','rep-contab-csv')}
        ${exportCard('Inventario actual','Lista completa de productos con stock y valoración','rep-inventario-csv')}
      </div>
    </div>
  `;

  renderRepKpis();
  renderVentasMes();
  renderBalance();
  renderColabs();
  renderCats();
}

function exportCard(titulo, desc, id) {
  return `
    <div style="border:1px solid var(--rose-mist);border-radius:var(--radius-md);padding:18px">
      <div style="font-family:var(--font-display);font-size:15px;font-weight:500;margin-bottom:6px">${titulo}</div>
      <div style="font-size:12px;color:var(--ink-muted);margin-bottom:14px;line-height:1.5">${desc}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn-sm-outline" onclick="exportarCSV('${id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          CSV
        </button>
        <button class="btn-sm-outline" onclick="exportarPDF('${id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          PDF
        </button>
      </div>
    </div>`;
}

function renderRepKpis() {
  const ventas   = MOCK.ventas.reduce((a,v)=>a+v.total,0);
  const ingresos = MOCK.contabilidad.filter(m=>m.tipo==='ingreso').reduce((a,m)=>a+m.monto,0);
  const egresos  = MOCK.contabilidad.filter(m=>m.tipo==='egreso' ).reduce((a,m)=>a+m.monto,0);
  const margen   = ventas > 0 ? Math.round((ingresos-egresos)/ventas*100) : 0;

  document.getElementById('rep-kpis').innerHTML = `
    ${kpiCard('rose',  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>', 'Total vendido',  fmt(ventas),          `${MOCK.ventas.length} transacciones`, 'up')}
    ${kpiCard('green', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>', 'Balance neto',   fmt(ingresos-egresos),'Ingresos menos egresos', ingresos>egresos?'up':'down')}
    ${kpiCard('amber', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>', 'Margen neto',    margen+'%',           'Del total de ventas', margen>20?'up':'')}
    ${kpiCard('blue',  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>', 'Colaboradoras',  MOCK.colaboradores.length, 'Activas este mes', '')}
  `;
}

// ── Gráfica: Ventas por mes ───────────────────────────────
let chartVentasMes = null;
function renderVentasMes() {
  const ctx = document.getElementById('chart-ventas-mes');
  if (!ctx) return;
  if (chartVentasMes) chartVentasMes.destroy();

  const meses  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  // Mock data escalado para demo
  const valores = [28400,31200,48320,0,0,0,0,0,0,0,0,0];

  chartVentasMes = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: meses,
      datasets: [{
        label: 'Ventas ($)',
        data: valores,
        backgroundColor: valores.map((v,i) => i===2 ? 'rgba(200,99,122,0.85)' : 'rgba(200,99,122,0.2)'),
        borderColor:     valores.map((v,i) => i===2 ? '#C8637A' : '#EFC5CD'),
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: chartOpts('$', false)
  });
}

// ── Gráfica: Balance ─────────────────────────────────────
let chartBalance = null;
function renderBalance() {
  const ctx = document.getElementById('chart-balance');
  if (!ctx) return;
  if (chartBalance) chartBalance.destroy();

  const semanas = ['Sem 1','Sem 2','Sem 3','Sem 4'];
  chartBalance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: semanas,
      datasets: [
        { label: 'Ingresos', data: [11200,14300,12800,9020], borderColor: '#4A8C6A', backgroundColor: 'rgba(74,140,106,0.08)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#4A8C6A' },
        { label: 'Egresos',  data: [7800, 9100, 8200, 3570], borderColor: '#C8637A', backgroundColor: 'rgba(200,99,122,0.08)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#C8637A' },
      ]
    },
    options: chartOpts('$', true)
  });
}

// ── Gráfica: Por colaboradora ────────────────────────────
let chartColabs = null;
function renderColabs() {
  const ctx = document.getElementById('chart-colabs');
  if (!ctx) return;
  if (chartColabs) chartColabs.destroy();

  chartColabs = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MOCK.colaboradores.map(c => c.nombre.split(' ')[0]),
      datasets: [{
        label: 'Ventas ($)',
        data: MOCK.colaboradores.map(c => c.ventas_mes || 0),
        backgroundColor: ['rgba(200,99,122,0.8)','rgba(200,99,122,0.6)','rgba(200,99,122,0.45)','rgba(200,99,122,0.3)','rgba(200,99,122,0.2)'],
        borderRadius: 4,
      }]
    },
    options: { ...chartOpts('$', false), indexAxis: 'y' }
  });
}

// ── Gráfica: Por categoría ───────────────────────────────
let chartCats = null;
function renderCats() {
  const ctx = document.getElementById('chart-cats');
  if (!ctx) return;
  if (chartCats) chartCats.destroy();

  chartCats = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Joyería','Bolsos','Accesorios','Bisutería','Ropa'],
      datasets: [{
        data: [12400, 9800, 5600, 8200, 12320],
        backgroundColor: ['#C8637A','#EFC5CD','#A84D62','#F5E8EB','#3A6EA8'],
        borderWidth: 0,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { font: { family: 'DM Sans', size: 12 }, color: '#5C4650', padding: 12 } },
        tooltip: { callbacks: { label: (c) => ` ${fmt(c.raw)}` } }
      },
      cutout: '65%',
    }
  });
}

// ── Opciones comunes Chart.js ─────────────────────────────
function chartOpts(prefix, legend) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: legend, labels: { font: { family: 'DM Sans', size: 12 }, color: '#5C4650', usePointStyle: true, pointStyleWidth: 8 } },
      tooltip: { callbacks: { label: (c) => ` ${prefix}${Number(c.raw).toLocaleString('es-MX')}` }, backgroundColor: '#1C1318', titleFont: { family: 'DM Sans' }, bodyFont: { family: 'DM Sans' } }
    },
    scales: {
      x: { grid: { color: 'rgba(212,200,204,0.4)' }, ticks: { color: '#9C8490', font: { family: 'DM Sans', size: 11 } } },
      y: { grid: { color: 'rgba(212,200,204,0.4)' }, ticks: { color: '#9C8490', font: { family: 'DM Sans', size: 11 }, callback: (v) => `$${Number(v).toLocaleString('es-MX')}` } }
    }
  };
}

// ── Exportar CSV ─────────────────────────────────────────
function exportarCSV(tipo) {
  let csv = '', nombre = '';

  if (tipo === 'rep-ventas-csv') {
    nombre = 'ventas_april_store.csv';
    csv  = 'Folio,Fecha,Total,Método de pago,Estado\n';
    csv += MOCK.ventas.map(v => `${v.folio},${fmtD(v.fecha)},${v.total},${v.metodo_pago},${v.estatus}`).join('\n');
  } else if (tipo === 'rep-comisiones-csv') {
    nombre = 'comisiones_colaboradoras.csv';
    csv  = 'Colaboradora,Especialidad,Ventas del mes,Comisión (70%),% Comisión\n';
    csv += MOCK.colaboradores.map(c => `${c.nombre},${c.especialidad||''},${c.ventas_mes||0},${((c.ventas_mes||0)*c.porcentaje_comision/100).toFixed(2)},${c.porcentaje_comision}%`).join('\n');
  } else if (tipo === 'rep-contab-csv') {
    nombre = 'movimientos_contables.csv';
    csv  = 'Fecha,Concepto,Tipo,Categoría,Monto\n';
    csv += MOCK.contabilidad.map(m => `${fmtD(m.fecha)},${m.concepto},${m.tipo},${m.categoria_contable},${m.monto}`).join('\n');
  } else if (tipo === 'rep-inventario-csv') {
    nombre = 'inventario_april_store.csv';
    csv  = 'Producto,SKU,Categoría,Colaboradora,Tipo,Precio venta,Stock actual,Stock mínimo\n';
    csv += MOCK.productos.map(p => `${p.nombre},${p.sku||''},${p.categoria_id?.nombre||''},${p.colaborador_id?.nombre||'Tienda'},${p.tipo},${p.precio_venta},${p.stock_actual},${p.stock_minimo}`).join('\n');
  }

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  URL.revokeObjectURL(url);
  toast('CSV descargado correctamente', 'success');
}

// ── Exportar PDF (usando print) ───────────────────────────
function exportarPDF(tipo) {
  const titulos = {
    'rep-ventas-csv':     'Reporte de Ventas',
    'rep-comisiones-csv': 'Comisiones por Colaboradora',
    'rep-contab-csv':     'Movimientos Contables',
    'rep-inventario-csv': 'Inventario Actual',
  };
  const titulo = titulos[tipo] || 'Reporte';
  let   rows   = '';

  if (tipo === 'rep-ventas-csv') {
    rows = MOCK.ventas.map(v => `<tr><td>${v.folio}</td><td>${fmtDT(v.fecha)}</td><td>${fmt(v.total)}</td><td>${v.metodo_pago}</td><td>${v.estatus}</td></tr>`).join('');
    rows = `<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#F5E8EB"><th>Folio</th><th>Fecha</th><th>Total</th><th>Método</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>`;
  } else if (tipo === 'rep-comisiones-csv') {
    rows = MOCK.colaboradores.map(c => `<tr><td>${c.nombre}</td><td>${c.especialidad||''}</td><td>${fmt(c.ventas_mes||0)}</td><td>${fmt((c.ventas_mes||0)*c.porcentaje_comision/100)}</td><td>${c.porcentaje_comision}%</td></tr>`).join('');
    rows = `<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#F5E8EB"><th>Colaboradora</th><th>Especialidad</th><th>Ventas</th><th>Comisión</th><th>%</th></tr></thead><tbody>${rows}</tbody></table>`;
  } else if (tipo === 'rep-inventario-csv') {
    rows = MOCK.productos.map(p => `<tr><td>${p.nombre}</td><td>${p.sku||''}</td><td>${fmt(p.precio_venta)}</td><td>${p.stock_actual}</td><td>${p.tipo}</td></tr>`).join('');
    rows = `<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#F5E8EB"><th>Producto</th><th>SKU</th><th>Precio</th><th>Stock</th><th>Tipo</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet"/>
    <style>
      body { font-family:'DM Sans',sans-serif; color:#1C1318; padding:40px; }
      h1   { font-family:'Cormorant Garamond',serif; font-size:28px; color:#A84D62; margin-bottom:4px; }
      .sub { font-size:13px; color:#9C8490; margin-bottom:28px; }
      table { width:100%; border-collapse:collapse; }
      th,td { padding:9px 12px; text-align:left; border-bottom:1px solid #F5E8EB; }
      th    { font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:#9C8490; }
      tr:hover { background:#FBF2F4; }
      .footer { margin-top:32px; font-size:11px; color:#9C8490; text-align:center; }
    </style>
    </head><body>
    <h1>April Store</h1>
    <div class="sub">${titulo} · Generado el ${fmtDT(new Date())}</div>
    ${rows}
    <div class="footer">April Store — Sistema de Gestión · Confidencial</div>
    <script>window.onload=()=>{window.print();}<\/script>
    </body></html>`);
  win.document.close();
}
