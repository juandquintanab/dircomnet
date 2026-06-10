import { useMetricas } from '../../hooks/useMetricas'

function fmt(n) {
  return Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ProductoMetricas({ precioGuardado, descuentoAplicado, precioLocutores = 0 }) {
  const { precioMercado, ahorro } = useMetricas(precioGuardado, descuentoAplicado)
  const precioTotal = Number(precioGuardado || 0) + Number(precioLocutores || 0)

  return (
    <div className="rad-metricas pl-info">
      <div className="rad-metricas__item">
        <span className="label-field">Precio base</span>
        <span className="rad-metricas__val">Bs. {fmt(precioGuardado)}</span>
      </div>
      {precioLocutores > 0 && (
        <div className="rad-metricas__item">
          <span className="label-field">Locutores</span>
          <span className="rad-metricas__val">+ Bs. {fmt(precioLocutores)}</span>
        </div>
      )}
      <div className="rad-metricas__item">
        <span className="label-field">Total</span>
        <span className="rad-metricas__val rad-metricas__val--strong">Bs. {fmt(precioTotal)}</span>
      </div>
      <div className="rad-metricas__divider" />
      <div className="rad-metricas__item">
        <span className="label-field">Precio mercado</span>
        <span className="rad-metricas__val">Bs. {fmt(precioMercado)}</span>
      </div>
      <div className="rad-metricas__item">
        <span className="label-field">Ahorro</span>
        <span className="rad-metricas__val rad-metricas__val--ahorro">Bs. {fmt(ahorro)}</span>
      </div>
    </div>
  )
}
