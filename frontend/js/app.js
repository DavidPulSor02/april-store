/* app.js — Lógica principal de April Store */

// ── Estado global ─────────────────────────────────────────
const State = {
  usuario: null,
  token: null,
  ventaItems: [],
  cacheProductos: [],
  cacheCategorias: [],
  cacheColaboradores: [],
};

// ── Mock data (para demo sin backend) ────────────────────
const MOCK = {
  usuario: { id: '1', nombre: 'April Hernández', rol: 'admin' },
  dashboard: {
    ventas_mes: { total: 48320, count: 312 },
    ventas_hoy: { total: 6240,  count: 87  },
    productos_activos: 312,
    colaboradores_activos: 8,
    alertas_stock: 14,
    grafica_dias: [
      { _id: 'Lun', total: 4200 }, { _id: 'Mar', total: 5800 },
      { _id: 'Mié', total: 3900 }, { _id: 'Jue', total: 6700 },
      { _id: 'Vie', total: 7200 }, { _id: 'Sáb', total: 9100 },
      { _id: 'Dom', total: 8400 }, { _id: 'Hoy', total: 6240 },
    ],
    top_colaboradores: [
      { colaborador: { nombre: 'Lucía Martínez' }, total: 4820, piezas: 24, comision: 3374 },
      { colaborador: { nombre: 'Sofía Reyes'    }, total: 3960, piezas: 31, comision: 2772 },
      { colaborador: { nombre: 'María Carrillo' }, total: 2340, piezas: 17, comision: 1638 },
      { colaborador: { nombre: 'Daniela Torres' }, total: 1780, piezas: 41, comision: 1246 },
    ],
  },
  colaboradores: [
    { _id: 'c1', nombre: 'Lucía Martínez',  especialidad: 'Joyería artesanal',   porcentaje_comision: 70, estatus: 'activo', email: 'lucia@mail.com',   telefono: '2281234567', ventas_mes: 4820, piezas: 24 },
    { _id: 'c2', nombre: 'Sofía Reyes',     especialidad: 'Bolsos artesanales',  porcentaje_comision: 70, estatus: 'activo', email: 'sofia@mail.com',   telefono: '2289876543', ventas_mes: 3960, piezas: 31 },
    { _id: 'c3', nombre: 'María Carrillo',  especialidad: 'Accesorios de cabello',porcentaje_comision: 70, estatus: 'activo', email: 'maria@mail.com',  telefono: '2281122334', ventas_mes: 2340, piezas: 17 },
    { _id: 'c4', nombre: 'Daniela Torres',  especialidad: 'Bisutería fina',      porcentaje_comision: 70, estatus: 'activo', email: 'daniela@mail.com', telefono: '2285544332', ventas_mes: 1780, piezas: 41 },
    { _id: 'c5', nombre: 'Carmen Vega',     especialidad: 'Ropa bordada',        porcentaje_comision: 65, estatus: 'activo', email: 'carmen@mail.com',  telefono: '2280011223', ventas_mes: 890,  piezas: 12 },
  ],
  categorias: [
    { _id: 'cat1', nombre: 'Joyería',        activa: true },
    { _id: 'cat2', nombre: 'Bolsos',         activa: true },
    { _id: 'cat3', nombre: 'Accesorios cabello', activa: true },
    { _id: 'cat4', nombre: 'Bisutería',      activa: true },
    { _id: 'cat5', nombre: 'Ropa',           activa: true },
  ],
  productos: [
    { _id: 'p1', nombre: 'Aretes Dorados Luna',    sku: 'ARE-001', precio_venta: 190, precio_costo: 60,  stock_actual: 18, stock_minimo: 5,  tipo: 'consignacion', estatus: 'activo',  colaborador_id: { nombre: 'Lucía M.' },  categoria_id: { nombre: 'Joyería'  } },
    { _id: 'p2', nombre: 'Bolso Tejido Boho',      sku: 'BOL-002', precio_venta: 450, precio_costo: 150, stock_actual: 7,  stock_minimo: 8,  tipo: 'consignacion', estatus: 'activo',  colaborador_id: { nombre: 'Sofía R.' },  categoria_id: { nombre: 'Bolsos'   } },
    { _id: 'p3', nombre: 'Diadema Flores Secas',   sku: 'DIA-003', precio_venta: 120, precio_costo: 40,  stock_actual: 9,  stock_minimo: 5,  tipo: 'consignacion', estatus: 'activo',  colaborador_id: { nombre: 'María C.' },  categoria_id: { nombre: 'Accesorios cabello' } },
    { _id: 'p4', nombre: 'Collar Perlas Rojas',    sku: 'COL-004', precio_venta: 280, precio_costo: 90,  stock_actual: 11, stock_minimo: 5,  tipo: 'propio',       estatus: 'activo',  colaborador_id: null,                    categoria_id: { nombre: 'Joyería'  } },
    { _id: 'p5', nombre: 'Pulseras Macramé',       sku: 'PUL-005', precio_venta: 95,  precio_costo: 30,  stock_actual: 3,  stock_minimo: 8,  tipo: 'consignacion', estatus: 'activo',  colaborador_id: { nombre: 'Daniela T.'},  categoria_id: { nombre: 'Bisutería' } },
    { _id: 'p6', nombre: 'Cinturón Trenzado Rosa', sku: 'CIN-006', precio_venta: 320, precio_costo: 100, stock_actual: 22, stock_minimo: 5,  tipo: 'propio',       estatus: 'activo',  colaborador_id: null,                    categoria_id: { nombre: 'Accesorios cabello' } },
    { _id: 'p7', nombre: 'Aretes Turquesa Boho',   sku: 'ARE-007', precio_venta: 150, precio_costo: 50,  stock_actual: 14, stock_minimo: 5,  tipo: 'consignacion', estatus: 'activo',  colaborador_id: { nombre: 'Lucía M.' },  categoria_id: { nombre: 'Joyería'  } },
    { _id: 'p8', nombre: 'Blusa Bordada Floral',   sku: 'BLU-008', precio_venta: 580, precio_costo: 200, stock_actual: 4,  stock_minimo: 5,  tipo: 'consignacion', estatus: 'activo',  colaborador_id: { nombre: 'Carmen V.' }, categoria_id: { nombre: 'Ropa'     } },
  ],
  ventas: [
    { _id: 'v1', folio: 'VTA-000892', fecha: new Date('2026-03-15T14:30:00'), total: 380,  metodo_pago: 'efectivo',      estatus: 'completada', usuario_id: { nombre: 'April H.' } },
    { _id: 'v2', folio: 'VTA-000891', fecha: new Date('2026-03-15T12:10:00'), total: 120,  metodo_pago: 'transferencia', estatus: 'completada', usuario_id: { nombre: 'April H.' } },
    { _id: 'v3', folio: 'VTA-000890', fecha: new Date('2026-03-14T17:45:00'), total: 450,  metodo_pago: 'efectivo',      estatus: 'completada', usuario_id: { nombre: 'April H.' } },
    { _id: 'v4', folio: 'VTA-000889', fecha: new Date('2026-03-14T11:20:00'), total: 840,  metodo_pago: 'tarjeta',       estatus: 'completada', usuario_id: { nombre: 'April H.' } },
    { _id: 'v5', folio: 'VTA-000888', fecha: new Date('2026-03-13T16:00:00'), total: 475,  metodo_pago: 'efectivo',      estatus: 'completada', usuario_id: { nombre: 'April H.' } },
    { _id: 'v6', folio: 'VTA-000887', fecha: new Date('2026-03-13T10:30:00'), total: 1260, metodo_pago: 'efectivo',      estatus: 'completada', usuario_id: { nombre: 'April H.' } },
  ],
  contabilidad: [
    { _id: 'm1', fecha: new Date('2026-03-15'), concepto: 'Venta VTA-000892', tipo: 'ingreso', categoria_contable: 'venta',             monto: 380,  saldo_resultante: 48320 },
    { _id: 'm2', fecha: new Date('2026-03-15'), concepto: 'Pago Sofía Reyes', tipo: 'egreso',  categoria_contable: 'pago_colaborador',   monto: 2772, saldo_resultante: 45548 },
    { _id: 'm3', fecha: new Date('2026-03-14'), concepto: 'Venta VTA-000890', tipo: 'ingreso', categoria_contable: 'venta',             monto: 4890, saldo_resultante: 48320 },
    { _id: 'm4', fecha: new Date('2026-03-14'), concepto: 'Renta local marzo', tipo: 'egreso',  categoria_contable: 'renta',            monto: 5000, saldo_resultante: 43430 },
    { _id: 'm5', fecha: new Date('2026-03-13'), concepto: 'Pago Lucía Martínez',tipo:'egreso',  categoria_contable: 'pago_colaborador', monto: 3374, saldo_resultante: 48430 },
  ],
  consignaciones: [
    { _id: 'cs1', producto_id: { nombre: 'Aretes Dorados Luna'  }, colaborador_id: { nombre: 'Lucía Martínez' }, cantidad_ingresada: 24, cantidad_disponible: 18, cantidad_vendida: 6, fecha_ingreso: new Date('2026-03-01'), estatus: 'abierta' },
    { _id: 'cs2', producto_id: { nombre: 'Bolso Tejido Boho'    }, colaborador_id: { nombre: 'Sofía Reyes'    }, cantidad_ingresada: 10, cantidad_disponible: 7,  cantidad_vendida: 3, fecha_ingreso: new Date('2026-03-05'), estatus: 'abierta' },
    { _id: 'cs3', producto_id: { nombre: 'Pulseras Macramé'     }, colaborador_id: { nombre: 'Daniela Torres' }, cantidad_ingresada: 15, cantidad_disponible: 3,  cantidad_vendida: 12,fecha_ingreso: new Date('2026-03-08'), estatus: 'abierta' },
    { _id: 'cs4', producto_id: { nombre: 'Diadema Flores Secas' }, colaborador_id: { nombre: 'María Carrillo' }, cantidad_ingresada: 12, cantidad_disponible: 9,  cantidad_vendida: 3, fecha_ingreso: new Date('2026-03-10'), estatus: 'abierta' },
  ],
  pagos: [
    { _id: 'pg1', colaborador_id: { nombre: 'Lucía Martínez' }, periodo_inicio: new Date('2026-03-01'), periodo_fin: new Date('2026-03-15'), monto: 3374, metodo_pago: 'transferencia', estatus: 'pendiente', fecha_pago: null },
    { _id: 'pg2', colaborador_id: { nombre: 'Sofía Reyes'    }, periodo_inicio: new Date('2026-03-01'), periodo_fin: new Date('2026-03-15'), monto: 2772, metodo_pago: 'transferencia', estatus: 'pagado',    fecha_pago: new Date('2026-03-15') },
    { _id: 'pg3', colaborador_id: { nombre: 'María Carrillo' }, periodo_inicio: new Date('2026-03-01'), periodo_fin: new Date('2026-03-15'), monto: 1638, metodo_pago: 'efectivo',      estatus: 'pendiente', fecha_pago: null },
    { _id: 'pg4', colaborador_id: { nombre: 'Daniela Torres' }, periodo_inicio: new Date('2026-03-01'), periodo_fin: new Date('2026-03-15'), monto: 1246, metodo_pago: 'transferencia', estatus: 'pendiente', fecha_pago: null },
  ],
};

