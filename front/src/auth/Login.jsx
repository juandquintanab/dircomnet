import { useNavigate } from 'react-router-dom';
import { Button } from '../components/primitives';
import './login.css';

export default function Login() {
  const navigate = useNavigate();

  function handleAccess() {
    // Fase 3: aquí irá el flujo real de Supabase Auth (login con correo corporativo).
    // Por ahora es un bypass temporal sin autenticación — navega directo al portal.
    navigate('/portal');
  }

  return (
    <div className="pl-login">
      <aside className="pl-login__brand">
        <div className="pl-login__brand-row">
          <img className="pl-login__logo" src="/assets/logo-blanco-ep.png" alt="Empresas Polar" />
          <span className="pl-login__build">Plataforma corporativa · v2.0</span>
        </div>

        <div className="pl-login__lede">
          <span className="pl-login__eyebrow">Acceso unificado</span>
          <h1>Una sola plataforma para toda la operación.</h1>
          <p>Gestiona periodistas, medios, campañas y reportes desde un solo lugar.</p>
        </div>

        <div className="pl-login__stats">
          <div className="pl-login__stat">
            <span className="pl-login__stat-v">742</span>
            <span className="pl-login__stat-l">Periodistas activos</span>
          </div>
          <div className="pl-login__stat pl-login__stat--yellow">
            <span className="pl-login__stat-v">128</span>
            <span className="pl-login__stat-l">Medios cubiertos</span>
          </div>
          <div className="pl-login__stat pl-login__stat--green">
            <span className="pl-login__stat-v">42%</span>
            <span className="pl-login__stat-l">Tasa de respuesta</span>
          </div>
        </div>

        <div className="pl-login__foot">
          <span className="pl-login__status">
            <span className="pl-login__pulse" />
            Todos los sistemas operativos
          </span>
          <span className="pl-login__copyright">© Empresas Polar · 2026</span>
        </div>
      </aside>

      <section className="pl-login__panel">
        <div className="pl-login__card">
          <Button variant="primary" size="l" onClick={handleAccess}>
            Accede con tu correo polar
          </Button>
          <p className="pl-login__support">
            En caso de que no puedas acceder a la plataforma, comunícate con{' '}
            <a href="mailto:comunicaciones.medios@empresaspolar.com">
              comunicaciones.medios@empresaspolar.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
