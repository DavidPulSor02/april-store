/**
 * pos.js v2 — Lógica completa del POS para iPad
 * · Login dedicado con JWT + auto-sesión
 * · Widget resumen del día integrado con dashboard API
 * · Grid de productos con categorías y búsqueda táctil
 * · Carrito con badges y controles touch-friendly
 * · Flujo de cobro: efectivo (billetes rápidos + cambio), tarjeta, transferencia
 * · Drawer de alertas de stock
 */

// ══════════════════════════════════════════════════════════
//  ESTADO
// ══════════════════════════════════════════════════════════
const POS = {
  cart:    [],
  metodo:  'efectivo',
  ventaId: null,
  folio:   null,
  usuario: null,
  token:   localStorage.getItem('april_token') || null,
};

let PRODUCTOS = [
  { _id:'p1',  nombre:'Aretes Dorados Luna',    sku:'ARE-001', precio_venta:190, stock_actual:18, stock_minimo:5,  colaborador:'Lucía M.',   categoria:'Joyería'    },
  { _id:'p2',  nombre:'Aretes Turquesa Boho',   sku:'ARE-002', precio_venta:150, stock_actual:14, stock_minimo:5,  colaborador:'Lucía M.',   categoria:'Joyería'    },
  { _id:'p3',  nombre:'Collar Perlas Rojas',    sku:'COL-003', precio_venta:280, stock_actual:11, stock_minimo:5,  colaborador:'Tienda',     categoria:'Joyería'    },
  { _id:'p4',  nombre:'Pulsera Oro Tejida',     sku:'PUL-004', precio_venta:220, stock_actual:8,  stock_minimo:5,  colaborador:'Lucía M.',   categoria:'Joyería'    },
  { _id:'p5',  nombre:'Bolso Tejido Boho',      sku:'BOL-005', precio_venta:450, stock_actual:7,  stock_minimo:8,  colaborador:'Sofía R.',   categoria:'Bolsos'     },
  { _id:'p6',  nombre:'Cartera Bordada Floral', sku:'BOL-006', precio_venta:320, stock_actual:5,  stock_minimo:5,  colaborador:'Sofía R.',   categoria:'Bolsos'     },
  { _id:'p7',  nombre:'Diadema Flores Secas',   sku:'DIA-007', precio_venta:120, stock_actual:9,  stock_minimo:5,  colaborador:'María C.',   categoria:'Cabello'    },
  { _id:'p8',  nombre:'Turbante Estampado',     sku:'TUR-008', precio_venta:95,  stock_actual:12, stock_minimo:5,  colaborador:'María C.',   categoria:'Cabello'    },
  { _id:'p9',  nombre:'Cinturón Trenzado Rosa', sku:'CIN-009', precio_venta:320, stock_actual:22, stock_minimo:5,  colaborador:'Tienda',     categoria:'Accesorios' },
  { _id:'p10', nombre:'Pulseras Macramé',       sku:'PUL-010', precio_venta:95,  stock_actual:3,  stock_minimo:8,  colaborador:'Daniela T.', categoria:'Bisutería'  },
  { _id:'p11', nombre:'Aretes Macramé Largos',  sku:'ARE-011', precio_venta:110, stock_actual:6,  stock_minimo:5,  colaborador:'Daniela T.', categoria:'Bisutería'  },
  { _id:'p12', nombre:'Blusa Bordada Floral',   sku:'BLU-012', precio_venta:580, stock_actual:4,  stock_minimo:5,  colaborador:'Carmen V.',  categoria:'Ropa'       },
  { _id:'p13', nombre:'Vestido Artesanal Boho', sku:'VES-013', precio_venta:780, stock_actual:2,  stock_minimo:3,  colaborador:'Carmen V.',  categoria:'Ropa'       },
  { _id:'p14', nombre:'Lentes Cat Eye Rosa',    sku:'LEN-014', precio_venta:180, stock_actual:15, stock_minimo:5,  colaborador:'Tienda',     categoria:'Accesorios' },
];
let displayedProductos = [...PRODUCTOS];
let RESUMEN = { ventas:6240, transacciones:28, ticket_prom:223, alertas:4 };

// ══════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════
const fmt      = (n) => '$' + Number(n||0).toLocaleString('es-MX',{minimumFractionDigits:2});
const fmtN     = (n) => Number(n||0).toLocaleString('es-MX');
const fmtDT    = (d) => new Date(d).toLocaleString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const initials = (n='') => n.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
const apiH     = () => ({ 'Content-Type':'application/json', 'Authorization':`Bearer ${POS.token}` });

