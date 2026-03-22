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
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import aprilLogo from '../assets/april_logo.png';

export default function Sidebar({ user, isCollapsed, setIsCollapsed }) {
  const { logout } = useAuth();
  const isAdmin = user?.rol === 'admin';

  return (
    <aside className="sidebar">
      <div className="sidebar-top" style={{ display: 'flex', justifyContent: 'center', padding: isCollapsed ? '24px 0' : '32px 18px 28px', transition: 'padding 0.3s' }}>
        <div className="sidebar-logo-container" style={{ 
          width: isCollapsed ? '48px' : '110px', 
          height: isCollapsed ? '48px' : '110px', 
          borderRadius: '50%', 
          overflow: 'hidden', 
          boxShadow: '0 8px 24px -4px rgba(159, 18, 57, 0.25)', 
          border: '2px solid var(--rose-pale)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          transition: 'all 0.3s ease'
        }}>
          <img 
            src={aprilLogo} 
            alt="April Store" 
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 40%',
              transform: 'scale(1.05)'
            }} 
          />
        </div>
      </div>

      <button className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <div className="nav-group-label">Principal</div>
          <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} title="Dashboard">
            <LayoutDashboard className="nav-icon" /> <span className="nav-text">Dashboard</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/colaboradoras" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} title="Colaboradoras">
              <Users className="nav-icon" /> <span className="nav-text">Colaboradoras</span>
            </NavLink>
          )}
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Catálogo</div>
          {isAdmin && (
            <NavLink to="/categorias" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} title="Categorías">
              <Tags className="nav-icon" /> <span className="nav-text">Categorías</span>
            </NavLink>
          )}
          <NavLink to="/productos" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} title="Productos">
            <Package className="nav-icon" /> <span className="nav-text">Productos</span>
          </NavLink>
          <NavLink to="/consignaciones" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} title="Consignaciones">
            <ArrowRightLeft className="nav-icon" /> <span className="nav-text">Consignaciones</span>
          </NavLink>
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Operación</div>
          <NavLink to="/pos" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} title="Punto de Venta">
            <ShoppingCart className="nav-icon" /> <span className="nav-text">Punto de Venta</span>
          </NavLink>
          <NavLink to="/ventas" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} title="Ventas">
            <TrendingUp className="nav-icon" /> <span className="nav-text">Ventas</span>
          </NavLink>
        </div>

        {isAdmin && (
          <div className="nav-group">
            <div className="nav-group-label">Finanzas & Admin</div>
            <NavLink to="/pagos" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} title="Pagos a Colaboradoras">
              <CircleDollarSign className="nav-icon" /> <span className="nav-text">Pagos Colab.</span>
            </NavLink>
            <NavLink to="/contabilidad" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} title="Contabilidad">
              <TrendingUp className="nav-icon" /> <span className="nav-text">Contabilidad</span>
            </NavLink>
            <NavLink to="/usuarios" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} title="Usuarios">
              <Users className="nav-icon" /> <span className="nav-text">Usuarios (Cajeras)</span>
            </NavLink>
            <NavLink to="/configuracion" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} title="Configuración">
              <Settings className="nav-icon" /> <span className="nav-text">Configuración</span>
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-pill mb-2">
          <div className="user-avatar">{user?.nombre?.charAt(0)}</div>
          {!isCollapsed && (
            <div className="user-info">
              <div className="user-name">{user?.nombre}</div>
              <div className="user-role">{isAdmin ? 'Administradora' : 'Cajera'}</div>
            </div>
          )}
        </div>
        <button className="nav-item logout-btn" onClick={logout} title="Cerrar Sesión">
          <LogOut className="nav-icon" /> <span className="nav-text">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