// ── Helpers ───────────────────────────────────────────────
const fmt  = (n) => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 });
const fmtD = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDT= (d) => d ? new Date(d).toLocaleString('es-MX',  { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const initials = (n) => n ? n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() : '??';

let toastTimer;
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ── AUTH ──────────────────────────────────────────────────
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pwd   = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  // Demo mode — accept any credentials or the demo ones
  if (!email || !pwd) { errEl.textContent = 'Ingresa tu correo y contraseña.'; errEl.classList.remove('hidden'); return; }

  errEl.classList.add('hidden');
  State.usuario = MOCK.usuario;
  State.token   = 'demo-token';
  localStorage.setItem('april_token', State.token);

  // Try real API, fallback to mock
  try {
    const res = await Api.login(email, pwd);
    State.usuario = res.usuario;
    State.token   = res.token;
    localStorage.setItem('april_token', res.token);
  } catch { /* demo mode */ }

  showApp();
}

function handleLogout() {
  localStorage.removeItem('april_token');
  State.usuario = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  const u = State.usuario;
  document.getElementById('user-name').textContent     = u.nombre;
  document.getElementById('user-role').textContent     = u.rol === 'admin' ? 'Administradora' : 'Cajera';
  document.getElementById('user-initials').textContent = initials(u.nombre);

  loadDashboard();
  checkStockAlerts();
}

// ── NAVIGATION ────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: 'Dashboard', productos: 'Productos', categorias: 'Categorías',
  colaboradores: 'Colaboradoras', consignacion: 'Consignación',
  ventas: 'Ventas', contabilidad: 'Contabilidad', pagos: 'Pagos a colaboradoras',
  reportes: 'Reportes & Análisis',
};
const CTA_LABELS = {
  dashboard: 'Nueva venta', productos: 'Agregar producto', categorias: 'Nueva categoría',
  colaboradores: 'Nueva colaboradora', consignacion: 'Registrar entrada',
  ventas: 'Nueva venta', contabilidad: 'Nuevo movimiento', pagos: 'Registrar pago',
  reportes: 'Exportar reporte',
};

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pg = document.getElementById(`page-${page}`);
  if (pg) pg.classList.add('active');

  const nb = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (nb) nb.classList.add('active');

  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;
  document.getElementById('breadcrumb').textContent = `Inicio / ${PAGE_TITLES[page] || page}`;
  document.getElementById('cta-label').textContent  = CTA_LABELS[page] || 'Nuevo';

  if (page === 'productos')     loadProductos();
  if (page === 'colaboradores') loadColaboradores();
  if (page === 'ventas')        loadVentas();
  if (page === 'contabilidad')  loadContabilidad();
  if (page === 'consignacion')  loadConsignaciones();
  if (page === 'pagos')         loadPagos();
  if (page === 'categorias')    loadCategorias();
  if (page === 'reportes')      loadReportes();
}