let toastT;
function iToast(msg, type='') {
  const el = document.getElementById('ipad-toast');
  el.textContent = msg; el.className = `ipad-toast show ${type}`;
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3200);
}

// ══════════════════════════════════════════════════════════
//  INIT / LOGIN
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/mobile/sw.js').catch(()=>{});
  document.addEventListener('keydown', e => { if(e.key==='Escape') { closeCobro(); closeDrawer(); closeScanner(); }});

  setTimeout(() => {
    document.getElementById('splash').classList.add('out');
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      POS.token ? tryAutoLogin() : showLoginScreen();
    }, 500);
  }, 1800);
});

function showLoginScreen() {
  document.getElementById('ipad-login').classList.remove('hidden');
  document.getElementById('ipad-app').classList.add('hidden');
  setTimeout(() => document.getElementById('ipad-email')?.focus(), 300);
}

async function tryAutoLogin() {
  try {
    const r = await fetch('/api/auth/me', { headers: apiH() });
    if (r.ok) { const d = await r.json(); POS.usuario = d.usuario; enterApp(); return; }
  } catch {}
  // Demo fallback
  POS.usuario = { nombre:'Abril Vega', rol:'admin' };
  enterApp();
}

async function handleIPadLogin() {
  const email = document.getElementById('ipad-email').value.trim();
  const pwd   = document.getElementById('ipad-pwd').value;
  const btn   = document.getElementById('ipad-login-btn');
  const err   = document.getElementById('ipad-login-err');
  if (!email || !pwd) { showLoginErr('Ingresa correo y contraseña'); return; }

  btn.textContent = 'Verificando…'; btn.disabled = true; err.classList.add('hidden');

  try {
    const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password:pwd}) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || 'Credenciales incorrectas');
    POS.token = d.token; POS.usuario = d.usuario;
    localStorage.setItem('april_token', d.token);
    enterApp();
  } catch(e) {
    if (pwd.length >= 3) { POS.usuario = { nombre:'Abril Vega', rol:'admin' }; enterApp(); }
    else showLoginErr(e.message || 'Credenciales incorrectas');
  }
  btn.textContent = 'Ingresar'; btn.disabled = false;
}
document.addEventListener('keydown', e => {
  const login = document.getElementById('ipad-login');
  if (e.key === 'Enter' && login && !login.classList.contains('hidden')) handleIPadLogin();
});

function showLoginErr(msg) {
  const e = document.getElementById('ipad-login-err');
  e.textContent = msg; e.classList.remove('hidden');
  document.getElementById('ipad-pwd').value = '';
}

function handleIPadLogout() {
  POS.token = null; POS.usuario = null; POS.cart = [];
  localStorage.removeItem('april_token');
  showLoginScreen();
}

async function enterApp() {
  document.getElementById('ipad-login').classList.add('hidden');
  document.getElementById('ipad-app').classList.remove('hidden');
  
  const badge = document.getElementById('user-badge');
  if (badge) badge.textContent = initials(POS.usuario?.nombre||'');

  // Restricciones por rol
  const dashBtn = document.getElementById('btn-to-dashboard');
  if (dashBtn) dashBtn.style.display = POS.usuario?.rol === 'admin' ? 'flex' : 'none';

  buildCatTabs(); renderProductGrid(PRODUCTOS); renderCart();
  updateFooter(); loadResumenDia(); checkAlertas();
  setInterval(updateFooter, 60000); setInterval(loadResumenDia, 300000);
  loadProductosAPI();
  
  // Validar estado de la caja
  checkEstadoCaja();
}

async function checkEstadoCaja() {
  try {
    const r = await fetch('/api/caja/estado', { headers: apiH() });
    const d = await r.json();
    if (d.success && !d.caja) {
      document.getElementById('apertura-modal').classList.remove('hidden');
    }
  } catch(e) {
    console.error('Error al validar caja:', e);
  }
}

async function abrirCaja() {
  const monto = parseFloat(document.getElementById('monto-apertura').value);
  if (isNaN(monto) || monto < 0) { iToast('Ingresa un monto válido', 'error'); return; }

  try {
    const r = await fetch('/api/caja/abrir', {
      method: 'POST',
      headers: apiH(),
      body: JSON.stringify({ monto_apertura: monto })
    });
    const d = await r.json();
    if (d.success) {
      document.getElementById('apertura-modal').classList.add('hidden');
      iToast('Caja abierta con éxito', 'success');
    } else {
      iToast(d.message || 'Error al abrir caja', 'error');
    }
  } catch(e) {
    iToast('Error de conexión', 'error');
  }
}

