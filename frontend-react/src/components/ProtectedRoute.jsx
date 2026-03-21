import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import aprilLogo from '../assets/april_logo.png';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="april-loader-container">
        <div className="april-loader-logo-wrapper">
          <img src={aprilLogo} alt="Cargando April Store" className="april-loader-logo" />
        </div>
        <div className="april-loader-text">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
