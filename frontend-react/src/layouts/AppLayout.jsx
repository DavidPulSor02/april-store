import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user } = useAuth();
  
  if (!user) return null;

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