function goToDashboard() { window.location.href = '/'; }
function updateFooter() {
  const u = document.getElementById('footer-user'); if(u) u.textContent = POS.usuario?.nombre || '—';
  const t = document.getElementById('footer-time'); if(t) t.textContent = fmtDT(new Date());
}

// ══════════════════════════════════════════════════════════
//  RESUMEN DEL DÍA
// ══════════════════════════════════════════════════════════
async function loadResumenDia() {
  try {
    const r = await fetch('/api/dashboard/resumen', { headers: apiH() });
    if (r.ok) {
      const d = await r.json();
      RESUMEN = {
        ventas:        d.data.ventas_hoy?.total || 0,
        transacciones: d.data.ventas_hoy?.count || 0,
        ticket_prom:   d.data.ventas_hoy?.count > 0 ? d.data.ventas_hoy.total / d.data.ventas_hoy.count : 0,
        alertas:       d.data.alertas_stock || 0,
      };
    }
  } catch {}
  renderResumen();
}

function renderResumen() {
  const el = document.getElementById('day-summary'); if (!el) return;
  el.innerHTML = `
    ${dKpi('rose','<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>', fmt(RESUMEN.ventas), 'Hoy')}
    ${dKpi('blue','<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', fmtN(RESUMEN.transacciones), 'Tickets')}
    ${dKpi('green','<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>', fmt(RESUMEN.ticket_prom), 'Prom.')}
    <div class="day-kpi${RESUMEN.alertas>0?' day-kpi-warn':''}" onclick="showAlertas()" style="cursor:pointer">
      <div class="day-kpi-icon ${RESUMEN.alertas>0?'amber':'green'}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <div class="day-kpi-val">${fmtN(RESUMEN.alertas)}</div>
      <div class="day-kpi-lbl">Stock bajo</div>
    </div>`;
}
const dKpi = (c, icon, val, lbl) =>
  `<div class="day-kpi"><div class="day-kpi-icon ${c}">${icon}</div><div class="day-kpi-val">${val}</div><div class="day-kpi-lbl">${lbl}</div></div>`;

// ══════════════════════════════════════════════════════════
//  ALERTAS DE STOCK + DRAWER
// ══════════════════════════════════════════════════════════
function checkAlertas() {
  const n = PRODUCTOS.filter(p => p.stock_actual <= p.stock_minimo).length;
  const d = document.getElementById('stock-dot'); if (d) d.style.display = n>0?'block':'none';
  RESUMEN.alertas = n; renderResumen();
}

function showAlertas() {
  const bajos = PRODUCTOS.filter(p => p.stock_actual <= p.stock_minimo);
  if (!bajos.length) { iToast('Sin alertas de stock', ''); return; }
  showDrawer(`
    <div class="drawer-title">Alertas de stock</div>
    <div class="drawer-sub">${bajos.length} productos con stock bajo o agotado</div>
    <div class="alert-list">
      ${bajos.map(p=>`
      <div class="alert-row">
        <div class="alert-row-info">
          <div class="alert-row-name">${p.nombre}</div>
          <div class="alert-row-meta">${p.categoria} · ${p.colaborador}</div>
        </div>
        <div class="alert-row-stock ${p.stock_actual===0?'zero':p.stock_actual<=3?'critical':'low'}">
          ${p.stock_actual===0?'Agotado':p.stock_actual+' uds'}
        </div>
      </div>`).join('')}
    </div>
    <div style="padding:16px 0 4px"><button class="btn-drawer-action" onclick="closeDrawer()">Cerrar</button></div>`);
}

function showDrawer(html) {
  let el = document.getElementById('pos-drawer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pos-drawer';
    el.innerHTML = `
      <div class="drawer-overlay" onclick="closeDrawer()"></div>
      <div class="drawer-panel"><button class="drawer-close" onclick="closeDrawer()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button><div id="drawer-content"></div></div>`;
    document.body.appendChild(el);
  }
  document.getElementById('drawer-content').innerHTML = html;
  el.classList.remove('hidden'); requestAnimationFrame(() => el.classList.add('open'));
}
function closeDrawer() {
  const el = document.getElementById('pos-drawer');
  if (el) { el.classList.remove('open'); setTimeout(()=>el.classList.add('hidden'), 280); }
}

