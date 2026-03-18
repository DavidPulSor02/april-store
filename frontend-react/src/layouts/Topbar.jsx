import { Search, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Topbar({ user }) {
  const location = useLocation();

  // Mapear rutas a Títulos
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('colaboradoras')) return 'Colaboradoras';
    if (path.includes('productos')) return 'Catálogo de Productos';
    if (path.includes('categorias')) return 'Categorías';
    if (path.includes('ventas')) return 'Historial de Ventas';
    if (path.includes('pos')) return 'Punto de Venta';
    if (path.includes('consignaciones')) return 'Consignaciones';
    if (path.includes('pagos')) return 'Pagos a Colaboradoras';
    if (path.includes('contabilidad')) return 'Contabilidad';
    return 'Dashboard';
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-title">{getPageTitle()}</h1>
        <div className="breadcrumb">April Store / {getPageTitle()}</div>
      </div>
      
      <div className="topbar-right">
        {/* Futuro componente de Búsqueda Global */}
        <div className="search-wrap" style={{ display: 'none' }}>
          <Search className="search-icon" size={16} />
          <input type="text" className="search-input" placeholder="Buscar..." />
        </div>
        
        <div className="alert-badge">
          <Bell size={20} />
          {/* Aquí iría la lógica de punto rojo para alertas de stock */}
          <div className="badge-dot" />
        </div>
      </div>
    </header>
  );
}