function openPrimaryModal() {
  const active = document.querySelector('.nav-item.active')?.dataset.page || 'dashboard';
  if (active === 'productos')     openProductoModal();
  else if (active === 'colaboradores') openColaboradorModal();
  else if (active === 'contabilidad')  openMovimientoModal();
  else if (active === 'consignacion')  openConsignacionModal();
  else if (active === 'pagos')         openPagoModal();
  else if (active === 'categorias')    openCategoriaModal();
  else if (active === 'reportes')      exportarCSV('rep-ventas-csv');
  else openVentaModal();
}

// ── DASHBOARD ─────────────────────────────────────────────
async function loadDashboard() {
  let d = MOCK.dashboard;
  try { const r = await Api.dashboard(); d = r.data; } catch { /* demo */ }

  // KPI Cards
  document.getElementById('kpi-row').innerHTML = `
    ${kpiCard('rose',
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
      'Ventas del mes', fmt(d.ventas_mes.total), `↑ ${d.ventas_mes.count} transacciones`, 'up')}
    ${kpiCard('green',
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`,
      'Ventas de hoy', fmt(d.ventas_hoy.total), `${d.ventas_hoy.count} artículos vendidos`, '')}
    ${kpiCard('amber',
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none"/></svg>`,
      'Productos activos', d.productos_activos, `${d.alertas_stock} con stock bajo`, d.alertas_stock > 0 ? 'down' : '')}
    ${kpiCard('blue',
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
      'Colaboradoras activas', d.colaboradores_activos, 'Consignatarias', '')}
  `;

  // Bar chart
  const max = Math.max(...d.grafica_dias.map(x => x.total));
  document.getElementById('bar-chart').innerHTML = d.grafica_dias.map((x, i) => `
    <div class="bar-col">
      <div class="bar-val">${i===d.grafica_dias.length-1?fmt(x.total):''}</div>
      <div class="bar-fill${i===d.grafica_dias.length-1?' today':''}"
           style="height:${Math.max(8, Math.round(x.total/max*80))}px"
           title="${x._id}: ${fmt(x.total)}"></div>
      <div class="bar-label">${x._id}</div>
    </div>`).join('');

  // Top colabs
  document.getElementById('top-colabs-list').innerHTML = d.top_colaboradores.map(c => `
    <div class="colab-row">
      <div class="colab-av">${initials(c.colaborador.nombre)}</div>
      <div><div class="colab-nm">${c.colaborador.nombre}</div><div class="colab-sub">${c.piezas} piezas</div></div>
      <div class="colab-amt"><div class="colab-val">${fmt(c.total)}</div><div class="colab-pct">Comisión: ${fmt(c.comision)}</div></div>
    </div>`).join('');

  // Activity
  const acts = [
    { dot: 'dot-rose',  text: 'Venta registrada: Aretes Dorados Luna × 2 — <strong>$380</strong>',    time: 'Hace 12 min' },
    { dot: 'dot-green', text: 'Pago liquidado a Sofía Reyes — <strong>$2,772</strong>',                time: 'Hace 1 h'    },
    { dot: 'dot-amber', text: 'Stock bajo: Pulseras Macramé — quedan <strong>3 piezas</strong>',       time: 'Hace 2 h'    },
    { dot: 'dot-rose',  text: 'Nuevo ingreso consignación: María Carrillo — <strong>8 artículos</strong>', time: 'Ayer 16:30' },
    { dot: 'dot-green', text: 'Corte de caja diario completado — <strong>$6,240</strong>',             time: 'Ayer 20:00'  },
  ];
  document.getElementById('activity-feed').innerHTML = acts.map(a => `
    <div class="activity-item">
      <div class="act-dot ${a.dot}"></div>
      <div><div class="act-text">${a.text}</div><div class="act-time">${a.time}</div></div>
    </div>`).join('');

  // Stock alerts
  const alertItems = MOCK.productos.filter(p => p.stock_actual <= p.stock_minimo).slice(0, 5);
  document.getElementById('stock-alerts').innerHTML = alertItems.length ? alertItems.map(p => `
    <div class="alert-item">
      <span class="alert-nm">${p.nombre}</span>
      <span class="alert-stock ${p.stock_actual <= 3 ? 'stock-critical' : 'stock-low'}">${p.stock_actual} uds.</span>
    </div>`).join('') : '<div class="empty-state" style="padding:20px"><p>Sin alertas de stock</p></div>';
}

function kpiCard(color, icon, label, value, delta, deltaClass) {
  return `
    <div class="kpi-card ${color}">
      <div class="kpi-icon">${icon}</div>
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-delta ${deltaClass}">${delta}</div>
    </div>`;
}

// ── PRODUCTOS ─────────────────────────────────────────────
function loadProductos() {
  const tipo    = document.getElementById('filter-tipo')?.value || '';
  const estatus = document.getElementById('filter-estatus-prod')?.value || '';
  let   data    = MOCK.productos;
  if (tipo)    data = data.filter(p => p.tipo    === tipo);
  if (estatus) data = data.filter(p => p.estatus === estatus);

  document.getElementById('prod-count').textContent = `${data.length} productos`;

  document.getElementById('tbody-productos').innerHTML = data.length ? data.map(p => {
    const stockPct  = Math.min(100, Math.round(p.stock_actual / (p.stock_minimo * 3) * 100));
    const stockColor= p.stock_actual <= 3 ? '#B84545' : p.stock_actual <= p.stock_minimo ? '#C47B2A' : '#4A8C6A';
    return `<tr>
      <td><div class="cell-primary">${p.nombre}</div><div class="cell-muted">${p.sku || '—'}</div></td>
      <td>${p.categoria_id?.nombre || '—'}</td>
      <td>${p.colaborador_id?.nombre || '<span class="badge badge-neutral">Tienda</span>'}</td>
      <td class="cell-primary">${fmt(p.precio_venta)}</td>
      <td>
        <div class="stock-cell">
          <span class="stock-num" style="color:${stockColor}">${p.stock_actual}</span>
          <div class="progress"><div class="progress-bar-fill" style="width:${stockPct}%;background:${stockColor}"></div></div>
        </div>
      </td>
      <td>${p.tipo === 'consignacion' ? '<span class="badge badge-rose">Consignación</span>' : '<span class="badge badge-neutral">Propio</span>'}</td>
      <td>${estatusBadge(p.estatus)}</td>
      <td>
        <button class="row-action-btn" onclick="openProductoModal('${p._id}')" title="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('') : emptyRow(8, 'Sin productos registrados');

  // Cache for venta modal
  State.cacheProductos = MOCK.productos;
}

