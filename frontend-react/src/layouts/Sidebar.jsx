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
      <div className="sidebar-top" style={{ display: 'flex', justifyContent: 'center', padding: '32px 18px 28px' }}>
        <div style={{ 
          width: '110px', 
          height: '110px', 
          borderRadius: '50%', 
          overflow: 'hidden', 
          boxShadow: '0 8px 24px -4px rgba(159, 18, 57, 0.25)', 
          border: '2px solid var(--rose-pale)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff'
        }}>
          <img 
            src={aprilLogo} 
            alt="April Store" 
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scale(1.45) translateY(14%)'
            }} 
          />
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
