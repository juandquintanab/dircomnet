import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/primitives';

function SystemTopbar({ sistema }) {
  const navigate = useNavigate();

  return (
    <header className="pl-topbar">
      <img
        className="pl-topbar__logo"
        src="/assets/logo-blanco-ep.png"
        alt="Empresas Polar"
      />
      <nav className="pl-topbar__crumb">
        <button
          type="button"
          className="pl-topbar__crumb-link"
          onClick={() => navigate('/')}
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
  return (
    <div className="pl-shell">
      <div className="pl-shell__topbar">
        <SystemTopbar sistema={sistema} />
      </div>
      <div className="pl-shell__sidebar">
        {sidebar ?? <SystemSidebar sistema={sistema} />}
      </div>
      <main className="pl-shell__main pl-page">
        {children}
      </main>
    </div>
  );
}
