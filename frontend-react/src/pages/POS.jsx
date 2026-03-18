import { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { Search, ShoppingCart, Trash2, CheckCircle, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function POS() {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  
  const [cart, setCart] = useState([]);
  const [descuento, setDescuento] = useState(0);
  const [metodoPago, setMetodoPago] = useState('efectivo');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        Api.get('/productos'),
        Api.get('/categorias')
      ]);
      // Solo mostrar productos con stock o sin stock pero visualmente
      setProductos(prodRes);
      setCategorias(catRes);
    } catch (error) {
      console.error('Error fetching data', error);
      alert('Error cargando el catálogo POS');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (prod) => {
    if (prod.stock_actual <= 0) {
      alert('Producto agotado');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item._id === prod._id);
      if (existing) {
        if (existing.qty >= prod.stock_actual) {
          alert('Stock máximo alcanzado');
          return prev;
        }
        return prev.map(item => item._id === prod._id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...prod, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = item.qty + delta;
        if (newQty < 1) return item;
        if (newQty > item.stock_actual) return item;
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + (item.precio_venta * item.qty), 0);
  const total = Math.max(0, subtotal - (parseFloat(descuento) || 0));

  const handleCobrar = async () => {
    if (cart.length === 0) return;
    
    try {
      const payload = {
        items: cart.map(item => ({ producto_id: item._id, cantidad: item.qty })),
        metodo_pago: metodoPago,
        descuento: parseFloat(descuento) || 0
      };
      
      await Api.post('/ventas', payload);
      alert('Venta registrada con éxito');
      clearCart();
      setDescuento(0);
      fetchData(); // Recargar stock real
    } catch (error) {
      alert(error.message || 'Error registrando la venta');
    }
  };

  const filteredProds = productos.filter(p => {
    const matchCat = selectedCat === 'all' || p.categoria_id?._id === selectedCat || p.categoria_id === selectedCat;
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="pos-container fade-in" style={{ height: 'calc(100vh - 120px)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px', overflow: 'hidden' }}>
      
      {/* LEFT PANEL */}
      <div className="pos-panel-left" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', background: 'var(--surface-1)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '16px', display: 'flex', gap: '16px' }}>
          <div className="search-wrap flex-1">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input w-full" 
              placeholder="Escanear SKU o buscar producto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '8px' }} className="hide-scroll">
          <button className={`btn-ghost ${selectedCat === 'all' ? 'active' : ''}`} style={{ background: selectedCat === 'all' ? 'var(--surface-2)' : '' }} onClick={() => setSelectedCat('all')}>Todos</button>
          {categorias.map(c => (
            <button key={c._id} className={`btn-ghost ${selectedCat === c._id ? 'active' : ''}`} style={{ background: selectedCat === c._id ? 'var(--surface-2)' : '', whiteSpace:'nowrap' }} onClick={() => setSelectedCat(c._id)}>{c.nombre}</button>
          ))}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Cargando catálogo...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {filteredProds.map(p => (
                <div 
                  key={p._id} 
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', cursor: p.stock_actual > 0 ? 'pointer' : 'not-allowed', opacity: p.stock_actual > 0 ? 1 : 0.6, position: 'relative' }}
                  onClick={() => addToCart(p)}
                  className="hover-card"
                >
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '4px' }}>{p.sku || 'N/A'}</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.nombre}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div style={{ color: 'var(--rose-deep)', fontWeight: 700 }}>${p.precio_venta}</div>
                    <div style={{ fontSize: '12px', color: p.stock_actual > 0 ? 'var(--ink-mid)' : 'var(--danger)' }}>Stock: {p.stock_actual}</div>
                  </div>
                </div>
              ))}
              {filteredProds.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>Ningún producto coincide con la búsqueda.</div>}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - CART */}
      <div className="pos-panel-right panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShoppingCart size={18}/> Venta Actual</h3>
          <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)' }} onClick={clearCart} disabled={cart.length === 0}>Vaciar</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)' }}>
              <Package size={48} style={{ marginBottom: '16px', opacity: 0.2 }}/>
              Añade productos para cobrar
            </div>
          ) : (
            cart.map(item => (
              <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed var(--border)' }}>
                <div style={{ flex: 1, paddingRight: '12px' }}>
                  <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>{item.nombre}</div>
                  <div style={{ color: 'var(--ink-muted)', fontSize: '12px' }}>${item.precio_venta} c/u</div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface-1)' }}>
                    <button style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => updateQty(item._id, -1)}>−</button>
                    <span style={{ fontSize: '13px', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                    <button style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => updateQty(item._id, 1)}>+</button>
                  </div>
                  <div style={{ fontWeight: 600, width: '60px', textAlign: 'right' }}>${(item.precio_venta * item.qty).toFixed(2)}</div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)' }} onClick={() => removeFromCart(item._id)}><Trash2 size={14}/></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '16px', background: 'var(--surface-1)', borderTop: '1px solid var(--border)', borderRadius: '0 0 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--ink-mid)' }}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <span style={{ color: 'var(--ink-mid)' }}>Descuento</span>
            <div className="input-prefix-wrap" style={{ width: '100px' }}>
              <span className="input-prefix">$</span>
              <input type="number" min="0" step="1" value={descuento} onChange={e => setDescuento(e.target.value)} style={{ padding: '4px', textAlign: 'right' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '20px', fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ color: 'var(--rose-deep)' }}>${total.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['efectivo', 'tarjeta', 'transferencia'].map(m => (
              <button 
                key={m}
                style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '8px', textTransform: 'capitalize', border: metodoPago === m ? '1px solid var(--blue)' : '1px solid var(--border)', background: metodoPago === m ? 'var(--blue-light)' : 'var(--surface-1)', color: metodoPago === m ? 'var(--blue-dark)' : 'var(--ink)' }}
                onClick={() => setMetodoPago(m)}
              >
                {m}
              </button>
            ))}
          </div>

          <button 
            className="btn-primary w-full" 
            style={{ padding: '16px', fontSize: '16px', justifyContent: 'center' }}
            disabled={cart.length === 0}
            onClick={handleCobrar}
          >
            <CheckCircle size={18} /> Cobrar ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
