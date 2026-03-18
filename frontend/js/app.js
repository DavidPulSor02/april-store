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

// ── Helpers ───────────────────────────────────────────────
const fmt  = (n) => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 });
const fmtD = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDT= (d) => d ? new Date(d).toLocaleString('es-MX',  { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const initials = (n) => n ? n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() : '??';

let toastTimer;
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  if (!el) return;
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

  if (!email || !pwd) { 
    errEl.textContent = 'Ingresa tu correo y contraseña.'; 
    errEl.classList.remove('hidden'); 
    return; 
  }

  errEl.classList.add('hidden');
  
  try {
    const res = await Api.login(email, pwd);
    State.usuario = res.usuario;
    State.token   = res.token;
    localStorage.setItem('april_token', res.token);
    showApp();
  } catch (err) {
    console.error('Error de login:', err);
    errEl.textContent = err.message || 'Error al iniciar sesión. Verifica tus credenciales.';
    errEl.classList.remove('hidden');
  }
}

function toggleLoginPassword() {
  const input = document.getElementById('login-password');
  const icon  = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    input.type = 'password';
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

// Enter listener for login
document.addEventListener('keydown', e => {
  const login = document.getElementById('login-screen');
  if (!login || login.classList.contains('hidden')) return;
  if (e.key === 'Enter') handleLogin();
});

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
  if (!u) return;

  document.getElementById('user-name').textContent     = u.nombre;
  document.getElementById('user-role').textContent     = u.rol === 'admin' ? 'Administradora' : 'Cajera';
  document.getElementById('user-initials').textContent = initials(u.nombre);

  // --- RESTRICCIONES POR ROL ---
  const isAdmin = u.rol === 'admin';
  
  // Ocultar grupos de navegación si no es admin
  document.getElementById('nav-group-principal').style.display      = isAdmin ? 'block' : 'none';
  document.getElementById('nav-group-catalogo').style.display       = isAdmin ? 'block' : 'none';
  document.getElementById('nav-group-colaboradores').style.display  = isAdmin ? 'block' : 'none';
  document.getElementById('nav-group-finanzas').style.display       = isAdmin ? 'block' : 'none';
  
  // Botón de reset solo para admin
  const resetWrap = document.getElementById('reset-db-btn-wrap');
  if (resetWrap) resetWrap.classList.toggle('hidden', !isAdmin);

  // Elementos extra en el topbar
  const topbarCta = document.getElementById('topbar-cta');
  if (topbarCta) topbarCta.style.display = isAdmin ? 'flex' : 'none';

  // Mostrar opción de cierre de caja para cajeras
  const cierreNav = document.getElementById('nav-cierre-caja');
  if (cierreNav) cierreNav.classList.toggle('hidden', isAdmin);

  // Redirección inicial
  if (isAdmin) {
    navigate('dashboard');
    loadDashboard();
    checkStockAlerts();
  } else {
    navigate('pos');
    // Forzar carga de productos POS
    if (typeof loadProductosPOS === 'function') loadProductosPOS();
  }

  // Validar sesión de caja
  checkEstadoCaja();
}

/**
 * SESIONES DE CAJA
 */
async function checkEstadoCaja() {
  if (State.token === 'demo-token') return;
  try {
    const res = await Api.get('/api/caja/estado');
    if (res.success && !res.caja) {
      openModal('modal-apertura');
    }
  } catch (e) {
    console.error('Error validando caja:', e);
  }
}

async function confirmarApertura() {
  const monto = parseFloat(document.getElementById('apertura-monto').value);
  if (isNaN(monto) || monto < 0) {
    showToast('Ingresa un monto inicial válido', 'error');
    return;
  }

  try {
    const res = await Api.post('/api/caja/abrir', { monto_apertura: monto });
    if (res.success) {
      closeAllModals();
      showToast('Caja abierta con éxito', 'success');
    } else {
      showToast(res.message || 'Error al abrir caja', 'error');
    }
  } catch (e) {
    showToast('Error de conexión con el servidor', 'error');
  }
}

function openCierreCaja() {
  // Aquí idealmente cargaríamos los totales del turno desde el servidor
  // Por ahora usaremos un estimado de ventas de la sesión actual
  const ventasTurno = State.ventasTurno || 0; 
  document.getElementById('cierre-ventas-val').textContent = fmt(ventasTurno);
  document.getElementById('cierre-esperado-val').textContent = fmt(ventasTurno); 
  openModal('modal-cierre');
}

async function submitCierreCaja() {
  const monto = parseFloat(document.getElementById('cierre-monto-real').value);
  const notas = document.getElementById('cierre-notas').value;
  
  if (isNaN(monto) || monto < 0) {
    showToast('Ingresa el monto contado en caja', 'error');
    return;
  }

  try {
    const res = await Api.post('/api/caja/cerrar', { 
      monto_cierre: monto,
      notas 
    });
    if (res.success) {
      showToast('Caja cerrada. ¡Buen turno!', 'success');
      setTimeout(() => handleLogout(), 1500);
    } else {
      showToast(res.message || 'Error al cerrar caja', 'error');
    }
  } catch (e) {
    showToast('Error al procesar el cierre', 'error');
  }
}

// ── NAVIGATION ────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: 'Dashboard', productos: 'Productos', categorias: 'Categorías',
  colaboradores: 'Colaboradoras', consignacion: 'Consignación',
  ventas: 'Ventas', contabilidad: 'Contabilidad', pagos: 'Pagos a colaboradoras',
  reportes: 'Reportes & Análisis', pos: 'Terminal POS',
};
const CTA_LABELS = {
  dashboard: 'Nueva venta', productos: 'Agregar producto', categorias: 'Nueva categoría',
  colaboradores: 'Nueva colaboradora', consignacion: 'Registrar entrada',
  ventas: 'Nueva venta', contabilidad: 'Nuevo movimiento', pagos: 'Registrar pago',
  reportes: 'Exportar reporte', pos: 'Escanear producto',
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
  if (page === 'pos')           enterPOSIntegrated();
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
  else if (active === 'pos')           openScanner();
  else openVentaModal();
}

