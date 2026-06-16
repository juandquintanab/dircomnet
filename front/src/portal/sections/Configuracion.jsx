import { Icon } from '../../components/primitives';

export default function Configuracion() {
  return (
    <div className="pl-placeholder">
      <span className="pl-placeholder__icon">
        <Icon name="settings" size={40} />
      </span>
      <h1 className="pl-placeholder__title">Configuración</h1>
      <p className="pl-placeholder__msg">
        Próximamente. Aquí podrás gestionar la configuración de tu cuenta.
      </p>
    </div>
  );
}