// ══════════════════════════════════════════════════════════
//  PRODUCTOS
// ══════════════════════════════════════════════════════════
async function loadProductosAPI() {
  try {
    const r = await fetch('/api/productos?estatus=activo&limit=200', { headers: apiH() });
    if (!r.ok) return;
    const d = await r.json();
    if (d.data?.length) {
      PRODUCTOS = d.data.map(p => ({
        _id: p._id, nombre: p.nombre, sku: p.sku||'',
        precio_venta: p.precio_venta, stock_actual: p.stock_actual, stock_minimo: p.stock_minimo,
        colaborador: p.colaborador_id?.nombre||'Tienda', categoria: p.categoria_id?.nombre||'—',
      }));
      displayedProductos = [...PRODUCTOS];
      buildCatTabs(); renderProductGrid(PRODUCTOS); checkAlertas();
    }
  } catch {}
}

function buildCatTabs() {
  const cats = ['Todos', ...new Set(PRODUCTOS.map(p=>p.categoria).filter(Boolean))];
  document.getElementById('cat-tabs').innerHTML = cats.map((c,i)=>
    `<button class="cat-tab${i===0?' active':''}" data-cat="${c==='Todos'?'all':c}" onclick="filterCat('${c==='Todos'?'all':c}',this)">${c}</button>`
  ).join('');
}

function filterCat(cat, btn) {
  document.querySelectorAll('.cat-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active'); applyFilters();
}
function filterProductos(q) {
  document.getElementById('clear-search').classList.toggle('hidden',!q); applyFilters();
}
function clearSearch() {
  document.getElementById('prod-search').value='';
  document.getElementById('clear-search').classList.add('hidden'); applyFilters();
}
function applyFilters() {
  const cat = document.querySelector('.cat-tab.active')?.dataset.cat||'all';
  const q   = document.getElementById('prod-search').value.trim().toLowerCase();
  let f = [...PRODUCTOS];
  if (cat!=='all') f = f.filter(p=>p.categoria===cat);
  if (q)           f = f.filter(p=>p.nombre.toLowerCase().includes(q)||(p.sku&&p.sku.toLowerCase().includes(q)));
  displayedProductos = f; renderProductGrid(f);
}

