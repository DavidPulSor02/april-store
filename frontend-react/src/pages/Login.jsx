import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import aprilLogo from '../assets/april_logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor llena todos los campos.');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <img 
            src={aprilLogo} 
            alt="April Store" 
            style={{ 
              width: '40px', 
              height: '40px', 
              objectFit: 'cover', 
              borderRadius: '50%' 
            }} 
          />
          <span className="login-brand" style={{ fontSize: '26px' }}>April Store</span>
        </div>
        <h1 className="login-title">Bienvenida de vuelta</h1>
        <p className="login-sub">Ingresa tus credenciales para continuar</p>
        
        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-field">
            <label>Correo electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aprilstore.mx" 
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div className="form-field">
            <label>Contraseña</label>
            <div className="input-action-wrap" style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                autoComplete="current-password" 
                className="full-width"
                disabled={loading}
              />
              <button 
                type="button" 
                className="icon-btn-abs" 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <p className="login-hint">¿Olvidaste tu contraseña? Contacta a soporte.</p>
      </div>
    </div>
  );
}
