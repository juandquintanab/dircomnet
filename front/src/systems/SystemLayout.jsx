import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/primitives';
import Breadcrumbs from '../components/Breadcrumbs';

// Contexto del breadcrumb de módulo: cada pantalla declara su jerarquía y el
// layout la pinta bajo el breadcrumb del portal. Evita prop-drilling por las rutas.
const BreadcrumbsContext = createContext(null);

// Misma key que el portal: la preferencia de sidebar (expandido/colapsado) es única.
const SIDEBAR_STORAGE_KEY = 'dircom-sidebar-collapsed';

// Hook para que una pantalla de detalle/creación declare su breadcrumb de módulo.
// items: [{ label, to? }]. Se limpia al desmontar (los listados no llaman al hook).
export function useBreadcrumbs(items) {
  const ctx = useContext(BreadcrumbsContext);
  const serialized = JSON.stringify(items ?? []);
  useEffect(() => {
    if (!ctx) return undefined;
    ctx.set(items ?? []);
    return () => ctx.set([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, serialized]);
}

function SystemTopbar({ sistema, collapsed, onToggle }) {
  const navigate = useNavigate();

  return (
    <header className="pl-topbar">
      <button
        type="button"
        className="pl-topbar__toggle"
        onClick={onToggle}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        aria-expanded={!collapsed}
      >
        <span className={`pl-topbar__toggle-icon${collapsed ? '' : ' is-expanded'}`}>
          <Icon name="chevron-right" size={16} />
        </span>
      </button>
      <img
        className="pl-topbar__logo"
        src="/assets/logo-blanco-ep.png"
        alt="Empresas Polar"
      />
      <nav className="pl-topbar__crumb">
        <button
          type="button"
          className="pl-topbar__crumb-link"
          onClick={() => navigate('/portal')}
        >
          Portal
        </button>
        <Icon name="chevron-right" size={12} />
        <b>{sistema.nombre}</b>
      </nav>
      <span className="pl-topbar__spacer" />
    </header>
  );
}

function SystemSidebar({ sistema }) {
  return (
    <aside className="pl-sidebar">
      <div className="pl-sidebar__group">{sistema.codigo}</div>
    </aside>
  );
}

export default function SystemLayout({ sistema, children, sidebar }) {
  const [crumbs, setCrumbs] = useState([]);
  const ctxValue = useMemo(() => ({ set: setCrumbs }), []);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        /* localStorage no disponible — el estado vive solo en memoria */
      }
      return next;
    });
  };

  return (
    <BreadcrumbsContext.Provider value={ctxValue}>
      <div className={`pl-shell${collapsed ? ' is-collapsed' : ''}`}>
        <div className="pl-shell__topbar">
          <SystemTopbar sistema={sistema} collapsed={collapsed} onToggle={toggleSidebar} />
        </div>
        <div className="pl-shell__sidebar">
          {sidebar ?? <SystemSidebar sistema={sistema} />}
        </div>
        <div className="pl-shell__main">
          <Breadcrumbs items={crumbs} />
          <main className="pl-page">
            {children}
          </main>
        </div>
      </div>
    </BreadcrumbsContext.Provider>
  );
}
