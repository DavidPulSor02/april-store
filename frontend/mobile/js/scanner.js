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
  const resultEl = document.getElementById('scanner-result');
  if (resultEl) resultEl.classList.add('hidden');
  
  // Usar el sistema de modales del dashboard
  if (typeof openModal === 'function') {
    openModal('modal-scanner');
  } else {
    document.getElementById('modal-scanner').classList.remove('hidden');
    document.getElementById('modal-overlay').classList.add('open');
  }

  try {
    await loadJsQR();
  } catch (e) {
    console.error('jsQR load error:', e);
    toast('Error cargando lector de códigos', 'error');
  }

  try {
    const video = document.getElementById('scanner-video');
    if (!video) return;

    // Asegurar atributos para iOS/Safari
    video.setAttribute('playsinline', 'true');
    video.setAttribute('muted', 'true');

    Scanner.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode:  { ideal: 'environment' },
        width:       { ideal: 1280 },
        height:      { ideal: 720 },
      }
    });

    video.srcObject = Scanner.stream;
    
    // Esperar a que el video esté listo para reproducir
    video.onloadedmetadata = async () => {
      try {
        await video.play();
        Scanner.active = true;
        Scanner.lastTimestamp = 0;
        requestAnimationFrame(scanFrame);
      } catch (e) {
        console.error('Video play error:', e);
        toast('Error al iniciar cámara', 'error');
      }
    };

  } catch (err) {
    console.warn('Camera error:', err.name);
    toast('No se pudo acceder a la cámara', 'warning');
    const v = document.getElementById('scanner-video');
    if (v) v.style.display = 'none';
  }
}

// ── Frame loop para detección ─────────────────────────────
function scanFrame(timestamp) {
  if (!Scanner.active) return;

  // Throttle: solo escanear cada 200ms para no congelar dispositivos lentos
  if (timestamp - (Scanner.lastTimestamp || 0) < 200) {
    Scanner.animFrame = requestAnimationFrame(scanFrame);
    return;
  }
  Scanner.lastTimestamp = timestamp;

  const video  = document.getElementById('scanner-video');
  const canvas = document.getElementById('scanner-canvas');

  if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
    Scanner.animFrame = requestAnimationFrame(scanFrame);
    return;
  }

  // Usar dimensiones reales del video pero quizás escaladas si es muy grande
  // Para jsQR, 640x480 suele ser suficiente y mucho más rápido
  const displayWidth = 640;
  const displayHeight = (video.videoHeight / video.videoWidth) * displayWidth;
  
  canvas.width  = displayWidth;
  canvas.height = displayHeight;
  
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    Scanner.animFrame = requestAnimationFrame(scanFrame);
    return;
  }
  
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
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
  } catch (e) {
    console.error('Scan processing error:', e);
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

  const productosList = (typeof POS !== 'undefined' && POS.productos) ? POS.productos : (typeof State !== 'undefined' && State.cacheProductos ? State.cacheProductos : []);
  
  const prod = productosList.find(p =>
    p.sku?.toUpperCase() === sku ||
    p._id === sku ||
    p.nombre.toUpperCase().includes(sku)
  );

  const resultEl = document.getElementById('scanner-result');

  if (prod) {
    Scanner.found = prod;
    const nameEl = document.getElementById('res-name');
    const priceEl = document.getElementById('res-price');
    if (nameEl) nameEl.textContent = prod.nombre;
    if (priceEl) priceEl.textContent = fmt(prod.precio_venta);
    if (resultEl) resultEl.classList.remove('hidden');

    const overlay = document.getElementById('scanner-overlay');
    if (overlay) {
      overlay.innerHTML = `<div style="background:rgba(74,140,106,.85);color:#fff;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:500">${prod.nombre} — ${fmt(prod.precio_venta)}</div>`;
      setTimeout(() => { if (overlay) overlay.innerHTML = ''; }, 2000);
    }
  } else {
    Scanner.found = null;
    if (resultEl) resultEl.classList.add('hidden');
    toast(`Producto no encontrado: ${sku}`, 'error');
  }
}

// ── Agregar escaneado al carrito ──────────────────────────
function addScannedProduct() {
  if (!Scanner.found) return;
  if (typeof addToCartPOS === 'function') {
    addToCartPOS(Scanner.found._id);
  } else if (typeof addVentaItem === 'function') {
    addVentaItem(Scanner.found._id);
  }
  Scanner.found = null;
  const res = document.getElementById('scanner-result');
  if (res) res.classList.add('hidden');
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
  }

  const res = document.getElementById('scanner-result');
  if (res) res.classList.add('hidden');
  
  if (typeof closeAllModals === 'function') {
    closeAllModals();
  } else {
    document.getElementById('modal-scanner').classList.add('hidden');
    document.getElementById('modal-overlay').classList.remove('open');
  }
  
  const manual = document.getElementById('manual-sku');
  if (manual) manual.value = '';
}

// ── Auto-cerrar si se escaneó un producto ─────────────────
// (opcional: cerrar automaticamente al agregar)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeScanner();
});
