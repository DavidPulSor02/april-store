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
  document.getElementById('scanner-modal').classList.remove('hidden');
  document.getElementById('scanner-result').classList.add('hidden');

  try {
    await loadJsQR();
  } catch {
    iToast('jsQR no disponible — usa el SKU manual', 'error');
  }

  try {
    Scanner.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode:  { ideal: 'environment' },
        width:       { ideal: 1280 },
        height:      { ideal: 720 },
        focusMode:   'continuous',
      }
    });

    const video = document.getElementById('scanner-video');
    video.srcObject = Scanner.stream;
    await video.play();

    Scanner.active = true;
    requestAnimationFrame(scanFrame);
  } catch (err) {
    console.warn('Camera error:', err.name);
    if (err.name === 'NotAllowedError') {
      iToast('Permiso de cámara denegado — usa el SKU manual', 'error');
    } else if (err.name === 'NotFoundError') {
      iToast('Cámara no encontrada — usa el SKU manual', 'error');
    }
    // Show manual input only mode
    document.getElementById('scanner-video').style.display = 'none';
    document.querySelector('.scanner-frame').style.display = 'none';
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
      // Debounce — no disparar el mismo código dos veces en 2s
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
  // Vibrar en iPad si está disponible
  if ('vibrate' in navigator) navigator.vibrate(60);

  // El raw puede ser el SKU directamente o una URL con el SKU
  let sku = raw.trim();
  if (sku.includes('/')) sku = sku.split('/').pop();

  searchBySKU(sku);
}

// ── Buscar por SKU ────────────────────────────────────────
function searchBySKU(sku) {
  if (!sku?.trim()) return;
  sku = sku.trim().toUpperCase();

  const prod = PRODUCTOS.find(p =>
    p.sku?.toUpperCase() === sku ||
    p._id === sku ||
    p.nombre.toUpperCase().includes(sku)
  );

  const resultEl = document.getElementById('scanner-result');

  if (prod) {
    Scanner.found = prod;
    document.getElementById('result-name').textContent = prod.nombre;
    document.getElementById('result-meta').textContent = `${fmt(prod.precio_venta)} · Stock: ${prod.stock_actual} uds · ${prod.categoria}`;
    resultEl.classList.remove('hidden');

    // Overlay de éxito en el viewport
    const overlay = document.getElementById('scanner-overlay');
    overlay.innerHTML = `<div style="background:rgba(74,140,106,.85);color:#fff;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:500">${prod.nombre} — ${fmt(prod.precio_venta)}</div>`;
    setTimeout(() => { overlay.innerHTML = ''; }, 2000);
  } else {
    Scanner.found = null;
    resultEl.classList.add('hidden');
    iToast(`Producto no encontrado: ${sku}`, 'error');
  }
}

// ── Agregar escaneado al carrito ──────────────────────────
function addScannedProduct() {
  if (!Scanner.found) return;
  addToCart(Scanner.found._id);
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
  video.srcObject = null;
  video.style.display = '';

  document.querySelector('.scanner-frame').style.display = '';
  document.getElementById('scanner-result').classList.add('hidden');
  document.getElementById('scanner-modal').classList.add('hidden');
  document.getElementById('manual-sku').value = '';
}

// ── Auto-cerrar si se escaneó un producto ─────────────────
// (opcional: cerrar automaticamente al agregar)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeScanner();
});
