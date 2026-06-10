export default function RadEmptyState({ mensaje = 'No hay registros', accion }) {
  return (
    <div className="rad-empty-state">
      <p className="rad-empty-state__msg">{mensaje}</p>
      {accion}
    </div>
  )
}