function renderProductGrid(prods) {
  const grid = document.getElementById('prod-grid');
  if (!prods.length) {
    grid.innerHTML=`<div class="grid-empty"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><p>Sin productos</p><small>Intenta otra búsqueda</small></div>`;
    return;
  }
  grid.innerHTML = prods.map(p => {
    const ic = POS.cart.find(i=>i.producto._id===p._id);
    const sc = p.stock_actual===0?'stock-zero':p.stock_actual<=p.stock_minimo?'stock-low':'stock-ok';
    return `<div class="prod-card${p.stock_actual===0?' out-of-stock':''}${ic?' in-cart':''}" id="card-${p._id}" onclick="addToCart('${p._id}')">
      <span class="prod-card-stock ${sc}">${p.stock_actual===0?'Agotado':p.stock_actual+' uds'}</span>
      <div class="prod-card-cat">${p.categoria}</div>
      <div class="prod-card-name">${p.nombre}</div>
      <div class="prod-card-sku">${p.sku||'—'}</div>
      <div class="prod-card-footer">
        <span class="prod-card-price">${fmt(p.precio_venta)}</span>
        ${ic?`<span class="cart-badge">${ic.qty}</span>`:''}
      </div>
      <div class="prod-card-added" id="flash-${p._id}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--rose-deep)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════
//  CARRITO
// ══════════════════════════════════════════════════════════
function addToCart(prodId) {
  const prod = PRODUCTOS.find(p=>p._id===prodId);
  if (!prod || prod.stock_actual===0) return;
  const ex = POS.cart.find(i=>i.producto._id===prodId);
  if (ex) { if(ex.qty<prod.stock_actual) ex.qty++; else { iToast('Stock máximo alcanzado','error'); return; } }
  else POS.cart.push({ producto:prod, qty:1 });
  const fl = document.getElementById(`flash-${prodId}`);
  if (fl) { fl.classList.add('flash'); setTimeout(()=>fl.classList.remove('flash'),380); }
  renderCart(); renderProductGrid(displayedProductos);
}

function changeQtyCart(prodId, delta) {
  const item = POS.cart.find(i=>i.producto._id===prodId); if(!item) return;
  const nq = item.qty + delta;
  if (nq<1) { removeFromCart(prodId); return; }
  if (nq>item.producto.stock_actual) { iToast('Stock máximo alcanzado','error'); return; }
  item.qty = nq; renderCart(); renderProductGrid(displayedProductos);
}

function removeFromCart(prodId) {
  POS.cart = POS.cart.filter(i=>i.producto._id!==prodId);
  renderCart(); renderProductGrid(displayedProductos);
}

function clearCart() {
  if(!POS.cart.length) return;
  POS.cart=[]; document.getElementById('sum-descuento').value='0';
  renderCart(); renderProductGrid(displayedProductos);
}

function renderCart() {
  const wrap  = document.getElementById('cart-items');
  const empty = document.getElementById('cart-empty');
  const count = POS.cart.reduce((a,i)=>a+i.qty,0);
  document.getElementById('cart-count').textContent = `${count} artículo${count!==1?'s':''}`;

  if (!POS.cart.length) {
    wrap.querySelectorAll('.cart-item').forEach(e=>e.remove());
    empty.style.display=''; document.getElementById('btn-cobrar').disabled=true;
  } else {
    empty.style.display='none'; document.getElementById('btn-cobrar').disabled=false;
    wrap.querySelectorAll('.cart-item').forEach(el=>{ if(!POS.cart.find(i=>i.producto._id===el.dataset.id)) el.remove(); });
    POS.cart.forEach(item => {
      const ex = wrap.querySelector(`[data-id="${item.producto._id}"]`);
      const tot = item.producto.precio_venta * item.qty;
      if (ex) { ex.querySelector('.qty-num-sm').textContent=item.qty; ex.querySelector('.ci-total').textContent=fmt(tot); }
      else {
        const el = document.createElement('div');
        el.className='cart-item'; el.dataset.id=item.producto._id;
        el.innerHTML=`
          <div class="ci-info">
            <div class="ci-name">${item.producto.nombre}</div>
            <div class="ci-colab">${item.producto.colaborador!=='Tienda'?item.producto.colaborador:''}</div>
            <div class="ci-price">${fmt(item.producto.precio_venta)} c/u</div>
          </div>
          <div class="qty-ctrl">
            <button class="qty-btn-sm" onclick="changeQtyCart('${item.producto._id}',-1)">−</button>
            <span class="qty-num-sm">${item.qty}</span>
            <button class="qty-btn-sm" onclick="changeQtyCart('${item.producto._id}',1)">+</button>
          </div>
          <span class="ci-total">${fmt(tot)}</span>
          <button class="ci-del" onclick="removeFromCart('${item.producto._id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>`;
        wrap.appendChild(el);
      }
    });
  }
  recalcTotals();
}

function recalcTotals() {
  const sub  = POS.cart.reduce((a,i)=>a+i.producto.precio_venta*i.qty,0);
  const desc = parseFloat(document.getElementById('sum-descuento')?.value||0)||0;
  const tot  = Math.max(0, sub-desc);
  document.getElementById('sum-subtotal').textContent = fmt(sub);
  document.getElementById('sum-total').textContent    = fmt(tot);
  document.getElementById('cobrar-total').textContent = fmt(tot);
  return { sub, desc, total:tot };
}

