import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Colaboradoras from './pages/Colaboradoras';
import Categorias from './pages/Categorias';
import Productos from './pages/Productos';
import Consignaciones from './pages/Consignaciones';
import POS from './pages/POS';
import Ventas from './pages/Ventas';
import Pagos from './pages/Pagos';
import Contabilidad from './pages/Contabilidad';
import Usuarios from './pages/Usuarios';

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
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/consignaciones" element={<Consignaciones />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/pagos" element={<Pagos />} />
          <Route path="/contabilidad" element={<Contabilidad />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