// ── COLABORADORES ─────────────────────────────────────────
function loadColaboradores() {
  const estatus = document.getElementById('filter-est-colab')?.value || 'activo';
  let   data    = MOCK.colaboradores;
  if (estatus) data = data.filter(c => c.estatus === estatus);

  document.getElementById('colab-count').textContent = `${data.length} colaboradoras`;
  document.getElementById('colabs-grid').innerHTML = data.map(c => `
    <div class="colab-card" onclick="openColaboradorModal('${c._id}')">
      <div class="colab-card-top">
        <div class="colab-card-av">${initials(c.nombre)}</div>
        <div>
          <div class="colab-card-name">${c.nombre}</div>
          <div class="colab-card-spec">${c.especialidad || '—'}</div>
        </div>
      </div>
      <div class="colab-card-stats">
        <div><div class="colab-stat-val">${fmt(c.ventas_mes || 0)}</div><div class="colab-stat-lbl">Ventas mes</div></div>
        <div><div class="colab-stat-val">${c.piezas || 0}</div><div class="colab-stat-lbl">Piezas</div></div>
      </div>
      <div class="colab-card-footer">
        <span class="colab-comision">Comisión: <strong>${c.porcentaje_comision}%</strong></span>
        ${estatusBadge(c.estatus)}
      </div>
    </div>`).join('');
}

