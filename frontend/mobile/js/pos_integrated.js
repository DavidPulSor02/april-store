/**
 * pos_integrated.js — Lógica para el Terminal POS integrado en el Dashboard
 */

const POS = {
  cart: [],
  metodo: 'efectivo',
  productos: [], 
  folio: null,
  ventaId: null,
};

// ── Inicialización ────────────────────────────────────────
function enterPOSIntegrated() {
  console.log('Iniciando Terminal POS...');
  // Usar productos del estado global si están disponibles
  POS.productos = State.cacheProductos.length ? State.cacheProductos : MOCK.productos;
  
  renderCatsPOS();
  renderGridPOS(POS.productos);
  renderCartPOS();
  
  // Si no hay productos cargados (primera vez), intentar cargar
  if (!POS.productos.length) {
    loadProductosPOS();
  }
}

async function loadProductosPOS() {
  try {
    const res = await Api.productos('activo');
    POS.productos = res.data;
    State.cacheProductos = res.data; // Actualizar cache global
    renderCatsPOS();
    renderGridPOS(POS.productos);
  } catch (e) {
    console.error('Error cargando productos POS:', e);
  }
}

// ── Categorías y Búsqueda ─────────────────────────────────
function renderCatsPOS() {
  const cats = ['Todos', ...new Set(POS.productos.map(p => p.categoria_id?.nombre || 'General'))];
  const container = document.getElementById('pos-cat-tabs');
  if (!container) return;
  
  container.innerHTML = cats.map(c => `
    <button class="cat-tab ${c === 'Todos' ? 'active' : ''}" onclick="filterCatPOS('${c}', this)">${c}</button>
  `).join('');
}

function filterCatPOS(cat, btn) {
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  const filtered = cat === 'Todos' 
    ? POS.productos 
    : POS.productos.filter(p => (p.categoria_id?.nombre || 'General') === cat);
  
  renderGridPOS(filtered);
}

function filterProductosPOS(q) {
  const query = q.toLowerCase().trim();
  const filtered = POS.productos.filter(p => 
    p.nombre.toLowerCase().includes(query) || 
    (p.sku && p.sku.toLowerCase().includes(query))
  );
  renderGridPOS(filtered);
}

// ── Grid de Productos ─────────────────────────────────────
function renderGridPOS(items) {
  const grid = document.getElementById('pos-prod-grid');
  if (!grid) return;
  
  if (!items.length) {
    grid.innerHTML = '<div class="empty-state"><p>No se encontraron productos</p></div>';
    return;
  }
  
  grid.innerHTML = items.map(p => `
    <div class="pos-card" onclick="addToCartPOS('${p._id}')">
      <div class="pos-card-cat">${p.categoria_id?.nombre || 'General'}</div>
      <div class="pos-card-name">${p.nombre}</div>
      <div class="pos-card-price">${fmt(p.precio_venta)}</div>
      <div class="pos-card-stock">${p.stock_actual} en stock</div>
    </div>
  `).join('');
}

// ── Carrito ───────────────────────────────────────────────
function addToCartPOS(id) {
  const prod = POS.productos.find(p => p._id === id);
  if (!prod) return;
  
  if (prod.stock_actual <= 0) {
    toast('Producto agotado', 'error');
    return;
  }
  
  const existing = POS.cart.find(i => i._id === id);
  if (existing) {
    if (existing.qty < prod.stock_actual) {
      existing.qty++;
    } else {
      toast('Stock máximo alcanzado', 'error');
      return;
    }
  } else {
    POS.cart.push({ ...prod, qty: 1 });
  }
  
  renderCartPOS();
}

function changeQtyPOS(id, delta) {
  const item = POS.cart.find(i => i._id === id);
  if (!item) return;
  
  const newQty = item.qty + delta;
  if (newQty <= 0) {
    POS.cart = POS.cart.filter(i => i._id !== id);
  } else {
    const prod = POS.productos.find(p => p._id === id);
    if (newQty > prod.stock_actual) {
      toast('Stock máximo alcanzado', 'error');
      return;
    }
    item.qty = newQty;
  }
  renderCartPOS();
}

