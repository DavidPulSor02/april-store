import { Package, Users, ShoppingCart, TrendingUp, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dash-welcome">
      <div className="dash-welcome-icon">
        <Store size={36} />
      </div>
      <h2 className="dash-welcome-title">Te damos la bienvenida al nuevo sistema</h2>
      <p className="dash-welcome-sub">
        Gestiona tus ventas, controla el inventario y calcula las comisiones de tus colaboradoras de manera rápida y elegante.
      </p>

      <div className="dash-quick-links">
        <button className="dash-quick-btn" onClick={() => navigate('/productos')}>
          <Package size={18} /> Agregar producto
        </button>
        <button className="dash-quick-btn" onClick={() => navigate('/colaboradoras')}>
          <Users size={18} /> Agregar colaboradora
        </button>
        <button className="dash-quick-btn" onClick={() => navigate('/pos')} style={{ color: 'var(--rose)', borderColor: 'var(--rose)' }}>
          <ShoppingCart size={18} /> Ir al Punto de Venta
        </button>
        <button className="dash-quick-btn" onClick={() => navigate('/ventas')}>
          <TrendingUp size={18} /> Ver ventas
        </button>
      </div>
    </div>
  );
}