// ── VENTAS ────────────────────────────────────────────────
function loadVentas() {
  let data = MOCK.ventas;
  const metodo = document.getElementById('filter-metodo')?.value;
  if (metodo) data = data.filter(v => v.metodo_pago === metodo);

  document.getElementById('ventas-count').textContent = `${data.length} ventas`;
  document.getElementById('tbody-ventas').innerHTML = data.length ? data.map(v => `
    <tr>
      <td class="cell-primary">${v.folio}</td>
      <td>${fmtDT(v.fecha)}</td>
      <td>—</td>
      <td class="cell-primary">${fmt(v.total)}</td>
      <td>${metodoBadge(v.metodo_pago)}</td>
      <td>${estatusBadge(v.estatus)}</td>
      <td>
        <button class="row-action-btn" onclick="openDetalleVenta('${v._id}')" title="Ver detalle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </td>
    </tr>`).join('') : emptyRow(7, 'Sin ventas registradas');
}

// ── CONTABILIDAD ──────────────────────────────────────────
function loadContabilidad() {
  const tipo = document.getElementById('filter-tipo-ct')?.value;
  let   data = MOCK.contabilidad;
  if (tipo) data = data.filter(m => m.tipo === tipo);

  // KPIs
  const ingresos = MOCK.contabilidad.filter(m=>m.tipo==='ingreso').reduce((a,m)=>a+m.monto,0);
  const egresos  = MOCK.contabilidad.filter(m=>m.tipo==='egreso' ).reduce((a,m)=>a+m.monto,0);
  document.getElementById('contab-kpis').innerHTML = `
    ${kpiCard('rose',  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>', 'Ingresos del mes', fmt(ingresos), '↑ vs mes anterior', 'up')}
    ${kpiCard('green', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>','Egresos del mes', fmt(egresos), 'Incluye pagos y gastos', '')}
    ${kpiCard('amber', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>', 'Balance neto', fmt(ingresos - egresos), 'Ganancia del período', ingresos > egresos ? 'up' : 'down')}
    ${kpiCard('blue',  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', 'Movimientos', data.length, 'En este período', '')}
  `;

  document.getElementById('tbody-contabilidad').innerHTML = data.length ? data.map(m => `
    <tr>
      <td>${fmtD(m.fecha)}</td>
      <td class="cell-primary">${m.concepto}</td>
      <td><span class="badge badge-neutral">${m.categoria_contable.replace('_',' ')}</span></td>
      <td>${m.tipo === 'ingreso' ? '<span class="badge badge-success">Ingreso</span>' : '<span class="badge badge-danger">Egreso</span>'}</td>
      <td class="cell-primary" style="color:${m.tipo==='ingreso'?'var(--success)':'var(--danger)'}">${m.tipo==='ingreso'?'+':'−'}${fmt(m.monto)}</td>
    </tr>`).join('') : emptyRow(5, 'Sin movimientos');
}

// ── CONSIGNACIONES ────────────────────────────────────────
function loadConsignaciones() {
  const data = MOCK.consignaciones;
  document.getElementById('tbody-consig').innerHTML = data.length ? data.map(c => `
    <tr>
      <td class="cell-primary">${c.producto_id?.nombre || '—'}</td>
      <td>${c.colaborador_id?.nombre || '—'}</td>
      <td>${c.cantidad_ingresada}</td>
      <td><strong>${c.cantidad_disponible}</strong></td>
      <td>${c.cantidad_vendida}</td>
      <td>${estatusBadge(c.estatus)}</td>
      <td>${fmtD(c.fecha_ingreso)}</td>
    </tr>`).join('') : emptyRow(7, 'Sin consignaciones activas');
}

// ── PAGOS ─────────────────────────────────────────────────
function loadPagos() {
  const data = MOCK.pagos;
  document.getElementById('tbody-pagos').innerHTML = data.length ? data.map(p => `
    <tr>
      <td class="cell-primary">${p.colaborador_id?.nombre || '—'}</td>
      <td>${fmtD(p.periodo_inicio)} – ${fmtD(p.periodo_fin)}</td>
      <td class="cell-primary">${fmt(p.monto)}</td>
      <td>${metodoBadge(p.metodo_pago)}</td>
      <td>${estatusBadge(p.estatus)}</td>
      <td>${p.fecha_pago ? fmtD(p.fecha_pago) : '—'}</td>
      <td>${p.estatus === 'pendiente' ?
        `<button class="btn-sm-outline" onclick="liquidarPago('${p._id}')">Liquidar</button>` :
        `<span class="badge badge-success">✓ Pagado</span>`}
      </td>
    </tr>`).join('') : emptyRow(7, 'Sin pagos registrados');
}

// ── CATEGORIAS ────────────────────────────────────────────
function loadCategorias() {
  const data = MOCK.categorias;
  document.getElementById('tbody-cats').innerHTML = data.map(c => `
    <tr>
      <td class="cell-primary">${c.nombre}</td>
      <td>${c.descripcion || '—'}</td>
      <td>${c.activa ? '<span class="badge badge-success">Activa</span>' : '<span class="badge badge-neutral">Inactiva</span>'}</td>
      <td>
        <button class="row-action-btn" title="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </td>
    </tr>`).join('');
}

// ── MODALS ────────────────────────────────────────────────
function openModal(id) {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById(id).classList.add('open');
}

function closeAllModals() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
}

// Venta
function openVentaModal() {
  State.ventaItems = [];
  document.getElementById('prod-search').value = '';
  document.getElementById('prod-results').classList.remove('open');
  document.getElementById('v-descuento').value = '0';
  renderVentaItems();
  openModal('modal-venta');
}

function searchProductosVenta(q) {
  const res = document.getElementById('prod-results');
  if (!q.trim()) { res.classList.remove('open'); return; }
  const matches = MOCK.productos.filter(p =>
    p.nombre.toLowerCase().includes(q.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(q.toLowerCase()))
  ).slice(0, 6);

  if (!matches.length) { res.classList.remove('open'); return; }
  res.innerHTML = matches.map(p => `
    <div class="prod-result-item" onclick="addVentaItem('${p._id}')">
      <div>
        <div class="prod-result-nm">${p.nombre}</div>
        <div class="prod-result-meta">${p.sku || ''} · Stock: ${p.stock_actual}</div>
      </div>
      <div class="prod-result-price">${fmt(p.precio_venta)}</div>
    </div>`).join('');
  res.classList.add('open');
}