// ── DASHBOARD ─────────────────────────────────────────────
async function loadDashboard() {
  // El dashboard ya no muestra cards de datos — solo verifica alertas de stock
  // para el badge del ícono de la campanita
  try {
    const res = await Api.productos('activo');
    const data = res.data || [];
    State.cacheProductos = data;
    checkStockAlerts();
  } catch (e) {
    // No crítico si falla
    console.warn('No se pudo verificar stock para alertas:', e);
  }
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
function renderProductosRows(data) {
  const tbody = document.getElementById('tbody-productos');
  document.getElementById('prod-count').textContent = `${data.length} producto${data.length !== 1 ? 's' : ''}`;
  tbody.innerHTML = data.length ? data.map(p => {
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
}

async function loadProductos() {
  const tipo    = document.getElementById('filter-tipo')?.value || '';
  const estatus = document.getElementById('filter-estatus-prod')?.value || '';
  const tbody   = document.getElementById('tbody-productos');
  
  tbody.innerHTML = '<tr><td colspan="8" class="loading-state">Cargando productos...</td></tr>';

  try {
    const res = await Api.productos(estatus);
    let data = res.data || [];
    State.cacheProductos = data; // Guardar en cache para POS y otros

    if (tipo) data = data.filter(p => p.tipo === tipo);
    renderProductosRows(data);

  } catch (err) {
    console.error('Error cargando productos:', err);
    tbody.innerHTML = '<tr><td colspan="8" class="error-state">Error al cargar productos</td></tr>';
  }
}

function filterProductosLocal(q) {
  const tipo    = document.getElementById('filter-tipo')?.value || '';
  let data = State.cacheProductos || [];
  if (tipo) data = data.filter(p => p.tipo === tipo);
  if (q.trim()) {
    const lq = q.toLowerCase();
    data = data.filter(p =>
      p.nombre.toLowerCase().includes(lq) ||
      (p.sku && p.sku.toLowerCase().includes(lq)) ||
      (p.categoria_id?.nombre && p.categoria_id.nombre.toLowerCase().includes(lq))
    );
  }
  renderProductosRows(data);
}

// ── COLABORADORES ─────────────────────────────────────────
function renderColabsGrid(data) {
  const grid = document.getElementById('colabs-grid');
  document.getElementById('colab-count').textContent = `${data.length} colaboradora${data.length !== 1 ? 's' : ''}`;
  grid.innerHTML = data.length ? data.map(c => `
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
    </div>`).join('') : '<div class="empty-state">Sin colaboradoras registradas</div>';
}

async function loadColaboradores() {
  const estatus = document.getElementById('filter-est-colab')?.value || 'activo';
  const grid = document.getElementById('colabs-grid');
  grid.innerHTML = '<div class="loading-state">Cargando...</div>';

  try {
    const res = await Api.get('/api/colaboradores' + (estatus ? `?estatus=${estatus}` : ''));
    const data = res.data || [];
    State.cacheColaboradores = data; // Actualizar cache
    renderColabsGrid(data);
  } catch (err) {
    console.error('Error cargando colaboradoras:', err);
    grid.innerHTML = '<div class="error-state">Error al cargar datos</div>';
  }
}

function filterColabsLocal(q) {
  let data = State.cacheColaboradores || [];
  if (q.trim()) {
    const lq = q.toLowerCase();
    data = data.filter(c =>
      c.nombre.toLowerCase().includes(lq) ||
      (c.especialidad && c.especialidad.toLowerCase().includes(lq))
    );
  }
  renderColabsGrid(data);
}

// ── VENTAS ────────────────────────────────────────────────
function renderVentasRows(data) {
  const tbody = document.getElementById('tbody-ventas');
  document.getElementById('ventas-count').textContent = `${data.length} venta${data.length !== 1 ? 's' : ''}`;
  tbody.innerHTML = data.length ? data.map(v => `
    <tr>
      <td class="cell-primary">${v.folio}</td>
      <td>${fmtDT(v.fecha)}</td>
      <td>${v.usuario_id?.nombre || '—'}</td>
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

async function loadVentas() {
  const metodo = document.getElementById('filter-metodo')?.value;
  const tbody = document.getElementById('tbody-ventas');
  tbody.innerHTML = '<tr><td colspan="7" class="loading-state">Cargando...</td></tr>';

  try {
    const res = await Api.get('/api/ventas' + (metodo ? `?metodo=${metodo}` : ''));
    const data = res.data || [];
    State.cacheVentas = data; // Guardar para reportes y dashboard
    renderVentasRows(data);
  } catch (err) {
    console.error('Error cargando ventas:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="error-state">Error al cargar datos</td></tr>';
  }
}

function filterVentasLocal(q) {
  let data = State.cacheVentas || [];
  if (q.trim()) {
    const lq = q.toLowerCase();
    data = data.filter(v =>
      v.folio.toLowerCase().includes(lq) ||
      (v.usuario_id?.nombre && v.usuario_id.nombre.toLowerCase().includes(lq))
    );
  }
  renderVentasRows(data);
}

// ── CONTABILIDAD ──────────────────────────────────────────
async function loadContabilidad() {
  const tipo = document.getElementById('filter-tipo-ct')?.value;
  const tbody = document.getElementById('tbody-contabilidad');
  const kpis = document.getElementById('contab-kpis');
  
  tbody.innerHTML = '<tr><td colspan="5" class="loading-state">Cargando...</td></tr>';

  try {
    const res = await Api.get('/api/contabilidad' + (tipo ? `?tipo=${tipo}` : ''));
    const data = res.data || [];
    State.cacheContabilidad = data; // Para gráficas

    // KPIs simplificados basados en la data cargada (en un sistema real el API daría estos agregados)
    const ingresos = data.filter(m=>m.tipo==='ingreso').reduce((a,m)=>a+m.monto,0);
    const egresos  = data.filter(m=>m.tipo==='egreso' ).reduce((a,m)=>a+m.monto,0);
    
    kpis.innerHTML = `
      ${kpiCard('rose',  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>', 'Ingresos', fmt(ingresos), 'Período actual', 'up')}
      ${kpiCard('green', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>','Egresos', fmt(egresos), 'Incluye pagos y gastos', '')}
      ${kpiCard('amber', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>', 'Balance', fmt(ingresos - egresos), 'Neto', ingresos > egresos ? 'up' : 'down')}
      ${kpiCard('blue',  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', 'Movimientos', data.length, 'Registrados', '')}
    `;

    tbody.innerHTML = data.length ? data.map(m => `
      <tr>
        <td>${fmtD(m.fecha)}</td>
        <td class="cell-primary">${m.concepto}</td>
        <td><span class="badge badge-neutral">${m.categoria_contable?.replace('_',' ') || 'otro'}</span></td>
        <td>${m.tipo === 'ingreso' ? '<span class="badge badge-success">Ingreso</span>' : '<span class="badge badge-danger">Egreso</span>'}</td>
        <td class="cell-primary" style="color:${m.tipo==='ingreso'?'var(--success)':'var(--danger)'}">${m.tipo==='ingreso'?'+':'−'}${fmt(m.monto)}</td>
      </tr>`).join('') : emptyRow(5, 'Sin movimientos');
  } catch (err) {
    console.error('Error cargando contabilidad:', err);
    tbody.innerHTML = '<tr><td colspan="5" class="error-state">Error al cargar datos</td></tr>';
  }
}

// ── CONSIGNACIONES ────────────────────────────────────────
function renderConsigRows(data) {
  const tbody = document.getElementById('tbody-consig');
  const countEl = document.getElementById('consig-count');
  if (countEl) countEl.textContent = `${data.length} consignación${data.length !== 1 ? 'es' : ''}`;
  tbody.innerHTML = data.length ? data.map(c => `
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

async function loadConsignaciones() {
  const tbody = document.getElementById('tbody-consig');
  tbody.innerHTML = '<tr><td colspan="7" class="loading-state">Cargando...</td></tr>';

  try {
    const res = await Api.get('/api/consignaciones');
    const data = res.data || [];
    State.cacheConsignaciones = data;
    renderConsigRows(data);
  } catch (err) {
    console.error('Error cargando consignaciones:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="error-state">Error al cargar datos</td></tr>';
  }
}

function filterConsigLocal(q) {
  let data = State.cacheConsignaciones || [];
  if (q.trim()) {
    const lq = q.toLowerCase();
    data = data.filter(c =>
      (c.producto_id?.nombre && c.producto_id.nombre.toLowerCase().includes(lq)) ||
      (c.colaborador_id?.nombre && c.colaborador_id.nombre.toLowerCase().includes(lq))
    );
  }
  renderConsigRows(data);
}

// ── PAGOS ─────────────────────────────────────────────────
async function loadPagos() {
  const tbody = document.getElementById('tbody-pagos');
  tbody.innerHTML = '<tr><td colspan="7" class="loading-state">Cargando...</td></tr>';

  try {
    const res = await Api.get('/api/pagos');
    const data = res.data || [];

    tbody.innerHTML = data.length ? data.map(p => `
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
  } catch (err) {
    console.error('Error cargando pagos:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="error-state">Error al cargar datos</td></tr>';
  }
}

// ── CATEGORIAS ────────────────────────────────────────────
async function loadCategorias() {
  const tbody = document.getElementById('tbody-cats');
  tbody.innerHTML = '<tr><td colspan="4" class="loading-state">Cargando...</td></tr>';

  try {
    const res = await Api.get('/api/categorias');
    const data = res.data || [];
    State.cacheCategorias = data; // Cache

    tbody.innerHTML = data.length ? data.map(c => `
      <tr>
        <td class="cell-primary">${c.nombre}</td>
        <td>${c.descripcion || '—'}</td>
        <td>${c.activa ? '<span class="badge badge-success">Activa</span>' : '<span class="badge badge-neutral">Inactiva</span>'}</td>
        <td>
          <button class="row-action-btn" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </td>
      </tr>`).join('') : '<tr><td colspan="4" class="empty-state">Sin categorías</td></tr>';
  } catch (err) {
    console.error('Error cargando categorías:', err);
    tbody.innerHTML = '<tr><td colspan="4" class="error-state">Error al cargar datos</td></tr>';
  }
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
  
  // Usar el cache cargado en loadProductos()
  const matches = State.cacheProductos.filter(p =>
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
  const p = State.cacheProductos.find(x => x._id === prodId);
  if (!p) return;
  document.getElementById('prod-search').value = '';
  document.getElementById('prod-results').classList.remove('open');

  const existing = State.ventaItems.find(i => i._id === prodId);
  if (existing) { 
    if (existing.qty < (p.stock_actual || 0)) existing.qty++; 
  }
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

  // Real — enviamos al servidor
  try {
    const res = await Api.post('/api/ventas', {
      items: State.ventaItems.map(i => ({ producto_id: i._id, cantidad: i.qty })),
      metodo_pago: metodo,
      descuento: desc
    });
    
    if (res.success) {
      toast('Venta registrada exitosamente', 'success');
      State.ventaItems = [];
      closeAllModals();
      if (document.getElementById('page-ventas').classList.contains('active')) loadVentas();
    }
  } catch (err) {
    console.error('Error en venta:', err);
    toast('Error al registrar venta', 'error');
  }
}

// Producto modal
async function openProductoModal(id) {
  document.getElementById('prod-id').value = id || '';
  document.getElementById('modal-prod-title').textContent = id ? 'Editar producto' : 'Nuevo producto';

  // Load categorias & colaboradores for selects
  const cats  = State.cacheCategorias;
  const colabs= State.cacheColaboradores;
  document.getElementById('prod-categoria').innerHTML   = cats.map(c => `<option value="${c._id}">${c.nombre}</option>`).join('');
  document.getElementById('prod-colaborador').innerHTML = `<option value="">— Tienda propia —</option>` + colabs.map(c => `<option value="${c._id}">${c.nombre}</option>`).join('');

  if (id) {
    const p = State.cacheProductos.find(x => x._id === id);
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
    const c = State.cacheColaboradores.find(x => x._id === id);
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
  const v = (State.cacheVentas || []).find(x => x._id === id);
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
async function liquidarPago(id) {
  try {
    await Api.post(`/api/pagos/${id}/liquidar`);
    toast('Pago liquidado correctamente', 'success');
    loadPagos();
  } catch (err) {
    console.error('Error liquidando pago:', err);
    toast('Error al liquidar pago', 'error');
  }
}

// ── STOCK ALERTS ─────────────────────────────────────────
async function checkStockAlerts() {
  const bajos = (State.cacheProductos || []).filter(p => p.stock_actual <= p.stock_minimo);
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
    State.cacheColaboradores.map(c => `<option value="${c._id}">${c.nombre}</option>`).join('');
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

  const prods = (State.cacheProductos || []).filter(p => p.colaborador_id?._id === colabId || p.colaborador_id === colabId);
  sel.innerHTML = '<option value="">Seleccionar producto…</option>' +
    prods.map(p => `<option value="${p._id}" data-precio="${p.precio_venta}">${p.nombre} — ${fmt(p.precio_venta)}</option>`).join('');

  sel.onchange = () => {
    const opt   = sel.selectedOptions[0];
    const colabId = document.getElementById('consig-colaborador').value;
    const colab   = State.cacheColaboradores.find(c => c._id === colabId);
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

  const colab   = State.cacheColaboradores.find(c => c._id === colabId);
  const prod    = State.cacheProductos.find(p => p._id === prodId);

  // Real API
  try { 
    await Api.post('/api/consignaciones', {
      colaborador_id: colabId,
      producto_id: prodId,
      cantidad_ingresada: cantidad,
      fecha_ingreso: new Date()
    });
    closeAllModals();
    toast(`Entrada registrada: ${cantidad} piezas de ${prod.nombre}`, 'success');
    loadConsignaciones();
  } catch (err) {
    console.error('Error en consignación:', err);
    toast('Error al registrar consignación', 'error');
  }
}

// ── PAGOS MODAL ───────────────────────────────────────────
function openPagoModal() {
  const sel = document.getElementById('pago-colaborador');
  sel.innerHTML = '<option value="">Seleccionar…</option>' +
    State.cacheColaboradores.map(c => `<option value="${c._id}" data-ventas="${c.ventas_mes||0}" data-pct="${c.porcentaje_comision}">${c.nombre}</option>`).join('');

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

  const colab = State.cacheColaboradores.find(c => c._id === colabId);

  try { 
    await Api.post('/api/pagos', { 
      colaborador_id: colabId, 
      monto, 
      metodo_pago: metodo, 
      periodo_inicio: document.getElementById('pago-inicio').value, 
      periodo_fin: document.getElementById('pago-fin').value 
    }); 
    closeAllModals();
    toast(`Pago de ${fmt(monto)} registrado para ${colab.nombre}`, 'success');
    loadPagos();
  } catch (err) {
    console.error('Error enviando pago:', err);
    toast('Error al registrar pago', 'error');
  }
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
    State.token = token;
    
    // Mostramos un loader o algo similar si fuera necesario
    // Por ahora, intentamos restaurar la sesión real inmediatamente
    Api.me()
      .then(res => {
        if (res.success && res.usuario) {
          State.usuario = res.usuario;
          showApp();
        } else {
          handleLogout();
        }
      })
      .catch(err => {
        console.warn('Sesión inválida o expirada:', err);
        handleLogout();
      });
  }
});

// ── RESET BASE DE DATOS ───────────────────────────────────
function openResetModal() {
  openModal('modal-reset-db');
}

async function confirmarResetDB() {
  const btn = document.getElementById('btn-confirm-reset');
  if (btn) { btn.textContent = 'Limpiando…'; btn.disabled = true; }

  try {
    const res = await Api.post('/admin/reset-db', {});
    if (res.success) {
      closeAllModals();
      toast('✅ Base de datos limpiada correctamente', 'success');
      // Recargar datos del dashboard
      setTimeout(() => {
        loadDashboard();
        checkStockAlerts();
      }, 500);
    } else {
      toast(res.message || 'Error al limpiar la base de datos', 'error');
    }
  } catch (err) {
    console.error('Error en reset:', err);
    toast('Error al conectar con el servidor', 'error');
  } finally {
    if (btn) { btn.textContent = 'Limpiar todo'; btn.disabled = false; }
  }
}
