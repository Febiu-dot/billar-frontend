import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function NavItem({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive ? 'sidebar-active' : 'sidebar-item'
        }`
      }
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: '◉' },
    { to: '/admin/partidos', label: 'Partidos', icon: '⚔' },
    { to: '/admin/sedes', label: 'Sedes', icon: '▣' },
    { to: '/admin/mesas', label: 'Mesas', icon: '▦' },
    { to: '/admin/jugadores', label: 'Jugadores', icon: '▶' },
    { to: '/admin/fixture', label: 'Fixture', icon: '◈' },
  ];

  const juezLinks = [
    { to: '/juez', label: 'Mi Sede', icon: '◉' },
  ];

  const links = user?.role === 'admin' ? adminLinks : juezLinks;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-carbon-50 border-r border-silver-muted/10 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-silver-muted/10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-snooker-red border-2 border-orange/50 flex items-center justify-center text-white text-xs font-bold">●</div>
            <div>
              <h1 className="font-display text-sm font-bold text-orange leading-tight uppercase tracking-wider">FBU</h1>
            </div>
          </div>
          <p className="text-silver-dark text-xs leading-tight">Federación de Billar del Uruguay</p>
          <p className="text-silver-muted text-xs">Sistema de Torneos</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {links.map(l => <NavItem key={l.to} {...l} />)}
          <div className="pt-3 border-t border-silver-muted/10 mt-3">
            <NavItem to="/publico" label="Vista Pública" icon="◎" />
          </div>
        </nav>

        <div className="px-3 py-4 border-t border-silver-muted/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-silver-muted text-xs">Conectado como</p>
            <p className="text-orange font-semibold text-sm truncate">{user?.username}</p>
            <p className="text-silver-dark text-xs capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={handleLogout} className="w-full btn-secondary text-left text-xs">
            ← Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-carbon-100">
        <Outlet />
      </main>
    </div>
  );
}
