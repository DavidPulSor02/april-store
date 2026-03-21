import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Tags, 
  Package, 
  ArrowRightLeft, 
  ShoppingCart, 
  CircleDollarSign,
  TrendingUp,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import aprilLogo from '../assets/april_logo.png';

export default function Sidebar({ user }) {
  const { logout } = useAuth();
  const isAdmin = user?.rol === 'admin';

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <img src={aprilLogo} alt="April Store" width="36" height="36" style={{ borderRadius: '50%' }} />
          <div>
            <div className="brand-name">April Store</div>
            <div className="brand-sub">Management</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <div className="nav-group-label">Principal</div>
          <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard className="nav-icon" /> Dashboard
          </NavLink>
          {isAdmin && (
            <NavLink to="/colaboradoras" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users className="nav-icon" /> Colaboradoras
            </NavLink>
          )}
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Catálogo</div>
          {isAdmin && (
            <NavLink to="/categorias" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Tags className="nav-icon" /> Categorías
            </NavLink>
          )}
          <NavLink to="/productos" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Package className="nav-icon" /> Productos
          </NavLink>
          <NavLink to="/consignaciones" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <ArrowRightLeft className="nav-icon" /> Consignaciones
          </NavLink>
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Operación</div>
          <NavLink to="/pos" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShoppingCart className="nav-icon" /> Punto de Venta
          </NavLink>
          <NavLink to="/ventas" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <TrendingUp className="nav-icon" /> Ventas
          </NavLink>
        </div>

        {isAdmin && (
          <div className="nav-group">
            <div className="nav-group-label">Finanzas & Admin</div>
            <NavLink to="/pagos" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <CircleDollarSign className="nav-icon" /> Pagos Colab.
            </NavLink>
            <NavLink to="/contabilidad" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <TrendingUp className="nav-icon" /> Contabilidad
            </NavLink>
            <NavLink to="/usuarios" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users className="nav-icon" /> Usuarios (Cajeras)
            </NavLink>
            <NavLink to="/configuracion" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Settings className="nav-icon" /> Configuración
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-pill mb-2">
          <div className="user-avatar">{user?.nombre?.charAt(0)}</div>
          <div className="user-info">
            <div className="user-name">{user?.nombre}</div>
            <div className="user-role">{user?.rol === 'admin' ? 'Administradora' : 'Cajera'}</div>
          </div>
        </div>
        <button className="nav-item" onClick={logout} style={{ color: 'var(--danger)', marginTop: '8px' }}>
          <LogOut className="nav-icon" style={{ color: 'var(--danger)' }} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
