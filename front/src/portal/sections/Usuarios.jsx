import { Icon } from '../../components/primitives';

export default function Usuarios() {
  return (
    <div className="pl-placeholder">
      <span className="pl-placeholder__icon">
        <Icon name="users" size={40} />
      </span>
      <h1 className="pl-placeholder__title">Gestión de usuarios</h1>
      <p className="pl-placeholder__msg">
        Próximamente. Aquí podrás administrar los usuarios de la plataforma y
        definir qué sistemas puede ver cada uno.
      </p>
    </div>
  );
}
