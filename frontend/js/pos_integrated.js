/**
 * pos_integrated.js
 * Lógica para la Terminal POS integrada en la SPA
 */

const POS_STATE = {
  productos: [],
  cart:      [],
  metodo:    'efectivo',
  filtroCat: 'all'
};

async function loadProductosPOS() {
  const grid = document.getElementById('pos-prod-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="loading-inline">Cargando productos…</div>';

  try {
    const res = await Api.get('/api/productos?estatus=activo&limit=100');
    if (res.success) {
      POS_STATE.productos = res.data.map(p => ({
        _id: p._id,
        nombre: p.nombre,
        sku: p.sku || '',
        precio: p.precio_venta,
        stock: p.stock_actual,
        imagen: p.imagen_url || '',
        categoria: p.categoria_id?.nombre || 'General'
      }));
      renderPOSGrid();
      renderPOSCategories();
    }
  } catch (e) {
    grid.innerHTML = '<div class="error-inline">Error al cargar productos</div>';
  }
}

function renderPOSCategories() {
  const container = document.getElementById('pos-cat-filter');
  if (!container) return;

  const cats = ['all', ...new Set(POS_STATE.productos.map(p => p.categoria))];
  container.innerHTML = cats.map(c => `
    <button class="cat-pill ${POS_STATE.filtroCat === c ? 'active' : ''}" onclick="filterPOSByCat('${c}')">
      ${c === 'all' ? 'Todos' : c}
    </button>
  `).join('');
}

function filterPOSByCat(cat) {
  POS_STATE.filtroCat = cat;
  renderPOSGrid();
  renderPOSCategories();
}

function searchPOS(q) {
  const query = q.toLowerCase().trim();
  renderPOSGrid(query);
}

function renderPOSGrid(query = '') {
  const grid = document.getElementById('pos-prod-grid');
  if (!grid) return;

  let filtered = POS_STATE.productos;
  if (POS_STATE.filtroCat !== 'all') {
    filtered = filtered.filter(p => p.categoria === POS_STATE.filtroCat);
  }
  if (query) {
    filtered = filtered.filter(p => 
      p.nombre.toLowerCase().includes(query) || 
      p.sku.toLowerCase().includes(query)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-grid">No se encontraron productos</div>';
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="pos-card ${p.stock <= 0 ? 'out-of-stock' : ''}" onclick="addToCartPOS('${p._id}')">
      <div class="pos-card-img">
        <img src="${p.imagen || 'https://via.placeholder.com/150?text=Sin+Imagen'}" alt="${p.nombre}" loading="lazy">
      </div>
      <div class="pos-card-stock ${p.stock <= 5 ? 'low' : ''}">${p.stock} pzas.</div>
      <div class="pos-card-cat">${p.categoria}</div>
      <div class="pos-card-name">${p.nombre}</div>
      <div class="pos-card-price">${fmt(p.precio)}</div>
    </div>
  `).join('');
}

function addToCartPOS(id) {
  const p = POS_STATE.productos.find(x => x._id === id);
  if (!p || p.stock <= 0) return;

  const existing = POS_STATE.cart.find(item => item.producto._id === id);
  if (existing) {
    if (existing.cantidad < p.stock) {
      existing.cantidad++;
    } else {
      showToast('No hay más stock disponible', 'warning');
    }
  } else {
    POS_STATE.cart.push({ producto: p, cantidad: 1 });
  }
  renderPOSCart();
}

function removeFromCartPOS(id) {
  const idx = POS_STATE.cart.findIndex(item => item.producto._id === id);
  if (idx > -1) {
    if (POS_STATE.cart[idx].cantidad > 1) {
      POS_STATE.cart[idx].cantidad--;
    } else {
      POS_STATE.cart.splice(idx, 1);
    }
  }
  renderPOSCart();
}

function deleteFromCartPOS(id) {
  POS_STATE.cart = POS_STATE.cart.filter(item => item.producto._id !== id);
  renderPOSCart();
}

function renderPOSCart() {
  const list = document.getElementById('pos-items-list');
  const empty = document.getElementById('pos-empty-cart-msg');
  const btnCobrar = document.getElementById('pos-cobrar-btn');
  
  if (POS_STATE.cart.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    btnCobrar.disabled = true;
  } else {
    empty.classList.add('hidden');
    btnCobrar.disabled = false;
    list.innerHTML = POS_STATE.cart.map(item => `
      <div class="pos-cart-item">
        <div class="item-info">
          <div class="item-name">${item.producto.nombre}</div>
          <div class="item-price">${fmt(item.producto.precio)} c/u</div>
        </div>
        <div class="item-qty-ctrl">
          <button onclick="removeFromCartPOS('${item.producto._id}')">−</button>
          <span>${item.cantidad}</span>
          <button onclick="addToCartPOS('${item.producto._id}')">+</button>
        </div>
        <div class="item-subtotal">${fmt(item.producto.precio * item.cantidad)}</div>
        <button class="item-del" onclick="deleteFromCartPOS('${item.producto._id}')">×</button>
      </div>
    `).join('');
  }
  recalcTotalsPOS();
}

function recalcTotalsPOS() {
  const subtotal = POS_STATE.cart.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
  const descuento = parseFloat(document.getElementById('pos-sum-descuento').value) || 0;
  const total = Math.max(0, subtotal - descuento);

  document.getElementById('pos-sum-subtotal').textContent = fmt(subtotal);
  document.getElementById('pos-sum-total').textContent = fmt(total);
  document.getElementById('pos-btn-total-val').textContent = fmt(total);
  
  // Guardar totales en State global para el cierre de caja
  State.ventasTurno = (State.ventasTurno || 0) + 0; // Se actualiza al confirmar
}

function selectPayMethod(btn) {
  document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  POS_STATE.metodo = btn.dataset.method;
}

function iniciarCobroPOS() {
  const subtotal = POS_STATE.cart.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
  const descuento = parseFloat(document.getElementById('pos-sum-descuento').value) || 0;
  const total = subtotal - descuento;

  document.getElementById('cobro-total-label').textContent = `Total a pagar: ${fmt(total)}`;
  
  const efFields = document.getElementById('pos-efectivo-fields');
  if (POS_STATE.metodo === 'efectivo') {
    efFields.classList.remove('hidden');
    document.getElementById('pos-recibido').value = '';
    document.getElementById('pos-cambio').textContent = '$0.00';
  } else {
    efFields.classList.add('hidden');
  }

  openModal('modal-cobro-pos');
}

function calcCambioPOS() {
  const subtotal = POS_STATE.cart.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
  const descuento = parseFloat(document.getElementById('pos-sum-descuento').value) || 0;
  const total = subtotal - descuento;
  
  const recibido = parseFloat(document.getElementById('pos-recibido').value) || 0;
  const cambio = Math.max(0, recibido - total);
  
  document.getElementById('pos-cambio').textContent = fmt(cambio);
  const btn = document.getElementById('btn-finalizar-venta-pos');
  btn.disabled = (recibido < total && POS_STATE.metodo === 'efectivo');
}

async function confirmarVentaPOS() {
  const subtotal = POS_STATE.cart.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
  const descuento = parseFloat(document.getElementById('pos-sum-descuento').value) || 0;
  const total = subtotal - descuento;
  const email = document.getElementById('pos-cliente-email').value;

  const btn = document.getElementById('btn-finalizar-venta-pos');
  btn.disabled = true;
  btn.textContent = 'Procesando…';

  try {
    const res = await Api.post('/api/ventas', {
      items: POS_STATE.cart.map(i => ({
        producto_id: i.producto._id,
        cantidad: i.cantidad
      })),
      metodo_pago: POS_STATE.metodo,
      descuento: descuento,
      subtotal: subtotal,
      total: total,
      cliente_email: email
    });

    if (res.success) {
      // Actualizar contador del turno
      State.ventasTurno = (State.ventasTurno || 0) + total;
      
      closeAllModals();
      document.getElementById('exito-folio').textContent = `Folio: ${res.data.folio || 'VTA-000000'}`;
      openModal('modal-exito-pos');
      
      // Limpiar carrito
      POS_STATE.cart = [];
      renderPOSCart();
      
      // Recargar stock en el grid
      loadProductosPOS();
    } else {
      showToast(res.message || 'Error al procesar la venta', 'error');
    }
  } catch (e) {
    showToast('Error de red', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Finalizar venta';
  }
}

function clearCartPOS() {
  if (POS_STATE.cart.length === 0) return;
  if (confirm('¿Vaciar el carrito actual?')) {
    POS_STATE.cart = [];
    renderPOSCart();
  }
}
