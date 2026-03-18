import { useState, useEffect, useRef } from 'react';
import { Api } from '../services/api';
import { Plus, Search, Edit2, Trash2, Package, Printer, Barcode as BarcodeIcon } from 'lucide-react';
import JsBarcode from 'jsbarcode';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [colaboradoras, setColaboradoras] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', sku: '', categoria_id: '', tipo: 'consignacion', colaborador_id: '',
    precio_venta: '', precio_costo: '', stock_actual: 0, stock_minimo: 5, descripcion: '', imagen_url: ''
  });

  const barcodeRef = useRef(null);

  useEffect(() => {
    if (showModal && formData.sku) {
      setTimeout(() => {
        if (barcodeRef.current) {
          JsBarcode(barcodeRef.current, formData.sku, {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true
          });
        }
      }, 100);
    }
  }, [showModal, formData.sku]);

  const printBarcode = () => {
    const canvas = barcodeRef.current;
    if (!canvas) return;
    const windowPrint = window.open('', '', 'width=600,height=400');
    windowPrint.document.write('<html><head><title>Imprimir Código de Barras</title>');
    windowPrint.document.write('<style>body{display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:sans-serif;} img{width:300px;}</style>');
    windowPrint.document.write('</head><body>');
    windowPrint.document.write(`<h2>${formData.nombre}</h2>`);
    windowPrint.document.write(`<img src="${canvas.toDataURL()}"/>`);
    windowPrint.document.write(`<p>SKU: ${formData.sku}</p>`);
    windowPrint.document.write('</body></html>');
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 500);
  };

  useEffect(() => {
    fetchDependencias();
    fetchProductos();
  }, []);

  const fetchDependencias = async () => {
    try {
      const [cats, colabs] = await Promise.all([
        Api.get('/categorias'),
        Api.get('/colaboradores')
      ]);
      setCategorias(cats);
      setColaboradoras(colabs);
    } catch (err) {
      console.error('Error fetching dependencias', err);
    }
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await Api.get('/productos');
      setProductos(res);
    } catch (error) {
      console.error('Error fetching productos', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Comprimir a JPEG calidad media para no saturar MongoDB
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        setFormData(prev => ({ ...prev, imagen_url: base64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Limpiar campos vacios de foreing keys
      const dataToSave = { ...formData };
      if (!dataToSave.colaborador_id) delete dataToSave.colaborador_id;
      
      if (isEditing) {
        await Api.put(`/productos/${formData._id}`, dataToSave);
      } else {
        await Api.post('/productos', dataToSave);
      }
      setShowModal(false);
      fetchProductos();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await Api.delete(`/productos/${id}`);
      fetchProductos();
    } catch (error) {
      alert(error.message);
    }
  };

  const openEdit = (p) => {
    setIsEditing(true);
    setFormData({
      ...p,
      categoria_id: p.categoria_id?._id || p.categoria_id || '',
      colaborador_id: p.colaborador_id?._id || p.colaborador_id || ''
    });
    setShowModal(true);
  };

  const openNew = () => {
    setIsEditing(false);
    setFormData({
      nombre: '', sku: '', categoria_id: '', tipo: 'consignacion', colaborador_id: '',
      precio_venta: '', precio_costo: '', stock_actual: 0, stock_minimo: 5, descripcion: '', imagen_url: ''
    });
    setShowModal(true);
  };

  const filtered = productos.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchTipo = filterTipo ? p.tipo === filterTipo : true;
    return matchSearch && matchTipo;
  });

  return (
    <div className="fade-in">
      <div className="table-toolbar">
        <div className="filter-row">
          <div className="search-wrap">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input w-250" 
              placeholder="Buscar producto o SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="select-sm" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="consignacion">Consignación</option>
            <option value="propio">Propio</option>
          </select>
          <span className="count-label">{filtered.length} productos</span>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" onClick={openNew}>
            <Plus size={16}/> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Precio</th>
                <th>Origen</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Cargando datos...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>No se encontraron productos.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="colab-card-av" style={{ width: '32px', height: '32px', background: 'var(--surface-3)', border: 'none', color: 'var(--ink-mid)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.imagen_url ? <img src={p.imagen_url} alt="img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={14} />}
                        </div>
                        <div className="cell-primary" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                      </div>
                    </td>
                    <td><div className="cell-muted">{p.sku || '-'}</div></td>
                    <td><div className="badge badge-neutral">{p.categoria_id?.nombre || 'General'}</div></td>
                    <td>
                      <div className="stock-cell">
                        <span className={`stock-num ${p.stock_actual <= p.stock_minimo ? 'stock-critical' : ''}`}>{p.stock_actual}</span>
                        <div className="stock-bar"><div className="stock-fill" style={{ width: `${Math.min(100, (p.stock_actual/p.stock_minimo)*50)}%`, background: p.stock_actual <= p.stock_minimo ? 'var(--danger)' : 'var(--success)' }}></div></div>
                      </div>
                    </td>
                    <td><div className="cell-primary" style={{ color: 'var(--rose-deep)' }}>${p.precio_venta}</div></td>
                    <td>
                      {p.tipo === 'propio' ? <span className="badge badge-info">Propio</span> : <span className="badge badge-rose">Consigna</span>}
                      <div style={{ fontSize: '10px', color: 'var(--ink-muted)', marginTop: '4px' }}>{p.colaborador_id?.nombre || 'Tienda'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button className="row-action-btn" onClick={() => openEdit(p)} title="Editar"><Edit2 size={14}/></button>
                        <button className="row-action-btn" onClick={() => handleDelete(p._id)} style={{ color: 'var(--danger)' }} title="Eliminar"><Trash2 size={14} color="currentColor"/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal modal-md open">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <p className="modal-sub">Completa la información del artículo en el catálogo.</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form id="prodForm" onSubmit={handleSave}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: '100px', height: '100px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                    {formData.imagen_url ? (
                      <img src={formData.imagen_url} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--ink-muted)', fontSize: '10px' }}>
                        <Package size={24} style={{ margin: '0 auto 4px' }}/>
                        Sin Imagen
                      </div>
                    )}
                    <label style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '10px', textAlign: 'center', padding: '4px', cursor: 'pointer', margin: 0 }}>
                      Tomar / Subir
                      <input type="file" accept="image/*" capture="environment" style={{ opacity: 0, position: 'absolute', zIndex: -1 }} onChange={handleImageUpload} />
                    </label>
                  </div>
                  
                  <div className="form-field w-full" style={{ flex: 1, margin: 0 }}>
                    <label>Nombre *</label>
                    <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={{ marginBottom: '12px' }} />
                    
                    <label>SKU (Auto-generado si queda vacío)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" placeholder="Ej. LUNA-001" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} style={{ flex: 1 }} />
                    </div>
                  </div>
                </div>

                {formData.sku && (
                  <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #eee' }}>
                    <canvas ref={barcodeRef}></canvas>
                    <button type="button" className="btn-ghost" style={{ fontSize: '11px', marginTop: '4px' }} onClick={printBarcode}>
                      <Printer size={12} /> Imprimir Etiqueta
                    </button>
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Categoría *</label>
                    <select required value={formData.categoria_id} onChange={e => setFormData({...formData, categoria_id: e.target.value})}>
                      <option value="">Selecciona...</option>
                      {categorias.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Tipo</label>
                    <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                      <option value="consignacion">Consignación</option>
                      <option value="propio">Propio</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Colaboradora</label>
                    <select value={formData.colaborador_id} onChange={e => setFormData({...formData, colaborador_id: e.target.value})}>
                      <option value="">— Tienda propia —</option>
                      {colaboradoras.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Precio Venta *</label>
                    <div className="input-prefix-wrap">
                      <span className="input-prefix">$</span>
                      <input type="number" step="0.01" required value={formData.precio_venta} onChange={e => setFormData({...formData, precio_venta: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-field">
                    <label>Precio Costo</label>
                    <div className="input-prefix-wrap">
                      <span className="input-prefix">$</span>
                      <input type="number" step="0.01" value={formData.precio_costo} onChange={e => setFormData({...formData, precio_costo: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-field">
                    <label>Stock</label>
                    <input type="number" required value={formData.stock_actual} onChange={e => setFormData({...formData, stock_actual: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Stock Mínimo</label>
                    <input type="number" value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: e.target.value})} />
                  </div>
                  <div className="form-field full-span">
                    <label>Descripción</label>
                    <textarea rows="2" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}></textarea>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button form="prodForm" type="submit" className="btn-primary">Guardar Producto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
