import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CajeraLayout from './CajeraLayout';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) return null;

  // Enrutamiento Estricto para el Rol de Cajera
  if (user.rol === 'cajera') {
    // Si intenta acceder a cualquier cosa que no sea el POS, devolverla al POS
    if (location.pathname !== '/pos') {
      return <Navigate to="/pos" replace />;
    }
    // Si está en '/pos', renderizar su layout super-minimalista
    return <CajeraLayout />;
  }

  // Layout normal de Administrador con Sidebars
  return (
    <div className="app">
      <Sidebar user={user} />
      
      <main className="main-content">
        <Topbar user={user} />
        
        <div className="pages-wrap">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
