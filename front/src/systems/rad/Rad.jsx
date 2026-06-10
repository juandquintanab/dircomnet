import { GERENCIAS } from '../../data/systems';
import SystemLayout from '../SystemLayout';

const sistema = GERENCIAS[0].sistemas.find((s) => s.id === 'rad');

export default function Rad() {
  return (
    <SystemLayout sistema={sistema}>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>{sistema.nombre}</h1>
          <span className="meta">
            <b>{sistema.codigo}</b> · Medios Pagos
          </span>
        </div>
      </div>
    </SystemLayout>
  );
}
