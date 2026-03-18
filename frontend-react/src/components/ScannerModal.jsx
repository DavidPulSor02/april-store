import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { X, Search } from 'lucide-react';

export default function ScannerModal({ onClose, onScan }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [active, setActive] = useState(true);
  const [manualSku, setManualSku] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let stream = null;
    let animFrame = null;
    let lastScanTime = 0;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // required for iOS
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
        setErrorMsg('No se pudo acceder a la cámara. Revisa los permisos.');
      }
    };

    const tick = (timestamp) => {
      if (!active) return;
      
      // Throttle scanning to save resources (e.g. 5 times per sec)
      if (timestamp - lastScanTime > 200) {
        lastScanTime = timestamp;
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const canvas = canvasRef.current;
          if (!canvas) return; // Unmounted
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            let sku = code.data.trim();
            if (sku.includes('/')) sku = sku.split('/').pop();
            handleScanSuccess(sku);
            return; // Detener animación un momento mientras procesa
          }
        }
      }
      animFrame = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      setActive(false);
      if (animFrame) cancelAnimationFrame(animFrame);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleScanSuccess = (sku) => {
    if ('vibrate' in navigator) navigator.vibrate(50);
    onScan(sku);
    onClose();
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualSku.trim()) {
      handleScanSuccess(manualSku.trim());
    }
  };

  return (
    <div className="modal-overlay open" style={{ zIndex: 9999 }}>
      <div className="modal modal-md open" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Escanear Producto</h3>
            <p className="modal-sub">Apunta con la cámara al código de barras o QR.</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        
        <div className="modal-body" style={{ padding: 0, position: 'relative', background: '#000', height: '300px' }}>
          {errorMsg ? (
            <div style={{ color: 'var(--danger)', padding: '24px', textAlign: 'center', background: '#fff', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {errorMsg}
            </div>
          ) : (
            <>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {/* Overlay guidlines */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '12px', boxShadow: '0 0 0 4000px rgba(0,0,0,0.5)' }}></div>
              <div style={{ position: 'absolute', top: '50%', left: '20%', right: '20%', height: '2px', background: 'rgba(200, 99, 122, 0.8)', boxShadow: '0 0 4px rgba(255,0,0,0.5)', animation: 'scanline 2s linear infinite' }}></div>
            </>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: 'none', background: 'var(--surface-1)', display: 'block' }}>
          <form onSubmit={handleManualSearch} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="O ingresa el SKU manualmente..." 
              value={manualSku}
              onChange={e => setManualSku(e.target.value)}
              style={{ flex: 1 }}
              autoFocus
            />
            <button type="submit" className="btn-primary"><Search size={16}/> Buscar</button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes scanline {
          0% { top: 25%; }
          50% { top: 75%; }
          100% { top: 25%; }
        }
      `}</style>
    </div>
  );
}
