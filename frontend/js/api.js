/* api.js — Cliente HTTP centralizado */
const API_BASE = '/api';

const Api = {
  _token: () => localStorage.getItem('april_token'),

  _headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = this._token();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },

  async _req(method, path, body) {
    const opts = { method, headers: this._headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, message: data.message || 'Error desconocido' };
    return data;
  },

  get:    (path)       => Api._req('GET',    path),
  post:   (path, body) => Api._req('POST',   path, body),
  put:    (path, body) => Api._req('PUT',    path, body),
  patch:  (path, body) => Api._req('PATCH',  path, body),
  delete: (path)       => Api._req('DELETE', path),

  // Auth
  login:  (email, password) => Api.post('/auth/login', { email, password }),
  me:     ()                => Api.get('/auth/me'),

  // Dashboard
  dashboard: () => Api.get('/dashboard/resumen'),

  // Colaboradores
  colaboradores:         (q)   => Api.get(`/colaboradores${q || ''}`),
  colaborador:           (id)  => Api.get(`/colaboradores/${id}`),
  colaboradorResumen:    (id)  => Api.get(`/colaboradores/${id}/resumen`),
  crearColaborador:      (d)   => Api.post('/colaboradores', d),
  actualizarColaborador: (id, d) => Api.put(`/colaboradores/${id}`, d),

  // Categorias
  categorias:    ()      => Api.get('/categorias'),
  crearCategoria:(d)     => Api.post('/categorias', d),

  // Productos
  productos:         (q) => Api.get(`/productos${q || ''}`),
  producto:          (id)=> Api.get(`/productos/${id}`),
  alertasStock:      ()  => Api.get('/productos/alertas'),
  crearProducto:     (d) => Api.post('/productos', d),
  actualizarProducto:(id,d)=>Api.put(`/productos/${id}`, d),

  // Ventas
  ventas:     (q)  => Api.get(`/ventas${q || ''}`),
  venta:      (id) => Api.get(`/ventas/${id}`),
  crearVenta: (d)  => Api.post('/ventas', d),
  cancelarVenta:(id)=>Api.patch(`/ventas/${id}/cancelar`),

  // Contabilidad
  movimientos:       (q) => Api.get(`/contabilidad${q || ''}`),
  resumenContable:   ()  => Api.get('/contabilidad/resumen'),
  crearMovimiento:   (d) => Api.post('/contabilidad', d),

  // Consignaciones
  consignaciones:    (q) => Api.get(`/consignaciones${q || ''}`),
  crearConsignacion: (d) => Api.post('/consignaciones', d),

  // Pagos
  pagos:             (q) => Api.get(`/pagos${q || ''}`),
  crearPago:         (d) => Api.post('/pagos', d),
  liquidarPago:      (id,d)=>Api.patch(`/pagos/${id}/liquidar`, d),
};
