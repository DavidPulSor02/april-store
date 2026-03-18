import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
// Modulos a crear
import Colaboradoras from './pages/Colaboradoras';

// Placeholders temporales
const Placeholder = ({ title }) => <div style={{ padding: '24px' }}><h2>{title} en construcción</h2><p>Este módulo será portado a React muy pronto.</p></div>;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Rutas Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/colaboradoras" element={<Colaboradoras />} />
          <Route path="/categorias" element={<Placeholder title="Categorías" />} />
          <Route path="/productos" element={<Placeholder title="Productos" />} />
          <Route path="/consignaciones" element={<Placeholder title="Consignaciones" />} />
          <Route path="/pos" element={<Placeholder title="Punto de Venta" />} />
          <Route path="/ventas" element={<Placeholder title="Ventas" />} />
          <Route path="/pagos" element={<Placeholder title="Pagos" />} />
          <Route path="/contabilidad" element={<Placeholder title="Contabilidad" />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