function addVentaItem(prodId) {
  const p = MOCK.productos.find(x => x._id === prodId);
  if (!p) return;
  document.getElementById('prod-search').value = '';
  document.getElementById('prod-results').classList.remove('open');

  const existing = State.ventaItems.find(i => i._id === prodId);
  if (existing) { if (existing.qty < p.stock_actual) existing.qty++; }
  else State.ventaItems.push({ ...p, qty: 1 });
  renderVentaItems();
}

function changeQty(id, delta) {
  const item = State.ventaItems.find(i => i._id === id);
  if (!item) return;
  item.qty = Math.max(1, Math.min(item.stock_actual, item.qty + delta));
  renderVentaItems();
}

function removeVentaItem(id) {
  State.ventaItems = State.ventaItems.filter(i => i._id !== id);
  renderVentaItems();
}

function renderVentaItems() {
  const wrap = document.getElementById('venta-items');
  if (!State.ventaItems.length) {
    wrap.innerHTML = `<div class="empty-items"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span>Agrega productos buscando arriba</span></div>`;
  } else {
    wrap.innerHTML = State.ventaItems.map(i => `
      <div class="venta-item-row">
        <div class="flex-1">
          <div class="vitem-nm">${i.nombre}</div>
          <div class="vitem-meta">${fmt(i.precio_venta)} c/u</div>
        </div>
        <div class="qty-ctrl">
          <button class="qty-btn" onclick="changeQty('${i._id}',-1)">−</button>
          <span class="qty-num">${i.qty}</span>
          <button class="qty-btn" onclick="changeQty('${i._id}',1)">+</button>
        </div>
        <span class="vitem-total">${fmt(i.precio_venta * i.qty)}</span>
        <button class="vitem-del" onclick="removeVentaItem('${i._id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>`).join('');
  }
  calcVentaTotals();
}

function calcVentaTotals() {
  const sub = State.ventaItems.reduce((a, i) => a + i.precio_venta * i.qty, 0);
  const desc = parseFloat(document.getElementById('v-descuento')?.value || 0);
  document.getElementById('v-subtotal').textContent = fmt(sub);
  document.getElementById('v-total').textContent    = fmt(Math.max(0, sub - desc));
}

async function submitVenta() {
  if (!State.ventaItems.length) { toast('Agrega al menos un producto', 'error'); return; }
  const metodo = document.querySelector('input[name="metodo_pago"]:checked')?.value || 'efectivo';
  const desc   = parseFloat(document.getElementById('v-descuento').value || 0);

  // Mock — agregar a la lista
  const folio = `VTA-${String(MOCK.ventas.length + 893).padStart(6,'0')}`;
  const sub   = State.ventaItems.reduce((a,i)=>a+i.precio_venta*i.qty,0);
  MOCK.ventas.unshift({ _id: `v_${Date.now()}`, folio, fecha: new Date(), total: sub-desc, metodo_pago: metodo, estatus: 'completada', usuario_id: { nombre: State.usuario.nombre } });

  // Try real API
  try {
    await Api.crearVenta({
      items: State.ventaItems.map(i => ({ producto_id: i._id, cantidad: i.qty })),
      metodo_pago: metodo, descuento: desc,
    });
  } catch { /* demo */ }

  closeAllModals();
  toast(`Venta ${folio} registrada exitosamente`, 'success');
  State.ventaItems = [];
  if (document.getElementById('page-ventas').classList.contains('active')) loadVentas();
}

