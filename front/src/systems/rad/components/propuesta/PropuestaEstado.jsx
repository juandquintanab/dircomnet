const ESTADO_TONE = {
  borrador: 'slate',
  enviada: 'blue',
  aprobada: 'green',
  rechazada: 'red',
}

const ESTADO_LABEL = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

export default function PropuestaEstado({ estado }) {
  const tone = ESTADO_TONE[estado] ?? 'slate'
  return (
    <span className={`pl-chip pl-chip--${tone}`}>
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  )
}
