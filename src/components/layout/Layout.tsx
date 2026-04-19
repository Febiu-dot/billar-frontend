import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function NavItem({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-gold text-felt-dark font-semibold'
            : 'text-chalk/70 hover:text-chalk hover:bg-felt-light/20'
        }`
      }
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: '🎱' },
    { to: '/admin/partidos', label: 'Partidos', icon: '⚔️' },
    { to: '/admin/sedes', label: 'Sedes', icon: '🏛️' },
    { to: '/admin/mesas', label: 'Mesas', icon: '🟩' },
    { to: '/admin/jugadores', label: 'Jugadores', icon: '👤' },
    { to: '/admin/fixture', label: 'Fixture', icon: '🏆' },
  ];

  const juezLinks = [
    { to: '/juez', label: 'Mi Sede', icon: '🎱' },
  ];

  const links = user?.role === 'admin' ? adminLinks : juezLinks;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-felt border-r border-felt-light/30 flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-felt-light/30">
          <h1 className="font-display text-3xl text-gold leading-none">BILLAR</h1>
          <p className="text-chalk/40 text-xs mt-1 font-mono">TORNEO MANAGER</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(l => <NavItem key={l.to} {...l} />)}
          <div className="pt-3 border-t border-felt-light/20 mt-3">
            <NavItem to="/publico" label="Vista Pública" icon="👁️" />
          </div>
        </nav>

        <div className="px-3 py-4 border-t border-felt-light/30">
          <div className="px-3 py-2 mb-2">
            <p className="text-chalk/50 text-xs">Conectado como</p>
            <p className="text-gold font-semibold text-sm truncate">{user?.username}</p>
            <p className="text-chalk/40 text-xs capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={handleLogout} className="w-full btn-secondary text-left text-xs">
            ↩ Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-felt-dark">
        <Outlet />
      </main>
    </div>
  );
}
