import { useNavigate } from 'react-router-dom';
import { GERENCIAS, RESUMEN, METRICAS_GLOBALES, USUARIO } from '../data/systems';
import { Icon } from '../components/primitives';
import './portal.css';

/* ─── Hero: saludo + métricas globales ─── */
function PortalHero() {
  return (
    <section className="pl-portal__hero">
      <div className="pl-portal__greet">
        <h1>
          {USUARIO.saludo}, <span className="name">{USUARIO.nombre}</span>
        </h1>
        <p>{USUARIO.subtitulo}</p>
        <div className="pl-portal__meta-strip">
          {RESUMEN.map((m) => (
            <div key={m.id} className="pl-portal__meta">
              <span className="v">{m.valor}</span>
              <span className="l">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pl-portal__globals">
        <div className="pl-portal__globals-head">
          <span className="eyebrow">Métricas globales · 90 días</span>
          <button type="button" className="pl-portal__linklite">
            Ver todas <Icon name="chevron-right" size={12} />
          </button>
        </div>
        <div className="pl-portal__globals-grid">
          {METRICAS_GLOBALES.map((m) => (
            <div key={m.id} className={`pl-metric pl-metric--${m.tono}`}>
              <span className="pl-metric__lbl">{m.label}</span>
              <div className="pl-metric__v">
                {m.valor}
                {m.unidad && <span className="u">{m.unidad}</span>}
              </div>
              <svg
                className="pl-metric__spark"
                viewBox="0 0 100 22"
                preserveAspectRatio="none"
              >
                <polyline points={m.puntos} fill="none" strokeWidth="1.6" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Card de sistema ─── */
function SistemaCard({ sistema, onOpen }) {
  return (
    <article
      className="pl-syscard"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className={`pl-syscard__banner pl-syscard__banner--${sistema.banner}`}>
        <button
          type="button"
          className="pl-syscard__menu"
          aria-label="Opciones"
          onClick={(e) => e.stopPropagation()}
        >
          <Icon name="more" size={14} />
        </button>
        <span className="pl-syscard__acro">
          {sistema.codigo}
          <span>{sistema.nombre}</span>
        </span>
        <span className="pl-syscard__glyph">
          <Icon name={sistema.icono} size={110} />
        </span>
      </div>

      <div className="pl-syscard__body">
        <h3>{sistema.nombre}</h3>
        <p>{sistema.descripcion}</p>
      </div>

      <div className="pl-syscard__foot">
        <span className="pl-syscard__stat">
          <span className={`pl-syscard__d pl-syscard__d--${sistema.estadoTono}`} />
          {sistema.estado}
        </span>
        <div className="pl-syscard__acts">
          <button
            type="button"
            className="pl-syscard__act"
            title="Métricas"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="bar" size={13} />
          </button>
          <button
            type="button"
            className="pl-syscard__act"
            title="Configurar"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="settings" size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Card "Próximamente" (gerencias sin sistemas) ─── */
function ProximamenteCard() {
  return (
    <article className="pl-syscard is-locked">
      <span className="pl-syscard__tag">Próximamente</span>
      <div className="pl-syscard__banner pl-syscard__banner--slate">
        <span className="pl-syscard__glyph">
          <Icon name="grid" size={110} />
        </span>
      </div>
      <div className="pl-syscard__body">
        <h3>Próximamente</h3>
        <p>Esta gerencia estará disponible próximamente.</p>
      </div>
    </article>
  );
}

/* ─── Sección por gerencia ─── */
function GerenciaSection({ gerencia, onOpen }) {
  const proximamente = !!gerencia.proximamente;
  return (
    <section className="pl-portal__ger">
      <div className="pl-portal__ger-head">
        <div className={`pl-portal__ger-pic pl-portal__ger-pic--${gerencia.pic}`}>
          {gerencia.inicial}
        </div>
        <div>
          <h2>{gerencia.nombre}</h2>
          <span className="desc">{gerencia.descripcion}</span>
        </div>
        <span className="pl-portal__ger-count">
          {proximamente ? (
            'Próximamente'
          ) : (
            <>
              <b>{gerencia.sistemas.length}</b> sistemas
            </>
          )}
        </span>
      </div>

      <div className="pl-portal__cards">
        {proximamente ? (
          <ProximamenteCard />
        ) : (
          gerencia.sistemas.map((sistema) => (
            <SistemaCard
              key={sistema.id}
              sistema={sistema}
              onOpen={() => onOpen(sistema.ruta)}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default function Portal() {
  const navigate = useNavigate();

  return (
    <>
      <PortalHero />
      {GERENCIAS.map((gerencia) => (
        <GerenciaSection
          key={gerencia.id}
          gerencia={gerencia}
          onOpen={(ruta) => navigate(ruta)}
        />
      ))}
    </>
  );
}