// Producto modal
async function openProductoModal(id) {
  document.getElementById('prod-id').value = id || '';
  document.getElementById('modal-prod-title').textContent = id ? 'Editar producto' : 'Nuevo producto';

  // Load categorias & colaboradores for selects
  const cats  = MOCK.categorias;
  const colabs= MOCK.colaboradores;
  document.getElementById('prod-categoria').innerHTML   = cats.map(c => `<option value="${c._id}">${c.nombre}</option>`).join('');
  document.getElementById('prod-colaborador').innerHTML = `<option value="">— Tienda propia —</option>` + colabs.map(c => `<option value="${c._id}">${c.nombre}</option>`).join('');

  if (id) {
    const p = MOCK.productos.find(x => x._id === id);
    if (p) {
      document.getElementById('prod-nombre').value     = p.nombre;
      document.getElementById('prod-sku').value        = p.sku || '';
      document.getElementById('prod-precio').value     = p.precio_venta;
      document.getElementById('prod-costo').value      = p.precio_costo;
      document.getElementById('prod-stock').value      = p.stock_actual;
      document.getElementById('prod-stock-min').value  = p.stock_minimo;
      document.getElementById('prod-tipo').value       = p.tipo;
      document.getElementById('prod-desc').value       = p.descripcion || '';
    }
  } else {
    ['prod-nombre','prod-sku','prod-precio','prod-costo','prod-desc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('prod-stock').value     = '0';
    document.getElementById('prod-stock-min').value = '5';
  }
  openModal('modal-producto');
}

async function submitProducto() {
  const nombre = document.getElementById('prod-nombre').value.trim();
  if (!nombre) { toast('El nombre es obligatorio', 'error'); return; }
  toast('Producto guardado correctamente', 'success');
  closeAllModals();
  loadProductos();
}

// Colaborador modal
function openColaboradorModal(id) {
  document.getElementById('colab-id').value = id || '';
  document.getElementById('modal-colab-title').textContent = id ? 'Editar colaboradora' : 'Nueva colaboradora';
  if (id) {
    const c = MOCK.colaboradores.find(x => x._id === id);
    if (c) {
      document.getElementById('colab-nombre').value     = c.nombre;
      document.getElementById('colab-especialidad').value = c.especialidad || '';
      document.getElementById('colab-telefono').value   = c.telefono || '';
      document.getElementById('colab-email').value      = c.email || '';
      document.getElementById('colab-comision').value   = c.porcentaje_comision;
      document.getElementById('colab-banco').value      = c.banco || '';
      document.getElementById('colab-cuenta').value     = c.cuenta_bancaria || '';
      document.getElementById('colab-notas').value      = c.notas || '';
    }
  } else {
    ['colab-nombre','colab-especialidad','colab-telefono','colab-email','colab-banco','colab-cuenta','colab-notas'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('colab-comision').value = '70';
  }
  openModal('modal-colaborador');
}

async function submitColaborador() {
  const nombre = document.getElementById('colab-nombre').value.trim();
  if (!nombre) { toast('El nombre es obligatorio', 'error'); return; }
  toast('Colaboradora guardada correctamente', 'success');
  closeAllModals();
  loadColaboradores();
}

// Movimiento modal
function openMovimientoModal() { openModal('modal-movimiento'); }
async function submitMovimiento() {
  const concepto = document.getElementById('mov-concepto').value.trim();
  const monto    = parseFloat(document.getElementById('mov-monto').value);
  if (!concepto || !monto) { toast('Completa concepto y monto', 'error'); return; }
  toast('Movimiento registrado correctamente', 'success');
  closeAllModals();
  loadContabilidad();
}

// Detalle venta
function openDetalleVenta(id) {
  const v = MOCK.ventas.find(x => x._id === id);
  if (!v) return;
  document.getElementById('dv-folio').textContent = v.folio;
  document.getElementById('dv-fecha').textContent = fmtDT(v.fecha);
  document.getElementById('dv-body').innerHTML = `
    <div class="detail-grid">
      <div class="detail-field"><label>Total</label><span style="font-family:var(--font-display);font-size:22px;font-weight:500">${fmt(v.total)}</span></div>
      <div class="detail-field"><label>Método de pago</label><span>${metodoBadge(v.metodo_pago)}</span></div>
      <div class="detail-field"><label>Estado</label><span>${estatusBadge(v.estatus)}</span></div>
      <div class="detail-field"><label>Registrada por</label><span>${v.usuario_id?.nombre || '—'}</span></div>
    </div>
    <p style="font-size:12px;color:var(--ink-muted);margin-top:8px">Los artículos del detalle están disponibles en el sistema con backend activo.</p>`;
  openModal('modal-detalle-venta');
}

// Liquidar pago
function liquidarPago(id) {
  const p = MOCK.pagos.find(x => x._id === id);
  if (p) { p.estatus = 'pagado'; p.fecha_pago = new Date(); }
  toast('Pago liquidado correctamente', 'success');
  loadPagos();
}

// ── STOCK ALERTS ─────────────────────────────────────────
async function checkStockAlerts() {
  const bajos = MOCK.productos.filter(p => p.stock_actual <= p.stock_minimo);
  if (bajos.length > 0) document.getElementById('badge-dot').classList.add('visible');
}

// ── BADGES ───────────────────────────────────────────────
function estatusBadge(e) {
  const map = { activo:'badge-success', inactivo:'badge-neutral', agotado:'badge-danger', completada:'badge-success', cancelada:'badge-danger', pendiente:'badge-warning', abierta:'badge-rose', cerrada:'badge-neutral', devuelta:'badge-neutral', pagado:'badge-success' };
  return `<span class="badge ${map[e]||'badge-neutral'}">${e}</span>`;
}
function metodoBadge(m) {
  const map = { efectivo:'badge-success', transferencia:'badge-info', tarjeta:'badge-rose', mixto:'badge-warning' };
  return `<span class="badge ${map[m]||'badge-neutral'}">${m}</span>`;
}
function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}"><div class="empty-state"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg><p>${msg}</p><small>Usa el botón superior para agregar</small></div></td></tr>`;
}

// ── CONSIGNACIÓN MODAL ────────────────────────────────────
function openConsignacionModal() {
  // Poblar colaboradoras
  const sel = document.getElementById('consig-colaborador');
  sel.innerHTML = '<option value="">Seleccionar…</option>' +
    MOCK.colaboradores.map(c => `<option value="${c._id}">${c.nombre}</option>`).join('');
  document.getElementById('consig-producto').innerHTML  = '<option value="">Primero selecciona colaboradora</option>';
  document.getElementById('consig-cantidad').value      = '';
  document.getElementById('consig-notas').value         = '';
  document.getElementById('consig-fecha').value         = new Date().toISOString().split('T')[0];
  document.getElementById('consig-preview').classList.add('hidden');
  openModal('modal-consignacion');
}

