import { Icon } from '../../components/primitives';

export default function Asistente() {
  return (
    <div className="pl-placeholder">
      <span className="pl-placeholder__icon">
        <Icon name="sparkles" size={40} />
      </span>
      <h1 className="pl-placeholder__title">DircomBOT</h1>
      <p className="pl-placeholder__msg">
        Próximamente. Aquí estará el asistente de inteligencia artificial de la
        Dirección de Comunicaciones.
      </p>
    </div>
  );
}
