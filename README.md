# April Store — Sistema de Gestión

Sistema completo para tienda de accesorios con colaboradores/consignatarias.

## Stack
- **Backend**: Node.js + Express + Mongoose
- **Base de datos**: MongoDB
- **Frontend**: HTML + CSS + JS vanilla (compatible con Ionic)
- **Auth**: JWT

## Estructura del proyecto
```
april-store/
├── backend/
│   ├── models/index.js          # Todos los schemas Mongoose
│   ├── middleware/auth.js        # Autenticación JWT
│   ├── routes/
│   │   ├── auth.js               # Login / registro
│   │   ├── colaboradores.js      # CRUD colaboradoras + resumen
│   │   ├── productos.js          # CRUD productos + alertas stock
│   │   ├── ventas.js             # Ventas con transacciones atómicas
│   │   ├── categorias.js         # CRUD categorías
│   │   ├── consignaciones.js     # Control de consignación
│   │   ├── pagos.js              # Pagos a colaboradoras
│   │   ├── contabilidad.js       # Movimientos contables
│   │   └── dashboard.js          # KPIs y estadísticas
│   ├── server.js                 # Entrada principal
│   └── .env                      # Variables de entorno
└── frontend/
    ├── index.html                # SPA completa
    ├── css/app.css               # Design system completo
    └── js/
        ├── api.js                # Cliente HTTP
        └── app.js                # Lógica de la app + mock data

```

## Instalación y uso

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Configurar variables de entorno
Edita `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/april-store
JWT_SECRET=tu_secreto_aqui
```

### 3. Iniciar servidor
```bash
npm run dev      # Desarrollo (nodemon)
npm start        # Producción
```

### 4. Acceder al sistema
Abre http://localhost:3000 en Safari / Chrome.

**Credenciales demo**: admin@aprilstore.mx / admin123

## APIs REST disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/dashboard/resumen | KPIs del dashboard |
| GET | /api/colaboradores | Listar colaboradoras |
| GET | /api/colaboradores/:id/resumen | Ventas y comisiones |
| POST | /api/colaboradores | Nueva colaboradora |
| GET | /api/productos | Listar productos (filtros: tipo, estatus, q) |
| GET | /api/productos/alertas | Productos con stock bajo |
| POST | /api/productos | Nuevo producto |
| PATCH | /api/productos/:id/stock | Ajustar stock |
| GET | /api/ventas | Listar ventas |
| POST | /api/ventas | Registrar venta (transacción atómica) |
| PATCH | /api/ventas/:id/cancelar | Cancelar venta |
| GET | /api/consignaciones | Lotes de consignación |
| POST | /api/consignaciones | Registrar entrada |
| GET | /api/pagos | Pagos a colaboradoras |
| POST | /api/pagos | Crear pago |
| PATCH | /api/pagos/:id/liquidar | Marcar como pagado |
| GET | /api/contabilidad | Movimientos contables |
| GET | /api/contabilidad/resumen | Balance del mes |
| POST | /api/contabilidad | Movimiento manual |

## Próximos pasos
- [ ] Integrar con Ionic para PWA (iOS / Android)
- [ ] Módulo de reportes PDF
- [ ] Notificaciones push de stock bajo
- [ ] Respaldo automático en la nube