function loadProductosDeColab() {
  const colabId = document.getElementById('consig-colaborador').value;
  const sel     = document.getElementById('consig-producto');
  if (!colabId) { sel.innerHTML = '<option value="">Primero selecciona colaboradora</option>'; return; }

  const prods = MOCK.productos.filter(p => p.colaborador_id?._id === colabId || p.colaborador_id === colabId);
  sel.innerHTML = '<option value="">Seleccionar producto…</option>' +
    prods.map(p => `<option value="${p._id}" data-precio="${p.precio_venta}">${p.nombre} — ${fmt(p.precio_venta)}</option>`).join('');

  sel.onchange = () => {
    const opt   = sel.selectedOptions[0];
    const colabId = document.getElementById('consig-colaborador').value;
    const colab   = MOCK.colaboradores.find(c => c._id === colabId);
    if (!opt?.value || !colab) { document.getElementById('consig-preview').classList.add('hidden'); return; }
    const precio  = parseFloat(opt.dataset.precio || 0);
    const comPct  = colab.porcentaje_comision;
    document.getElementById('prev-precio').textContent   = fmt(precio);
    document.getElementById('prev-comision').textContent = comPct + '% por pieza';
    document.getElementById('prev-tienda').textContent   = fmt(precio * (1 - comPct/100)) + ' / pza';
    document.getElementById('consig-preview').classList.remove('hidden');
  };
}

async function submitConsignacion() {
  const colabId  = document.getElementById('consig-colaborador').value;
  const prodId   = document.getElementById('consig-producto').value;
  const cantidad = parseInt(document.getElementById('consig-cantidad').value);
  if (!colabId || !prodId || !cantidad) { toast('Completa todos los campos obligatorios', 'error'); return; }

  const colab   = MOCK.colaboradores.find(c => c._id === colabId);
  const prod    = MOCK.productos.find(p => p._id === prodId);

  // Actualizar mock
  prod.stock_actual += cantidad;
  MOCK.consignaciones.unshift({
    _id: `cs_${Date.now()}`,
    colaborador_id: { nombre: colab.nombre },
    producto_id:    { nombre: prod.nombre  },
    cantidad_ingresada:  cantidad,
    cantidad_disponible: cantidad,
    cantidad_vendida: 0,
    fecha_ingreso: new Date(),
    estatus: 'abierta',
  });

  // Try real API
  try { await Api.crearConsignacion({ colaborador_id: colabId, producto_id: prodId, cantidad_ingresada: cantidad, fecha_ingreso: new Date() }); } catch { /* demo */ }

  closeAllModals();
  toast(`Entrada registrada: ${cantidad} piezas de ${prod.nombre}`, 'success');
  loadConsignaciones();
}

// ── PAGOS MODAL ───────────────────────────────────────────
function openPagoModal() {
  const sel = document.getElementById('pago-colaborador');
  sel.innerHTML = '<option value="">Seleccionar…</option>' +
    MOCK.colaboradores.map(c => `<option value="${c._id}" data-ventas="${c.ventas_mes||0}" data-pct="${c.porcentaje_comision}">${c.nombre}</option>`).join('');

  document.getElementById('pago-monto').value     = '';
  document.getElementById('pago-referencia').value = '';
  document.getElementById('pago-notas').value      = '';
  document.getElementById('pago-estimado').classList.add('hidden');

  const hoy   = new Date();
  const inicio= new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  document.getElementById('pago-inicio').value = inicio.toISOString().split('T')[0];
  document.getElementById('pago-fin').value    = hoy.toISOString().split('T')[0];

  openModal('modal-pago');
}

function calcPagoEstimado() {
  const opt    = document.getElementById('pago-colaborador').selectedOptions[0];
  const div    = document.getElementById('pago-estimado');
  if (!opt?.value) { div.classList.add('hidden'); return; }
  const ventas = parseFloat(opt.dataset.ventas || 0);
  const pct    = parseFloat(opt.dataset.pct    || 70);
  const est    = +(ventas * pct / 100).toFixed(2);
  document.getElementById('pago-estimado-val').textContent = fmt(est);
  document.getElementById('pago-monto').value = est;
  div.classList.remove('hidden');
}

async function submitPago() {
  const colabId = document.getElementById('pago-colaborador').value;
  const monto   = parseFloat(document.getElementById('pago-monto').value);
  const metodo  = document.getElementById('pago-metodo').value;
  if (!colabId || !monto) { toast('Selecciona colaboradora y monto', 'error'); return; }

  const colab = MOCK.colaboradores.find(c => c._id === colabId);
  MOCK.pagos.unshift({
    _id: `pg_${Date.now()}`,
    colaborador_id: { nombre: colab.nombre },
    periodo_inicio: new Date(document.getElementById('pago-inicio').value),
    periodo_fin:    new Date(document.getElementById('pago-fin').value),
    monto, metodo_pago: metodo, estatus: 'pendiente', fecha_pago: null,
  });

  try { await Api.crearPago({ colaborador_id: colabId, monto, metodo_pago: metodo, periodo_inicio: document.getElementById('pago-inicio').value, periodo_fin: document.getElementById('pago-fin').value }); } catch { /* demo */ }

  closeAllModals();
  toast(`Pago de ${fmt(monto)} registrado para ${colab.nombre}`, 'success');
  loadPagos();
}

// ── CATEGORÍA MODAL ───────────────────────────────────────
function openCategoriaModal() {
  document.getElementById('cat-nombre').value = '';
  document.getElementById('cat-desc').value   = '';
  openModal('modal-categoria');
}

async function submitCategoria() {
  const nombre = document.getElementById('cat-nombre').value.trim();
  if (!nombre) { toast('El nombre de categoría es obligatorio', 'error'); return; }
  MOCK.categorias.push({ _id: `cat_${Date.now()}`, nombre, descripcion: document.getElementById('cat-desc').value, activa: true });
  try { await Api.crearCategoria({ nombre, descripcion: document.getElementById('cat-desc').value }); } catch { /* demo */ }
  closeAllModals();
  toast(`Categoría "${nombre}" creada`, 'success');
  loadCategorias();
}

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Nav click
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // Enter en login
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });

  // Cerrar modal con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });

  // Check token
  const token = localStorage.getItem('april_token');
  if (token) {
    State.token   = token;
    State.usuario = MOCK.usuario;
    showApp();
  }
});
