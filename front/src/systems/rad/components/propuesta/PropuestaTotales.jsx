function fmt(n) {
  return Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PropuestaTotales({ total, totalMercado, ahorroTotal }) {
  return (
    <div className="rad-propuesta-totales pl-info">
      <div className="rad-propuesta-totales__item">
        <span className="label-field">Precio total</span>
        <span className="rad-propuesta-totales__val">Bs. {fmt(total)}</span>
      </div>
      <div className="rad-propuesta-totales__sep" />
      <div className="rad-propuesta-totales__item">
        <span className="label-field">Precio mercado</span>
        <span className="rad-propuesta-totales__val">Bs. {fmt(totalMercado)}</span>
      </div>
      <div className="rad-propuesta-totales__sep" />
      <div className="rad-propuesta-totales__item">
        <span className="label-field">Ahorro total</span>
        <span className="rad-propuesta-totales__val rad-propuesta-totales__val--ahorro">
          Bs. {fmt(ahorroTotal)}
        </span>
      </div>
    </div>
  )
}
