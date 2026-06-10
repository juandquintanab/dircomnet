import { EmptyDash } from '../../../../components/primitives'
import RadBadge from '../shared/RadBadge'
import { calcProductoMetricas } from '../../utils/metricas'

function fmt(n) {
  return Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PropuestaProductoFila({ producto, onQuitar }) {
  const { precioGuardado, descuento, precioMercado, ahorro, precioLocutores, precioTotal } =
    calcProductoMetricas(producto)

  const emisora = producto.rad_emisora
  const locutores = (producto.rad_producto_x_locutor ?? [])
    .map((r) => r.rad_locutor?.nombre_locutor)
    .filter(Boolean)

  return (
    <tr>
      <td className="name">{producto.nombre_producto}</td>
      <td><RadBadge tipo={producto.tipo_producto} /></td>
      <td>{emisora?.nombre_emisora ?? <EmptyDash />}</td>
      <td>
        {locutores.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {locutores.map((l) => (
              <span key={l} className="pl-chip pl-chip--slate">{l}</span>
            ))}
          </div>
        ) : <EmptyDash />}
      </td>
      <td className="rad-col-num">Bs. {fmt(precioGuardado)}</td>
      <td className="rad-col-num">{descuento ? `${descuento}%` : <EmptyDash />}</td>
      <td className="rad-col-num">Bs. {fmt(precioMercado)}</td>
      <td className="rad-col-num" style={{ color: 'var(--status-success)' }}>Bs. {fmt(ahorro)}</td>
      <td className="rad-col-num rad-col-strong">Bs. {fmt(precioTotal)}</td>
      {onQuitar && (
        <td>
          <button
            type="button"
            className="pl-btn pl-btn--ghost pl-btn--s"
            onClick={() => onQuitar(producto.id)}
            aria-label="Quitar"
          >
            ×
          </button>
        </td>
      )}
    </tr>
  )
}
