import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { NAV_PORTAL, USUARIO } from '../data/systems';
import { Icon } from '../components/primitives';
import './portal.css';

const STORAGE_KEY = 'dircom-sidebar-collapsed';

/* Ícono de ayuda — no existe en primitives.jsx, se mantiene local al portal */
function HelpIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/* ─── Header ─── */
function PortalHeader() {
  return (
    <header className="pl-portal__top">
      <div className="pl-portal__brand">
        <img src="/assets/logo-blanco-ep.png" alt="Empresas Polar" />
        <span className="pl-portal__brand-sep" />
        <span className="pl-portal__product">
          Dircom<i>NET</i>
        </span>
      </div>

      <span className="pl-portal__spacer" />

      <div className="pl-portal__search">
        <Icon name="search" size={14} />
        <span>Buscar sistemas, personas o reportes</span>
      </div>

      <button className="pl-portal__iconbtn" type="button" title="Ayuda" aria-label="Ayuda">
        <HelpIcon />
      </button>

      <button
        className="pl-portal__iconbtn"
        type="button"
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <Icon name="bell" size={16} />
        <span className="pl-portal__dot" />
      </button>

      <div className="pl-portal__avatar" title={USUARIO.nombre}>
        {USUARIO.iniciales}
      </div>
    </header>
  );
}

/* ─── Sidebar colapsable ─── */
function PortalSidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="pl-portal__sidebar" aria-label="Navegación principal">
      <div className="pl-portal__toggle-row">
        <button
          type="button"
          className="pl-portal__toggle"
          onClick={onToggle}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          aria-expanded={!collapsed}
        >
          <span className={`pl-portal__toggle-icon${collapsed ? '' : ' is-expanded'}`}>
            <Icon name="chevron-right" size={16} />
          </span>
        </button>
      </div>

      {NAV_PORTAL.map((item, i) =>
        item.divider ? (
          <span key={`div-${i}`} className="pl-portal__sidebar-divider" />
        ) : (
          <button
            key={item.id}
            type="button"
            className={`pl-portal__nav${location.pathname === item.ruta ? ' is-active' : ''}`}
            onClick={() => navigate(item.ruta)}
            title={item.label}
          >
            <Icon name={item.icono} size={18} />
            <span className="pl-portal__nav-label">{item.label}</span>
          </button>
        )
      )}
    </nav>
  );
}

export default function PortalLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* localStorage no disponible — el estado vive solo en memoria */
      }
      return next;
    });
  };

  return (
    <div className={`pl-portal${collapsed ? ' is-collapsed' : ''}`}>
      <PortalHeader />
      <PortalSidebar collapsed={collapsed} onToggle={toggle} />
      <main className="pl-portal__main">
        <Outlet />
      </main>
    </div>
  );
}