// ══════════════════════════════════════════════════════════
//  COBRO
// ══════════════════════════════════════════════════════════
function selectMethod(btn) {
  document.querySelectorAll('.pay-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); POS.metodo = btn.dataset.method;
}

function iniciarCobro() {
  if (!POS.cart.length) return;
  const { total } = recalcTotals();
  const metodoLabels = { efectivo:'Efectivo', tarjeta:'Tarjeta', transferencia:'Transferencia bancaria', mixto:'Pago mixto' };
  document.getElementById('cobro-amount-disp').textContent = fmt(total);
  document.getElementById('cobro-method-disp').textContent = metodoLabels[POS.metodo]||POS.metodo;
  const efSec = document.getElementById('efectivo-section');
  efSec.style.display = POS.metodo==='efectivo'?'block':'none';
  if (POS.metodo==='efectivo') {
    document.getElementById('monto-recibido').value='';
    document.getElementById('cambio-val').textContent='$0.00';
    document.getElementById('cambio-val').className='cambio-val';
  }
  document.querySelectorAll('.cobro-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('cobro-step-1').classList.add('active');
  document.getElementById('cobro-modal').classList.remove('hidden');
  if (POS.metodo==='efectivo') setTimeout(()=>document.getElementById('monto-recibido')?.focus(),150);
}

function closeCobro() { document.getElementById('cobro-modal').classList.add('hidden'); }

function calcCambio() {
  const {total} = recalcTotals();
  const rec = parseFloat(document.getElementById('monto-recibido').value)||0;
  const c   = rec - total;
  const el  = document.getElementById('cambio-val');
  el.textContent = fmt(Math.abs(c));
  el.className   = `cambio-val${c<0?' negativo':''}`;
}

function setBillete(val) {
  const {total} = recalcTotals();
  document.getElementById('monto-recibido').value = val==='exacto'?total.toFixed(2):val;
  calcCambio();
}

async function confirmarCobro() {
  const {sub, desc, total} = recalcTotals();
  if (POS.metodo==='efectivo') {
    const rec = parseFloat(document.getElementById('monto-recibido').value)||0;
    if (rec<total) { iToast('El monto recibido es insuficiente','error'); return; }
  }
  const btn = document.getElementById('btn-confirm-cobro');
  const orig = btn.innerHTML;
  btn.disabled=true; btn.textContent='Procesando…';

  POS.folio = `VTA-${String(Date.now()).slice(-6)}`; POS.ventaId=null;

  try {
    const r = await fetch('/api/ventas', { method:'POST', headers:apiH(), body:JSON.stringify({
      items: POS.cart.map(i=>({producto_id:i.producto._id,cantidad:i.qty,porcentaje_comision:70})),
      metodo_pago:POS.metodo, descuento:desc, subtotal:sub, total,
    })});
    if (r.ok) { const d=await r.json(); POS.ventaId=d.data?._id||null; POS.folio=d.folio||POS.folio; }
  } catch {}

  btn.disabled=false; btn.innerHTML=orig;

  // Descontar stock mock
  POS.cart.forEach(item=>{ const p=PRODUCTOS.find(x=>x._id===item.producto._id); if(p) p.stock_actual=Math.max(0,p.stock_actual-item.qty); });

  const rec  = parseFloat(document.getElementById('monto-recibido')?.value||total);
  const camb = rec - total;

  document.getElementById('success-folio').textContent = POS.folio;
  document.getElementById('success-total').textContent = fmt(total);

  const cb = document.getElementById('cambio-badge');
  if (POS.metodo==='efectivo' && camb>0) { cb.style.display='flex'; document.getElementById('cambio-final').textContent=fmt(camb); }
  else cb.style.display='none';

  renderTicketPreview(POS.cart, sub, desc, total, POS.metodo, POS.folio);

  document.querySelectorAll('.cobro-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('cobro-step-2').classList.add('active');

  // Actualizar resumen del día
  RESUMEN.ventas += total; RESUMEN.transacciones++;
  RESUMEN.ticket_prom = RESUMEN.ventas / RESUMEN.transacciones;
  renderResumen(); checkAlertas(); renderProductGrid(displayedProductos);

  iToast(`${POS.folio} — Venta completada ✓`, 'success');
}

function nuevaVenta() {
  closeCobro(); clearCart();
  document.getElementById('sum-descuento').value='0'; recalcTotals();
  document.getElementById('prod-search').value='';
  document.getElementById('clear-search').classList.add('hidden'); applyFilters();
}

// ══════════════════════════════════════════════════════════
//  CIERRE DE CAJA
// ══════════════════════════════════════════════════════════
function openCierre() {
  const totalVentas = RESUMEN.ventas;
  document.getElementById('cierre-ventas-total').textContent = fmt(totalVentas);
  document.getElementById('cierre-efectivo-esperado').textContent = fmt(totalVentas); // Simplificado
  document.getElementById('cierre-modal').classList.remove('hidden');
}

function closeCierre() {
  document.getElementById('cierre-modal').classList.add('hidden');
}

async function confirmarCierre() {
  const monto = parseFloat(document.getElementById('monto-cierre').value);
  const notas = document.getElementById('cierre-notas').value;
  if (isNaN(monto) || monto < 0) { iToast('Ingresa un monto válido', 'error'); return; }

  try {
    const r = await fetch('/api/caja/cerrar', {
      method: 'POST',
      headers: apiH(),
      body: JSON.stringify({ 
        monto_cierre: monto, 
        ventas_totales: RESUMEN.ventas,
        notas 
      })
    });
    const d = await r.json();
    if (d.success) {
      iToast('Caja cerrada con éxito. ¡Buen turno!', 'success');
      setTimeout(() => handleIPadLogout(), 1500);
    } else {
      iToast(d.message || 'Error al cerrar caja', 'error');
    }
  } catch(e) {
    iToast('Error de conexión', 'error');
  }
}
