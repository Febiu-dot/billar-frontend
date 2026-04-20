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

export default function Disposicion() {
  const { usuario, cerrar_sesion } = useAuth();
  const navegar_por = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const gestionar_el_cierre_de_sesion = () => { cerrar_sesion(); navegar_por('/acceso'); };

  const adminLinks = [
    { a: '/administración', etiqueta: 'Panel Principal', icono: '◉' },
    { a: '/admin/partidos',  etiqueta: 'Partidos',
