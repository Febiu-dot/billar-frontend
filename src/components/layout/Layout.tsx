import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

function NavItem({ a, etiqueta, icono }: { a: string; etiqueta: string; icono: string }) {
  return (
    <NavLink
      to={a}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150${
          isActive ? ' sidebar-item-active' : ' sidebar-item'
        }`
      }
    >
      <span className="text-base">{icono}</span>
      <span>{etiqueta}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navegar_por = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLogout = () => {
    cerrar_sesion();
    navegar_por('/acceso');
  };

  const adminLinks = [
    { a: '/admin', etiqueta: 'Panel Principal', icono: 'o' },
    { a: '/admin/partidos', etiqueta: 'Partidos', icono: 'x' },
    { a: '/admin/sedes', etiqueta: 'Sedes', icono: 's' },
    { a: '/admin/mesas', etiqueta: 'Mesas', icono: 'm' },
    { a: '/admin/jugadores', etiqueta: 'Jugadores', icono: 'j' },
    { a: '/admin/fixture', etiqueta: 'Fixture', icono: 'f' },
  ];

  const juezLinks = [
    { a: '/juez', etiqueta: 'Mi Sede', icono: 'o' },
  ];

  const isJuez = user?.role === 'juez_sede';
const handleLogout = () => { logout(); navigate('/login'); };
// y donde muestra: {user?.username} y {user?.role}
  const links = isJuez ? juezLinks : adminLinks;

  const SidebarContent = () => (
    <>
      <div className="px-4 py-4 border-b border-gray-700 flex items-center space-x-3">
        <img src="/logo-febiu.png" alt="FEBIU" className="w-12 h-12 object-cover rounded-full" />
        <div>
          <p className="text-orange-400 font-bold text-sm uppercase">FEBIU</p>
          <p className="text-gray-400 text-xs">Federacion de Billar</p>
          <p className="text-gray-400 text-xs">del Uruguay</p>
          <p className="text-gray-500 text-xs">Sistema de Torneos</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(l => <NavItem key={l.a} {...l} />)}
        {!isJuez && (
          <div className="pt-3 border-t border-gray-700 mt-3">
            <NavItem a="/publico" etiqueta="Vista Publica" icono="p" />
          </div>
        )}
      </nav>
      <div className="px-3 py-4 border-t border-gray-700">
        <div className="px-3 py-2 mb-2">
          <p className="text-gray-500 text-xs">Conectado como</p>
          <p className="text-orange-400 font-semibold text-sm">{usuario?.nombre_de_usuario}</p>
          <p className="text-gray-400 text-xs uppercase">{usuario?.role}</p>
        </div>
        <button onClick={handleLogout} className="w-full btn-secondary text-left text-xs">
          Cerrar sesion
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex w-60 bg-carbon-50 border-r border-gray-700 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-carbon-50 border-r border-gray-700 flex flex-col flex-shrink-0 z-30 transition-transform duration-300 md:hidden ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={() => setMenuAbierto(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-orange-400 text-xl z-40"
        >
          X
        </button>
        <SidebarContent />
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-carbon-50 border-b border-gray-700 flex-shrink-0">
          <button
            onClick={() => setMenuAbierto(true)}
            className="text-orange-400 text-2xl leading-none"
          >
            =
          </button>
          <img src="/logo-febiu.png" alt="FEBIU" className="w-8 h-8 object-cover rounded-full" />
          <span className="text-orange-400 font-bold text-sm uppercase">FEBIU</span>
        </header>
        <main className="flex-1 overflow-y-auto bg-carbon-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
