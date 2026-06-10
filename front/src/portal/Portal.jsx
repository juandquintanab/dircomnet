import { useNavigate } from 'react-router-dom';
import { GERENCIAS } from '../data/systems';
import { Icon } from '../components/primitives';
import './portal.css';

function PortalTopbar() {
  return (
    <header className="pl-topbar">
      <img
        className="pl-topbar__logo"
        src="/assets/logo-blanco-ep.png"
        alt="Empresas Polar"
      />
      <span className="pl-topbar__platform-name">DircomNET</span>
      <span className="pl-topbar__spacer" />
    </header>
  );
}

export default function Portal() {
  const navigate = useNavigate();

  return (
    <div className="pl-portal">
      <PortalTopbar />
      <main className="pl-page">
        {GERENCIAS.map((gerencia) => (
          <section key={gerencia.id} className="pl-portal__gerencia">
            <div className="pl-page__head">
              <div className="pl-page__title">
                <h1>{gerencia.nombre}</h1>
                <span className="meta">
                  GERENCIA · <b>{gerencia.sistemas.length} sistemas</b>
                </span>
              </div>
            </div>

            <div className="pl-tiles">
              {gerencia.sistemas.map((sistema) => (
                <button
                  key={sistema.id}
                  className="pl-tile"
                  onClick={() => navigate(sistema.ruta)}
                >
                  <span className="pl-tile__icon">
                    <Icon name={sistema.icono} />
                  </span>
                  <div className="pl-tile__meta">
                    <span className="pl-tile__codigo">{sistema.codigo}</span>
                    <h3>{sistema.nombre}</h3>
                  </div>
                  <p>{sistema.descripcion}</p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