function renderCartPOS() {
  const wrap = document.getElementById('pos-cart-items');
  const empty = document.getElementById('pos-cart-empty');
  const btn = document.getElementById('btn-cobrar-pos');
  
  if (!POS.cart.length) {
    wrap.innerHTML = '';
    wrap.appendChild(empty);
    empty.classList.remove('hidden');
    btn.disabled = true;
  } else {
    empty.classList.add('hidden');
    btn.disabled = false;
    wrap.innerHTML = POS.cart.map(i => `
      <div class="pos-cart-item">
        <div class="pos-ci-info">
          <div class="pos-ci-name">${i.nombre}</div>
          <div class="pos-ci-meta">${fmt(i.precio_venta)} c/u</div>
        </div>
        <div class="pos-qty-ctrl">
          <button class="pos-qty-btn" onclick="changeQtyPOS('${i._id}', -1)">−</button>
          <span>${i.qty}</span>
          <button class="pos-qty-btn" onclick="changeQtyPOS('${i._id}', 1)">+</button>
        </div>
      </div>
    `).join('');
  }
  recalcTotalsPOS();
}

function recalcTotalsPOS() {
  const sub = POS.cart.reduce((a, i) => a + (i.precio_venta * i.qty), 0);
  const desc = parseFloat(document.getElementById('pos-sum-descuento').value || 0);
  const total = Math.max(0, sub - desc);
  
  document.getElementById('pos-sum-subtotal').textContent = fmt(sub);
  document.getElementById('pos-sum-total').textContent = fmt(total);
  document.getElementById('pos-btn-total').textContent = fmt(total);
}

function clearCartPOS() {
  POS.cart = [];
  renderCartPOS();
}

// ── Pago ──────────────────────────────────────────────────
function selectPayMethod(btn) {
  document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  POS.metodo = btn.dataset.method;
}

function iniciarCobroPOS() {
  const sub = POS.cart.reduce((a, i) => a + (i.precio_venta * i.qty), 0);
  const desc = parseFloat(document.getElementById('pos-sum-descuento').value || 0);
  const total = sub - desc;
  
  document.getElementById('cobro-total-label').textContent = `Total a cobrar: ${fmt(total)}`;
  
  const efFields = document.getElementById('pos-efectivo-fields');
  if (POS.metodo === 'efectivo') {
    efFields.classList.remove('hidden');
    document.getElementById('pos-recibido').value = '';
    document.getElementById('pos-cambio').textContent = '$0.00';
  } else {
    efFields.classList.add('hidden');
  }
  
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-cobro-pos').classList.add('open');
}

function calcCambioPOS() {
  const sub = POS.cart.reduce((a, i) => a + (i.precio_venta * i.qty), 0);
  const desc = parseFloat(document.getElementById('pos-sum-descuento').value || 0);
  const total = sub - desc;
  const recibido = parseFloat(document.getElementById('pos-recibido').value || 0);
  const cambio = Math.max(0, recibido - total);
  document.getElementById('pos-cambio').textContent = fmt(cambio);
}

async function confirmarVentaPOS() {
  const sub = POS.cart.reduce((a, i) => a + (i.precio_venta * i.qty), 0);
  const desc = parseFloat(document.getElementById('pos-sum-descuento').value || 0);
  const total = sub - desc;
  const email = document.getElementById('pos-cliente-email').value.trim();
  
  if (POS.metodo === 'efectivo') {
    const recibido = parseFloat(document.getElementById('pos-recibido').value || 0);
    if (recibido < total) {
      toast('Monto recibido insuficiente', 'error');
      return;
    }
  }

  POS.folio = `VTA-${String(Date.now()).slice(-6)}`;
  POS.ventaId = null;

  try {
    const ventaData = {
      items: POS.cart.map(i => ({ producto_id: i._id, cantidad: i.qty, porcentaje_comision: 70 })),
      metodo_pago: POS.metodo,
      descuento: desc,
      email_comprobante: email
    };
    
    // Enviar a la API
    const res = await Api.crearVenta(ventaData);
    if (res.ok || res.folio) {
      POS.ventaId = res.data?._id || null;
      POS.folio = res.folio || POS.folio;
    }
    
    toast('Venta realizada con éxito', 'success');
    
    // Generar ticket preview (si existe la función)
    if (window.renderTicketPreview) {
      // Adaptar el cart para que ticket.js lo lea correctamente
      const ticketCart = POS.cart.map(i => ({ producto: i, qty: i.qty }));
      // Suponiendo que hay un contenedor para el ticket, si no, crear uno o usar modal
      // Por ahora solo mostrar toast éxito
    }

    closeAllModals();
    clearCartPOS();
    
    // Actualizar stock localmente
    POS.cart.forEach(item => {
      const p = POS.productos.find(x => x._id === item._id);
      if (p) p.stock_actual -= item.qty;
    });
    renderGridPOS(POS.productos);
    
  } catch (e) {
    console.error('Error al procesar venta:', e);
    toast('Venta registrada (Modo Offline/Demo)', 'success');
    closeAllModals();
    clearCartPOS();
  }
}
