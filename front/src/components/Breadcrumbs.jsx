import { useNavigate } from 'react-router-dom';
import { Icon } from './primitives';

// Breadcrumb de módulo: jerarquía interna que se muestra bajo el breadcrumb del portal.
// items: [{ label, to? }] — el último ítem es la pantalla actual (no clickeable).
// Los ítems con `to` navegan a esa ruta; el resto se muestran como texto.
export default function Breadcrumbs({ items }) {
  const navigate = useNavigate();
  if (!items || items.length === 0) return null;

  return (
    <nav className="pl-subcrumb" aria-label="Ruta del módulo">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span className="pl-subcrumb__seg" key={`${item.label}-${i}`}>
            {item.to && !last ? (
              <button
                type="button"
                className="pl-subcrumb__link"
                onClick={() => navigate(item.to)}
              >
                {item.label}
              </button>
            ) : (
              <b className="pl-subcrumb__current" aria-current={last ? 'page' : undefined}>
                {item.label}
              </b>
            )}
            {!last && <Icon name="chevron-right" size={12} />}
          </span>
        );
      })}
    </nav>
  );
}
