import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import Swal from 'sweetalert2'
import './index.css'

window.alert = (message) => {
  const msgStr = String(message || '');
  const isError = msgStr.toLowerCase().includes('error') || msgStr.toLowerCase().includes('problema') || msgStr.toLowerCase().includes('inválido');
  const isWarning = msgStr.toLowerCase().includes('no hay') || msgStr.toLowerCase().includes('agotado') || msgStr.toLowerCase().includes('sin sku');
  const isSuccess = msgStr.toLowerCase().includes('éxito') || msgStr.toLowerCase().includes('completada') || msgStr.toLowerCase().includes('enviado');
  
  let icon = 'info';
  let title = 'Información';
  
  if (isError) { icon = 'error'; title = '¡Ups!'; }
  else if (isWarning) { icon = 'warning'; title = 'Atención'; }
  else if (isSuccess) { icon = 'success'; title = '¡Éxito!'; }

  Swal.fire({
    title,
    text: msgStr,
    icon,
    background: 'var(--surface)',
    color: 'var(--ink)',
    confirmButtonText: 'Aceptar',
    buttonsStyling: false,
    customClass: {
      popup: 'swal-custom-popup',
      title: 'page-title',
      confirmButton: 'btn-primary'
    }
  });
};

window.appConfirm = async (message) => {
  const isDanger = message.toLowerCase().includes('eliminar') || message.toLowerCase().includes('borrarán');
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: message,
    icon: isDanger ? 'warning' : 'question',
    background: 'var(--surface)',
    color: 'var(--ink)',
    showCancelButton: true,
    confirmButtonText: isDanger ? 'Sí, eliminar' : 'Sí, confirmar',
    cancelButtonText: 'Cancelar',
    buttonsStyling: false,
    customClass: {
      popup: 'swal-custom-popup',
      title: 'page-title',
      confirmButton: isDanger ? 'btn-primary bg-danger' : 'btn-primary',
      cancelButton: 'btn-ghost'
    }
  });
  return result.isConfirmed;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
