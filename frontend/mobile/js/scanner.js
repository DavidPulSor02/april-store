/**
 * scanner.js — Escáner de código de barras / QR
 * Usa la cámara trasera del iPad vía WebRTC + jsQR
 * Fallback: entrada manual de SKU
 */

const Scanner = {
  stream:   null,
  animFrame:null,
  active:   false,
  lastScan: null,
  found:    null,   // producto encontrado
};

// ── Cargar jsQR dinámicamente ─────────────────────────────
function loadJsQR() {
  return new Promise((resolve, reject) => {
    if (window.jsQR) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ── Abrir escáner ─────────────────────────────────────────
async function openScanner() {
  document.getElementById('modal-scanner').classList.remove('hidden');
  document.getElementById('scanner-result').classList.add('hidden');
  document.getElementById('modal-overlay').classList.add('open');

  try {
    await loadJsQR();
  } catch {
    toast('jsQR no disponible — usa el SKU manual', 'error');
  }

  try {
    Scanner.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode:  { ideal: 'environment' },
        width:       { ideal: 1280 },
        height:      { ideal: 720 },
      }
    });

    const video = document.getElementById('scanner-video');
    video.srcObject = Scanner.stream;
    await video.play();

    Scanner.active = true;
    requestAnimationFrame(scanFrame);
  } catch (err) {
    console.warn('Camera error:', err.name);
    toast('Error de cámara — usa el SKU manual', 'warning');
    document.getElementById('scanner-video').style.display = 'none';
  }
}

// ── Frame loop para detección ─────────────────────────────
function scanFrame() {
  if (!Scanner.active) return;

  const video  = document.getElementById('scanner-video');
  const canvas = document.getElementById('scanner-canvas');

  if (video.readyState !== video.HAVE_ENOUGH_DATA) {
    Scanner.animFrame = requestAnimationFrame(scanFrame);
    return;
  }

  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (window.jsQR) {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      const now = Date.now();
      if (Scanner.lastScan !== code.data || now - (Scanner.lastScanTime || 0) > 2000) {
        Scanner.lastScan     = code.data;
        Scanner.lastScanTime = now;
        onCodeDetected(code.data);
      }
    }
  }

  Scanner.animFrame = requestAnimationFrame(scanFrame);
}

// ── Código detectado ──────────────────────────────────────
function onCodeDetected(raw) {
  if ('vibrate' in navigator) navigator.vibrate(60);
  let sku = raw.trim();
  if (sku.includes('/')) sku = sku.split('/').pop();
  searchBySKU(sku);
}

// ── Buscar por SKU ────────────────────────────────────────
function searchBySKU(sku) {
  if (!sku?.trim()) return;
  sku = sku.trim().toUpperCase();

  // Usar PRODUCTOS si está definido (pos.js) o POS.productos (pos_integrated.js)
  const productosList = (typeof POS !== 'undefined' && POS.productos) ? POS.productos : (typeof PRODUCTOS !== 'undefined' ? PRODUCTOS : []);
  
  const prod = productosList.find(p =>
    p.sku?.toUpperCase() === sku ||
    p._id === sku ||
    p.nombre.toUpperCase().includes(sku)
  );

  const resultEl = document.getElementById('scanner-result');

  if (prod) {
    Scanner.found = prod;
    document.getElementById('res-name').textContent = prod.nombre;
    document.getElementById('res-price').textContent = fmt(prod.precio_venta);
    resultEl.classList.remove('hidden');

    const overlay = document.getElementById('scanner-overlay');
    if (overlay) {
      overlay.innerHTML = `<div style="background:rgba(74,140,106,.85);color:#fff;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:500">${prod.nombre} — ${fmt(prod.precio_venta)}</div>`;
      setTimeout(() => { overlay.innerHTML = ''; }, 2000);
    }
  } else {
    Scanner.found = null;
    resultEl.classList.add('hidden');
    toast(`Producto no encontrado: ${sku}`, 'error');
  }
}

// ── Agregar escaneado al carrito ──────────────────────────
function addScannedProduct() {
  if (!Scanner.found) return;
  // Usar addToCartPOS si existe, si no addToCart
  if (typeof addToCartPOS === 'function') {
    addToCartPOS(Scanner.found._id);
  } else if (typeof addToCart === 'function') {
    addToCart(Scanner.found._id);
  }
  Scanner.found = null;
  document.getElementById('scanner-result').classList.add('hidden');
  closeScanner();
}

// ── Cerrar escáner ────────────────────────────────────────
function closeScanner() {
  Scanner.active = false;
  cancelAnimationFrame(Scanner.animFrame);

  if (Scanner.stream) {
    Scanner.stream.getTracks().forEach(t => t.stop());
    Scanner.stream = null;
  }

  const video = document.getElementById('scanner-video');
  if (video) {
    video.srcObject = null;
    video.style.display = '';
  }

  document.getElementById('scanner-result').classList.add('hidden');
  document.getElementById('modal-scanner').classList.add('hidden');
  if (document.getElementById('manual-sku')) document.getElementById('manual-sku').value = '';
  
  // No cerrar el overlay si hay otros modales abiertos, pero aquí asumimos que escáner es el principal
  if (!document.querySelector('.modal.open')) {
     document.getElementById('modal-overlay').classList.remove('open');
  }
}

// ── Auto-cerrar si se escaneó un producto ─────────────────
// (opcional: cerrar automaticamente al agregar)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeScanner();
});
